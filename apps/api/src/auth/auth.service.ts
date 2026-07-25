import { randomBytes } from "node:crypto";
import { Inject, Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { UserMode, UserStatus } from "@anontalk/shared";
import type { User } from "@prisma/client";
import jwt from "jsonwebtoken";
import type { Redis } from "ioredis";
import { PrismaService } from "../prisma/prisma.service";
import { REDIS_CLIENT } from "../redis/redis.constants";
import type { GoogleProfilePayload, JwtPayload } from "./types";

const ACCESS_TOKEN_TTL = "15m";
const REFRESH_TOKEN_TTL_SECONDS = 60 * 60 * 24 * 30;
const EXCHANGE_CODE_TTL_SECONDS = 60;
const EXCHANGE_CODE_PREFIX = "auth:exchange:";

export type OAuthLoginResult =
  | { ok: true; user: User }
  | { ok: false; reason: "domain_not_allowed" | "email_not_verified" };

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
  ) {}

  async validateOAuthLogin(profile: GoogleProfilePayload): Promise<OAuthLoginResult> {
    if (!profile.emailVerified) {
      return { ok: false, reason: "email_not_verified" };
    }

    const domain = profile.email.split("@")[1]?.toLowerCase();

    const allowedDomain = domain
      ? await this.prisma.allowedDomain.findFirst({ where: { domain, isActive: true } })
      : null;

    if (!allowedDomain) {
      return { ok: false, reason: "domain_not_allowed" };
    }

    const user = await this.prisma.user.upsert({
      where: { googleId: profile.googleId },
      create: {
        googleId: profile.googleId,
        email: profile.email,
        domain,
        displayName: profile.displayName,
        defaultMode: UserMode.ANONYMOUS,
        lastLoginAt: new Date(),
      },
      update: {
        email: profile.email,
        displayName: profile.displayName,
        lastLoginAt: new Date(),
      },
    });

    return { ok: true, user };
  }

  issueTokens(user: User): { accessToken: string; refreshToken: string } {
    const payload: JwtPayload = {
      sub: user.id,
      role: user.role,
      status: user.status,
      tokenVersion: user.tokenVersion,
    };

    const accessToken = jwt.sign(payload, this.config.get<string>("JWT_ACCESS_SECRET")!, {
      expiresIn: ACCESS_TOKEN_TTL,
    });
    const refreshToken = jwt.sign(payload, this.config.get<string>("JWT_REFRESH_SECRET")!, {
      expiresIn: REFRESH_TOKEN_TTL_SECONDS,
    });

    return { accessToken, refreshToken };
  }

  async getUserById(userId: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { id: userId } });
  }

  async createExchangeCode(userId: string): Promise<string> {
    const code = randomBytes(32).toString("hex");
    await this.redis.set(`${EXCHANGE_CODE_PREFIX}${code}`, userId, "EX", EXCHANGE_CODE_TTL_SECONDS);
    return code;
  }

  async consumeExchangeCode(code: string): Promise<string | null> {
    const key = `${EXCHANGE_CODE_PREFIX}${code}`;
    const userId = await this.redis.get(key);
    if (!userId) return null;
    await this.redis.del(key);
    return userId;
  }

  async verifyRefreshToken(token: string): Promise<User> {
    let payload: JwtPayload;
    try {
      payload = jwt.verify(token, this.config.get<string>("JWT_REFRESH_SECRET")!) as JwtPayload;
    } catch {
      throw new UnauthorizedException("Invalid or expired refresh token");
    }

    const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user || user.status === UserStatus.BANNED || user.tokenVersion !== payload.tokenVersion) {
      throw new UnauthorizedException("Session no longer valid");
    }

    return user;
  }

  refreshCookieOptions() {
    return {
      httpOnly: true,
      secure: true,
      sameSite: "none" as const,
      maxAge: REFRESH_TOKEN_TTL_SECONDS * 1000,
      path: "/auth",
    };
  }
}
