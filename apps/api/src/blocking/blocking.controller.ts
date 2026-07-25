import { Body, Controller, Post, Req, UseGuards } from "@nestjs/common";
import { createBlockSchema, type CreateBlockDto } from "@anontalk/shared";
import type { User } from "@prisma/client";
import type { Request } from "express";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { ZodValidationPipe } from "../common/pipes/zod-validation.pipe";
import { BlockingService } from "./blocking.service";

@Controller("blocks")
@UseGuards(JwtAuthGuard)
export class BlockingController {
  constructor(private readonly blockingService: BlockingService) {}

  @Post()
  async create(
    @Req() req: Request & { user: User },
    @Body(new ZodValidationPipe(createBlockSchema)) body: CreateBlockDto,
  ) {
    await this.blockingService.blockCurrentPeer(req.user.id, body.sessionId);
    return { ok: true };
  }
}
