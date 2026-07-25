import type { CurrentUserDto } from "@anontalk/shared";
import type { User } from "@prisma/client";

export function toCurrentUserDto(user: User): CurrentUserDto {
  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    department: user.department,
    defaultMode: user.defaultMode,
    role: user.role,
    status: user.status,
    reputationScore: user.reputationScore,
  };
}
