export const REDIS_CLIENT = Symbol("REDIS_CLIENT");
export const REDIS_PUB_CLIENT = Symbol("REDIS_PUB_CLIENT");
export const REDIS_SUB_CLIENT = Symbol("REDIS_SUB_CLIENT");
/** Dedicated subscriber for app-level control channels (ps:match, ps:session-ended) —
 * kept separate from REDIS_SUB_CLIENT, which the Socket.IO Redis adapter owns internally. */
export const REDIS_APP_SUB_CLIENT = Symbol("REDIS_APP_SUB_CLIENT");
