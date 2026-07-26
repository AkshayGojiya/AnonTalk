import { Inject, Injectable } from "@nestjs/common";
import type { Redis } from "ioredis";
import { REDIS_CLIENT } from "../redis/redis.constants";
import { blocklistKey, sessionByUserKey } from "../redis/pubsub.constants";

const QUEUE_KEY = "queue:waiting";
const QUEUE_MEMBER_TTL_SECONDS = 30;
const MAX_CANDIDATE_ATTEMPTS = 5;

function memberKey(userId: string) {
  return `queue:member:${userId}`;
}

// Atomically skips self/blocked/already-in-a-session candidates, pops a match
// if one exists, else enqueues self. Refuses to queue/match anyone who
// already has a live session, to avoid phantom re-matches.
const JOIN_OR_MATCH_SCRIPT = `
local queueKey = KEYS[1]
local memberKey = KEYS[2]
local blocklistKey = KEYS[3]
local selfSessionKey = KEYS[4]
local selfId = ARGV[1]
local maxAttempts = tonumber(ARGV[2])
local memberTtl = ARGV[3]

if redis.call('EXISTS', memberKey) == 1 then
  return false
end

if redis.call('EXISTS', selfSessionKey) == 1 then
  return false
end

local skipped = {}
local matchedId = nil

for i = 1, maxAttempts do
  local candidate = redis.call('LPOP', queueKey)
  if not candidate then
    break
  end
  if candidate == selfId then
    table.insert(skipped, candidate)
  elseif redis.call('SISMEMBER', blocklistKey, candidate) == 1 then
    table.insert(skipped, candidate)
  elseif redis.call('EXISTS', 'session:by-user:' .. candidate) == 1 then
    -- Stale entry already in a live session elsewhere; discard, don't re-queue.
    redis.call('DEL', 'queue:member:' .. candidate)
  else
    matchedId = candidate
    break
  end
end

for i = #skipped, 1, -1 do
  redis.call('LPUSH', queueKey, skipped[i])
end

if matchedId then
  redis.call('DEL', 'queue:member:' .. matchedId)
  return matchedId
else
  redis.call('RPUSH', queueKey, selfId)
  redis.call('SET', memberKey, '1', 'EX', memberTtl)
  return false
end
`;

export type JoinQueueResult = { status: "queued" } | { status: "matched"; peerId: string };

@Injectable()
export class MatchmakingService {
  constructor(@Inject(REDIS_CLIENT) private readonly redis: Redis) {}

  async joinQueue(userId: string): Promise<JoinQueueResult> {
    const result = (await this.redis.eval(
      JOIN_OR_MATCH_SCRIPT,
      4,
      QUEUE_KEY,
      memberKey(userId),
      blocklistKey(userId),
      sessionByUserKey(userId),
      userId,
      MAX_CANDIDATE_ATTEMPTS,
      QUEUE_MEMBER_TTL_SECONDS,
    )) as string | null;

    if (result) {
      return { status: "matched", peerId: result };
    }
    return { status: "queued" };
  }

  async leaveQueue(userId: string): Promise<void> {
    const pipeline = this.redis.pipeline();
    pipeline.lrem(QUEUE_KEY, 0, userId);
    pipeline.del(memberKey(userId));
    await pipeline.exec();
  }
}
