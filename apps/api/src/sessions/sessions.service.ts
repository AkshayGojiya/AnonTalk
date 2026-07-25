import { randomUUID } from "node:crypto";
import { Inject, Injectable } from "@nestjs/common";
import type { PeerIdentity } from "@anontalk/shared";
import type { Redis } from "ioredis";
import { REDIS_CLIENT } from "../redis/redis.constants";

const SESSION_TTL_SECONDS = 60 * 60;
const BUFFER_TTL_SECONDS = 60 * 60 * 6;
const BUFFER_MAX_LENGTH = 50;
const DISCONNECT_GRACE_MS = 15_000;

const GRACE_ZSET_KEY = "disconnect-grace-zset";

export interface SessionRecord {
  sessionId: string;
  userA: string;
  userB: string;
  startedAt: string;
  peerIdentityA: PeerIdentity;
  peerIdentityB: PeerIdentity;
}

export interface BufferedMessage {
  messageId: string;
  senderId: string;
  content: string;
  sentAt: string;
}

const TEARDOWN_SCRIPT = `
local data = redis.call('HGETALL', KEYS[1])
if #data == 0 then
  return {}
end
redis.call('DEL', KEYS[1])
local result = {}
for i = 1, #data, 2 do
  result[data[i]] = data[i + 1]
end
if result['userA'] then redis.call('DEL', 'session:by-user:' .. result['userA']) end
if result['userB'] then redis.call('DEL', 'session:by-user:' .. result['userB']) end
return data
`;

function sessionKey(sessionId: string) {
  return `session:${sessionId}`;
}

function byUserKey(userId: string) {
  return `session:by-user:${userId}`;
}

function bufferKey(sessionId: string) {
  return `buffer:${sessionId}`;
}

function graceMember(userId: string, sessionId: string) {
  return `${userId}:${sessionId}`;
}

function flatArrayToRecord(flat: string[]): Record<string, string> {
  const record: Record<string, string> = {};
  for (let i = 0; i < flat.length; i += 2) {
    record[flat[i]!] = flat[i + 1]!;
  }
  return record;
}

@Injectable()
export class SessionsService {
  constructor(@Inject(REDIS_CLIENT) private readonly redis: Redis) {}

  async createSession(
    userAId: string,
    userBId: string,
    peerIdentityA: PeerIdentity,
    peerIdentityB: PeerIdentity,
  ): Promise<SessionRecord> {
    const sessionId = randomUUID();
    const startedAt = new Date().toISOString();

    const pipeline = this.redis.pipeline();
    pipeline.hset(sessionKey(sessionId), {
      userA: userAId,
      userB: userBId,
      startedAt,
      peerIdentityA: JSON.stringify(peerIdentityA),
      peerIdentityB: JSON.stringify(peerIdentityB),
    });
    pipeline.expire(sessionKey(sessionId), SESSION_TTL_SECONDS);
    pipeline.set(byUserKey(userAId), sessionId, "EX", SESSION_TTL_SECONDS);
    pipeline.set(byUserKey(userBId), sessionId, "EX", SESSION_TTL_SECONDS);
    await pipeline.exec();

    return { sessionId, userA: userAId, userB: userBId, startedAt, peerIdentityA, peerIdentityB };
  }

  async getSessionIdForUser(userId: string): Promise<string | null> {
    return this.redis.get(byUserKey(userId));
  }

  async getSession(sessionId: string): Promise<SessionRecord | null> {
    const flat = await this.redis.hgetall(sessionKey(sessionId));
    if (!flat || Object.keys(flat).length === 0) return null;
    return this.parseSessionRecord(sessionId, flat);
  }

  async endSession(sessionId: string): Promise<SessionRecord | null> {
    const flat = (await this.redis.eval(TEARDOWN_SCRIPT, 1, sessionKey(sessionId))) as string[];
    if (!flat || flat.length === 0) return null;
    return this.parseSessionRecord(sessionId, flatArrayToRecord(flat));
  }

  private parseSessionRecord(sessionId: string, record: Record<string, string>): SessionRecord {
    return {
      sessionId,
      userA: record.userA!,
      userB: record.userB!,
      startedAt: record.startedAt!,
      peerIdentityA: JSON.parse(record.peerIdentityA!),
      peerIdentityB: JSON.parse(record.peerIdentityB!),
    };
  }

  async pushMessage(sessionId: string, message: BufferedMessage): Promise<void> {
    const pipeline = this.redis.pipeline();
    pipeline.rpush(bufferKey(sessionId), JSON.stringify(message));
    pipeline.ltrim(bufferKey(sessionId), -BUFFER_MAX_LENGTH, -1);
    pipeline.expire(bufferKey(sessionId), BUFFER_TTL_SECONDS);
    await pipeline.exec();
  }

  async getBuffer(sessionId: string): Promise<BufferedMessage[]> {
    const raw = await this.redis.lrange(bufferKey(sessionId), 0, -1);
    return raw.map((entry) => JSON.parse(entry));
  }

  async scheduleDisconnectGrace(userId: string, sessionId: string): Promise<void> {
    await this.redis.zadd(GRACE_ZSET_KEY, Date.now() + DISCONNECT_GRACE_MS, graceMember(userId, sessionId));
  }

  async cancelDisconnectGrace(userId: string, sessionId: string): Promise<void> {
    await this.redis.zrem(GRACE_ZSET_KEY, graceMember(userId, sessionId));
  }

  /** Returns [userId, sessionId] pairs whose grace period has expired, and removes them from the grace set. */
  async sweepExpiredGrace(): Promise<Array<[string, string]>> {
    const expired = await this.redis.zrangebyscore(GRACE_ZSET_KEY, "-inf", Date.now());
    if (expired.length === 0) return [];

    await this.redis.zrem(GRACE_ZSET_KEY, ...expired);

    return expired.map((member) => {
      const [userId, sessionId] = member.split(":");
      return [userId!, sessionId!];
    });
  }
}
