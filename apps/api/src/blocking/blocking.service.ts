import { BadRequestException, Inject, Injectable } from "@nestjs/common";
import { SessionEndReason } from "@anontalk/shared";
import type { Redis } from "ioredis";
import { REDIS_CLIENT } from "../redis/redis.constants";
import { blocklistKey } from "../redis/pubsub.constants";
import { PrismaService } from "../prisma/prisma.service";
import { SessionsService } from "../sessions/sessions.service";

@Injectable()
export class BlockingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly sessions: SessionsService,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
  ) {}

  /** Blocks whoever the caller is currently chatting with in the given session. */
  async blockCurrentPeer(blockerId: string, sessionId: string): Promise<void> {
    const activeSessionId = await this.sessions.getSessionIdForUser(blockerId);
    if (activeSessionId !== sessionId) {
      throw new BadRequestException("You can only block the person you're currently chatting with");
    }

    const session = await this.sessions.getSession(sessionId);
    if (!session) {
      throw new BadRequestException("Session is no longer active");
    }
    const blockedId = session.userA === blockerId ? session.userB : session.userA;

    const existing = await this.prisma.blockedUser.findFirst({ where: { blockerId, blockedId } });
    if (!existing) {
      await this.prisma.blockedUser.create({ data: { blockerId, blockedId } });
    }

    // Symmetric: neither side should ever be matched with the other again,
    // regardless of who initiated the block.
    await this.redis.sadd(blocklistKey(blockerId), blockedId);
    await this.redis.sadd(blocklistKey(blockedId), blockerId);

    // Reason is deliberately the generic "skip" — the blocked user isn't told
    // specifically that they were blocked, to avoid tipping off/inviting retaliation.
    await this.sessions.endSessionAndNotify(sessionId, SessionEndReason.SKIP);
  }
}
