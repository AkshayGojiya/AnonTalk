import { z } from "zod";
import { Department, UserMode, UserRole, UserStatus, Year } from "../enums";

export const updateUserModeSchema = z.object({
  mode: z.enum([UserMode.ANONYMOUS, UserMode.REAL]),
});
export type UpdateUserModeDto = z.infer<typeof updateUserModeSchema>;

const departmentValues = Object.values(Department) as [Department, ...Department[]];
const yearValues = Object.values(Year) as [Year, ...Year[]];

export const completeOnboardingSchema = z.object({
  department: z.enum(departmentValues),
  year: z.enum(yearValues),
  mode: z.enum([UserMode.ANONYMOUS, UserMode.REAL]),
});
export type CompleteOnboardingDto = z.infer<typeof completeOnboardingSchema>;

export const currentUserSchema = z.object({
  id: z.string(),
  email: z.string(),
  displayName: z.string(),
  department: z.enum(departmentValues).nullable(),
  year: z.enum(yearValues).nullable(),
  defaultMode: z.enum([UserMode.ANONYMOUS, UserMode.REAL]),
  role: z.enum([UserRole.USER, UserRole.MODERATOR, UserRole.ADMIN]),
  status: z.enum([UserStatus.ACTIVE, UserStatus.MUTED, UserStatus.BANNED]),
  reputationScore: z.number(),
});
export type CurrentUserDto = z.infer<typeof currentUserSchema>;
