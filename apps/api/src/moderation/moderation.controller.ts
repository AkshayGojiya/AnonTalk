import { Body, Controller, Get, Param, Post, Req, UseGuards } from "@nestjs/common";
import {
  UserRole,
  createModerationActionSchema,
  dismissReportSchema,
  type CreateModerationActionDto,
  type DismissReportDto,
} from "@anontalk/shared";
import type { User } from "@prisma/client";
import type { Request } from "express";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { Roles } from "../common/decorators/roles.decorator";
import { RolesGuard } from "../common/guards/roles.guard";
import { ZodValidationPipe } from "../common/pipes/zod-validation.pipe";
import { ModerationService } from "./moderation.service";

@Controller("moderation")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.MODERATOR, UserRole.ADMIN)
export class ModerationController {
  constructor(private readonly moderationService: ModerationService) {}

  @Get("reports")
  listPendingReports() {
    return this.moderationService.listPendingReports();
  }

  @Post("reports/:id/dismiss")
  dismissReport(
    @Req() req: Request & { user: User },
    @Param("id") reportId: string,
    @Body(new ZodValidationPipe(dismissReportSchema)) body: DismissReportDto,
  ) {
    return this.moderationService.dismissReport(reportId, req.user.id, body.note);
  }

  @Post("actions")
  applyAction(
    @Req() req: Request & { user: User },
    @Body(new ZodValidationPipe(createModerationActionSchema)) body: CreateModerationActionDto,
  ) {
    return this.moderationService.applyAction(req.user.id, body);
  }
}
