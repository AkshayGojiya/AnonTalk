import { Injectable } from "@nestjs/common";
import {
  DEPARTMENT_LABELS,
  UserMode,
  YEAR_LABELS,
  type CompleteOnboardingDto,
  type PeerIdentity,
} from "@anontalk/shared";
import type { User } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { generateAnonIdentity } from "./anon-identity.generator";

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async updateMode(userId: string, mode: UserMode) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { defaultMode: mode },
    });
  }

  async completeOnboarding(userId: string, dto: CompleteOnboardingDto) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { department: dto.department, year: dto.year, defaultMode: dto.mode },
    });
  }

  async findById(userId: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { id: userId } });
  }

  async buildPublicIdentity(user: User): Promise<PeerIdentity> {
    if (user.defaultMode === UserMode.REAL) {
      return {
        mode: "REAL",
        identity: {
          displayName: user.displayName,
          department: user.department ? DEPARTMENT_LABELS[user.department] : "Unknown department",
          year: user.year ? YEAR_LABELS[user.year] : "Unknown year",
        },
      };
    }

    return { mode: "ANONYMOUS", identity: generateAnonIdentity() };
  }
}
