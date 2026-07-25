import { Injectable } from "@nestjs/common";
import { UserMode, type PeerIdentity } from "@anontalk/shared";
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

  async findById(userId: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { id: userId } });
  }

  async buildPublicIdentity(user: User): Promise<PeerIdentity> {
    if (user.defaultMode === UserMode.REAL) {
      const allowedDomain = await this.prisma.allowedDomain.findFirst({ where: { domain: user.domain } });
      return {
        mode: "REAL",
        identity: {
          displayName: user.displayName,
          department: user.department ?? undefined,
          collegeName: allowedDomain?.collegeName ?? user.domain,
        },
      };
    }

    return { mode: "ANONYMOUS", identity: generateAnonIdentity() };
  }
}
