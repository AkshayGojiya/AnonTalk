import { BadRequestException, Inject, Injectable } from "@nestjs/common";
import { SessionEndReason, type CreateReportDto } from "@anontalk/shared";
import { Prisma } from "@prisma/client";
import type { Redis } from "ioredis";
import { REDIS_CLIENT } from "../redis/redis.constants";
import { blocklistKey } from "../redis/pubsub.constants";
import { PrismaService } from "../prisma/prisma.service";
import { SessionsService } from "../sessions/sessions.service";

@Injectable()
export class ReportsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly sessions: SessionsService,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
  ) {}

  async createReport(reporterId: string, dto: CreateReportDto) {
    const activeSessionId = await this.sessions.getSessionIdForUser(reporterId);
    if (activeSessionId !== dto.sessionId) {
      throw new BadRequestException("You can only report the session you're currently in");
    }

    const session = await this.sessions.getSession(dto.sessionId);
    if (!session) {
      throw new BadRequestException("Session is no longer active");
    }
    const reportedUserId = session.userA === reporterId ? session.userB : session.userA;

    const messageBuffer = await this.sessions.getBuffer(dto.sessionId);

    const report = await this.prisma.report.create({
      data: {
        sessionId: dto.sessionId,
        reporterId,
        reportedUserId,
        reason: dto.reason,
        details: dto.details,
        messageBuffer: messageBuffer as unknown as Prisma.InputJsonValue,
      },
    });

    if (dto.alsoBlock) {
      await this.blockWithinReport(reporterId, reportedUserId);
    }

    // Must happen last: this deletes the session record that reportedUserId was derived from.
    await this.sessions.endSessionAndNotify(dto.sessionId, SessionEndReason.REPORTED);

    return { id: report.id, status: report.status };
  }

  private async blockWithinReport(blockerId: string, blockedId: string) {
    const existing = await this.prisma.blockedUser.findFirst({ where: { blockerId, blockedId } });
    if (!existing) {
      await this.prisma.blockedUser.create({ data: { blockerId, blockedId } });
    }
    await this.redis.sadd(blocklistKey(blockerId), blockedId);
    await this.redis.sadd(blocklistKey(blockedId), blockerId);
  }
}
