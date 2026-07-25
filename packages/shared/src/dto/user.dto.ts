import { z } from "zod";
import { UserMode, UserRole, UserStatus } from "../enums";

export const updateUserModeSchema = z.object({
  mode: z.enum([UserMode.ANONYMOUS, UserMode.REAL]),
});
export type UpdateUserModeDto = z.infer<typeof updateUserModeSchema>;

export const currentUserSchema = z.object({
  id: z.string(),
  email: z.string(),
  displayName: z.string(),
  department: z.string().nullable(),
  defaultMode: z.enum([UserMode.ANONYMOUS, UserMode.REAL]),
  role: z.enum([UserRole.USER, UserRole.MODERATOR, UserRole.ADMIN]),
  status: z.enum([UserStatus.ACTIVE, UserStatus.MUTED, UserStatus.BANNED]),
  reputationScore: z.number(),
});
export type CurrentUserDto = z.infer<typeof currentUserSchema>;
