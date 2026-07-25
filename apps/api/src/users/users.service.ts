import { Injectable } from "@nestjs/common";
import type { UserMode } from "@anontalk/shared";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async updateMode(userId: string, mode: UserMode) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { defaultMode: mode },
    });
  }
}
