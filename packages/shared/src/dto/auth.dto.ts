import { z } from "zod";

export const exchangeTokenSchema = z.object({
  code: z.string().min(1),
});
export type ExchangeTokenDto = z.infer<typeof exchangeTokenSchema>;
