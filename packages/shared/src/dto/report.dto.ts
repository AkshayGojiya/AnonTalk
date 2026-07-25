import { z } from "zod";
import { ReportReason } from "../enums";

// No reportedUserId here: the client never learns the peer's real user id (even in
// Real Profile mode the wire identity is name/department/year only), so the server
// derives who's being reported from the session record itself.
export const createReportSchema = z.object({
  sessionId: z.string(),
  reason: z.enum([
    ReportReason.SPAM,
    ReportReason.HARASSMENT,
    ReportReason.HATE_SPEECH,
    ReportReason.THREATS,
    ReportReason.NSFW,
    ReportReason.OTHER,
  ]),
  details: z.string().max(1000).optional(),
  // Handled as part of the same request rather than a separate POST /blocks call:
  // reporting already ends the session, so a follow-up block call would no longer
  // be able to resolve who the peer was.
  alsoBlock: z.boolean().optional(),
});
export type CreateReportDto = z.infer<typeof createReportSchema>;
