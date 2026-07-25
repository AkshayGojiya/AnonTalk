import { z } from "zod";

export const anonIdentitySchema = z.object({
  nickname: z.string(),
  emoji: z.string(),
  gradient: z.tuple([z.string(), z.string()]),
});
export type AnonIdentity = z.infer<typeof anonIdentitySchema>;

export const realIdentitySchema = z.object({
  displayName: z.string(),
  department: z.string().optional(),
  collegeName: z.string(),
});
export type RealIdentity = z.infer<typeof realIdentitySchema>;

export const peerIdentitySchema = z.discriminatedUnion("mode", [
  z.object({ mode: z.literal("ANONYMOUS"), identity: anonIdentitySchema }),
  z.object({ mode: z.literal("REAL"), identity: realIdentitySchema }),
]);
export type PeerIdentity = z.infer<typeof peerIdentitySchema>;
