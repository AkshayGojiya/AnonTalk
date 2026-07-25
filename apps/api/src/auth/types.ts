import type { UserRole, UserStatus } from "@anontalk/shared";

export interface JwtPayload {
  sub: string;
  role: UserRole;
  status: UserStatus;
  tokenVersion: number;
}

export interface GoogleProfilePayload {
  googleId: string;
  email: string;
  emailVerified: boolean;
  displayName: string;
}
