import { Body, Controller, Post, Req, UseGuards } from "@nestjs/common";
import { createReportSchema, type CreateReportDto } from "@anontalk/shared";
import type { User } from "@prisma/client";
import type { Request } from "express";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { ZodValidationPipe } from "../common/pipes/zod-validation.pipe";
import { ReportsService } from "./reports.service";

@Controller("reports")
@UseGuards(JwtAuthGuard)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Post()
  async create(
    @Req() req: Request & { user: User },
    @Body(new ZodValidationPipe(createReportSchema)) body: CreateReportDto,
  ) {
    return this.reportsService.createReport(req.user.id, body);
  }
}
