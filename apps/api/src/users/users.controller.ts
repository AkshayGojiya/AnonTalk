import { Body, Controller, Get, Post, Req, UseGuards } from "@nestjs/common";
import { updateProfileSchema } from "@anontalk/shared";
import type { UpdateProfileDto } from "@anontalk/shared";
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

  @Post("me/profile")
  async updateProfile(
    @Req() req: Request & { user: User },
    @Body(new ZodValidationPipe(updateProfileSchema)) body: UpdateProfileDto,
  ) {
    const updated = await this.usersService.updateProfile(req.user.id, body);
    return toCurrentUserDto(updated);
  }
}
