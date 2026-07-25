import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import {
  ModerationActionType,
  ReportStatus,
  SessionEndReason,
  UserStatus,
  type CreateModerationActionDto,
} from "@anontalk/shared";
import { Prisma } from "@prisma/client";
import type { Redis } from "ioredis";
import { REDIS_CLIENT } from "../redis/redis.constants";
import { FORCE_LOGOUT_CHANNEL } from "../redis/pubsub.constants";
import { PrismaService } from "../prisma/prisma.service";
import { SessionsService } from "../sessions/sessions.service";
import type { ForceLogoutMessage } from "../gateway/types";

const DEFAULT_MUTE_DURATION_MS = 60 * 60 * 1000;

const REPUTATION_DELTA: Record<ModerationActionType, number> = {
  WARN: -10,
  MUTE: -25,
  BAN: -100,
  UNMUTE: 0,
  UNBAN: 0,
};

@Injectable()
export class ModerationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly sessions: SessionsService,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
  ) {}

  async listPendingReports() {
    return this.prisma.report.findMany({
      where: { status: ReportStatus.PENDING },
      orderBy: { createdAt: "asc" },
      include: {
        reporter: { select: { id: true, displayName: true, email: true } },
        reportedUser: { select: { id: true, displayName: true, email: true, status: true } },
      },
    });
  }

  async dismissReport(reportId: string, moderatorId: string, note?: string) {
    const report = await this.prisma.report.findUnique({ where: { id: reportId } });
    if (!report) throw new NotFoundException("Report not found");

    return this.prisma.report.update({
      where: { id: reportId },
      data: {
        status: ReportStatus.DISMISSED,
        reviewedById: moderatorId,
        reviewedAt: new Date(),
        details: note ? `${report.details ?? ""}\n[dismissed: ${note}]`.trim() : report.details,
      },
    });
  }

  async applyAction(moderatorId: string, dto: CreateModerationActionDto) {
    const target = await this.prisma.user.findUnique({ where: { id: dto.targetUserId } });
    if (!target) throw new NotFoundException("User not found");

    const statusUpdate: Prisma.UserUpdateInput = {};
    switch (dto.actionType) {
      case ModerationActionType.MUTE:
        statusUpdate.status = UserStatus.MUTED;
        statusUpdate.mutedUntil = dto.expiresAt ? new Date(dto.expiresAt) : new Date(Date.now() + DEFAULT_MUTE_DURATION_MS);
        break;
      case ModerationActionType.BAN:
        statusUpdate.status = UserStatus.BANNED;
        statusUpdate.bannedAt = new Date();
        statusUpdate.banReason = dto.reason;
        statusUpdate.tokenVersion = { increment: 1 };
        break;
      case ModerationActionType.UNMUTE:
        statusUpdate.status = UserStatus.ACTIVE;
        statusUpdate.mutedUntil = null;
        break;
      case ModerationActionType.UNBAN:
        statusUpdate.status = UserStatus.ACTIVE;
        statusUpdate.bannedAt = null;
        statusUpdate.banReason = null;
        break;
      case ModerationActionType.WARN:
        break;
    }

    const updated = await this.prisma.user.update({
      where: { id: dto.targetUserId },
      data: {
        ...statusUpdate,
        reputationScore: { increment: REPUTATION_DELTA[dto.actionType] },
      },
    });

    await this.prisma.moderationAction.create({
      data: {
        targetUserId: dto.targetUserId,
        moderatorId,
        reportId: dto.reportId,
        actionType: dto.actionType,
        reason: dto.reason,
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : undefined,
      },
    });

    if (dto.reportId) {
      await this.prisma.report.update({
        where: { id: dto.reportId },
        data: { status: ReportStatus.ACTIONED, reviewedById: moderatorId, reviewedAt: new Date() },
      });
    }

    if (dto.actionType === ModerationActionType.BAN) {
      await this.enforceLiveBan(dto.targetUserId, dto.reason);
    }

    return updated;
  }

  private async enforceLiveBan(targetUserId: string, reason?: string) {
    const activeSessionId = await this.sessions.getSessionIdForUser(targetUserId);
    if (activeSessionId) {
      await this.sessions.endSessionAndNotify(activeSessionId, SessionEndReason.MODERATION_BAN);
    }

    const message: ForceLogoutMessage = { userId: targetUserId, reason: reason ?? "You have been banned." };
    await this.redis.publish(FORCE_LOGOUT_CHANNEL, JSON.stringify(message));
  }
}
