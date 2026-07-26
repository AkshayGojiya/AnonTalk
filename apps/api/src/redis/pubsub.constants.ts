export const MATCH_CHANNEL = "ps:match";
export const SESSION_ENDED_CHANNEL = "ps:session-ended";
export const FORCE_LOGOUT_CHANNEL = "ps:force-logout";

export function blocklistKey(userId: string) {
  return `blocklist:${userId}`;
}

// Mirrors sessions.service.ts's private byUserKey -- same key format, kept in
// sync manually since matchmaking needs to read it too (to atomically refuse
// to queue/match a user who already has a live session).
export function sessionByUserKey(userId: string) {
  return `session:by-user:${userId}`;
}
