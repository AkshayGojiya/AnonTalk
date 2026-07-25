import { z } from "zod";
import { ReportReason } from "../enums";

export const createReportSchema = z.object({
  sessionId: z.string(),
  reportedUserId: z.string(),
  reason: z.enum([
    ReportReason.SPAM,
    ReportReason.HARASSMENT,
    ReportReason.HATE_SPEECH,
    ReportReason.THREATS,
    ReportReason.NSFW,
    ReportReason.OTHER,
  ]),
  details: z.string().max(1000).optional(),
});
export type CreateReportDto = z.infer<typeof createReportSchema>;
