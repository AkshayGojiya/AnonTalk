import { Body, Controller, Get, Patch, Req, UseGuards } from "@nestjs/common";
import { updateUserModeSchema } from "@anontalk/shared";
import type { UpdateUserModeDto } from "@anontalk/shared";
import type { User } from "@prisma/client";
import type { Request } from "express";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { ZodValidationPipe } from "../common/pipes/zod-validation.pipe";
import { toCurrentUserDto } from "./user.mapper";
import { UsersService } from "./users.service";

@Controller("users")
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get("me")
  me(@Req() req: Request & { user: User }) {
    return toCurrentUserDto(req.user);
  }

  @Patch("me/mode")
  async updateMode(
    @Req() req: Request & { user: User },
    @Body(new ZodValidationPipe(updateUserModeSchema)) body: UpdateUserModeDto,
  ) {
    const updated = await this.usersService.updateMode(req.user.id, body.mode);
    return toCurrentUserDto(updated);
  }
}
