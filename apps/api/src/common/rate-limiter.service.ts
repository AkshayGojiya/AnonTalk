import { Inject, Injectable } from "@nestjs/common";
import type { Redis } from "ioredis";
import { REDIS_CLIENT } from "../redis/redis.constants";

/** Simple fixed-window counter for rate limiting Socket.IO events, which
 * @nestjs/throttler doesn't cover (it's built for HTTP request/response). */
@Injectable()
export class RateLimiterService {
  constructor(@Inject(REDIS_CLIENT) private readonly redis: Redis) {}

  async isAllowed(key: string, limit: number, windowSeconds: number): Promise<boolean> {
    const fullKey = `ratelimit:${key}`;
    const count = await this.redis.incr(fullKey);
    if (count === 1) {
      await this.redis.expire(fullKey, windowSeconds);
    }
    return count <= limit;
  }
}
