import { z } from "zod";

export const createBlockSchema = z.object({
  blockedUserId: z.string(),
});
export type CreateBlockDto = z.infer<typeof createBlockSchema>;
