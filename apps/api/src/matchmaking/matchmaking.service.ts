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

// Atomically: skip past self/blocked/already-in-a-session candidates (discarding
// stale ones, re-queueing valid skips), pop a valid match if one exists, else
// enqueue self. Avoids double-queueing via the per-user member key, and refuses
// to queue/match anyone (self or candidate) who already has a live session --
// two overlapping join_queue calls for the same user (e.g. a server-triggered
// requeue racing the client's own Queue-page-mount emit) could otherwise leave
// a phantom queue entry for someone who's already paired up, which a totally
// unrelated third user would then be wrongly matched with later.
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
    -- Stale entry: this candidate is already in a live session elsewhere.
    -- Discard rather than re-queue -- putting them back would just perpetuate
    -- the same phantom-match risk for the next person who queues.
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
