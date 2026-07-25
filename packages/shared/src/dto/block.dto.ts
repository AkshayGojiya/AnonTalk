import { z } from "zod";

// Scoped to "block whoever I'm currently chatting with" — the client never learns
// the peer's real user id, so blocking always happens relative to a live session.
export const createBlockSchema = z.object({
  sessionId: z.string(),
});
export type CreateBlockDto = z.infer<typeof createBlockSchema>;
