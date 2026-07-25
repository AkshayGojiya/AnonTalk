import { z } from "zod";
import { UserMode } from "../enums";

export const updateUserModeSchema = z.object({
  mode: z.enum([UserMode.ANONYMOUS, UserMode.REAL]),
});
export type UpdateUserModeDto = z.infer<typeof updateUserModeSchema>;
