import { z } from "zod";
import { ModerationActionType } from "../enums";

const actionTypeValues = Object.values(ModerationActionType) as [ModerationActionType, ...ModerationActionType[]];

export const createModerationActionSchema = z.object({
  targetUserId: z.string(),
  actionType: z.enum(actionTypeValues),
  reason: z.string().max(500).optional(),
  expiresAt: z.string().datetime().optional(),
  reportId: z.string().optional(),
});
export type CreateModerationActionDto = z.infer<typeof createModerationActionSchema>;

export const dismissReportSchema = z.object({
  note: z.string().max(500).optional(),
});
export type DismissReportDto = z.infer<typeof dismissReportSchema>;
