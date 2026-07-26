import { z } from "zod";
import { UserMode, SessionEndReason } from "../enums";
import { peerIdentitySchema } from "../identity";

export const ChatClientEvent = {
  JOIN_QUEUE: "join_queue",
  LEAVE_QUEUE: "leave_queue",
  CHECK_SESSION: "check_session",
  SKIP: "skip",
  SEND_MESSAGE: "send_message",
  TYPING_START: "typing_start",
  TYPING_STOP: "typing_stop",
} as const;

export const ChatServerEvent = {
  QUEUE_STATUS: "queue_status",
  MATCH_FOUND: "match_found",
  RECEIVE_MESSAGE: "receive_message",
  TYPING: "typing",
  SESSION_ENDED: "session_ended",
  PEER_RECONNECTED: "peer_reconnected",
  FORCE_LOGOUT: "force_logout",
  ERROR: "error",
  ONLINE_COUNT: "online_count",
} as const;

// ---- Client -> Server payloads ----

export const joinQueuePayloadSchema = z.object({
  mode: z.enum([UserMode.ANONYMOUS, UserMode.REAL]),
});
export type JoinQueuePayload = z.infer<typeof joinQueuePayloadSchema>;

export const skipPayloadSchema = z.object({
  sessionId: z.string(),
});
export type SkipPayload = z.infer<typeof skipPayloadSchema>;

export const sendMessagePayloadSchema = z.object({
  sessionId: z.string(),
  content: z.string().min(1).max(2000),
  clientMsgId: z.string(),
});
export type SendMessagePayload = z.infer<typeof sendMessagePayloadSchema>;

export const typingPayloadSchema = z.object({
  sessionId: z.string(),
});
export type TypingPayload = z.infer<typeof typingPayloadSchema>;

// ---- Server -> Client payloads ----

export const queueStatusPayloadSchema = z.object({
  status: z.literal("queued"),
});
export type QueueStatusPayload = z.infer<typeof queueStatusPayloadSchema>;

export const matchFoundPayloadSchema = z.object({
  sessionId: z.string(),
  peer: peerIdentitySchema,
  startedAt: z.string(),
});
export type MatchFoundPayload = z.infer<typeof matchFoundPayloadSchema>;

export const receiveMessagePayloadSchema = z.object({
  sessionId: z.string(),
  messageId: z.string(),
  senderId: z.string(),
  content: z.string(),
  sentAt: z.string(),
  clientMsgId: z.string().optional(),
});
export type ReceiveMessagePayload = z.infer<typeof receiveMessagePayloadSchema>;

export const typingBroadcastPayloadSchema = z.object({
  sessionId: z.string(),
  isTyping: z.boolean(),
});
export type TypingBroadcastPayload = z.infer<typeof typingBroadcastPayloadSchema>;

export const sessionEndedPayloadSchema = z.object({
  sessionId: z.string(),
  reason: z.enum([
    SessionEndReason.SKIP,
    SessionEndReason.PEER_DISCONNECTED,
    SessionEndReason.REPORTED,
    SessionEndReason.MODERATION_BAN,
  ]),
});
export type SessionEndedPayload = z.infer<typeof sessionEndedPayloadSchema>;

export const peerReconnectedPayloadSchema = z.object({
  sessionId: z.string(),
});
export type PeerReconnectedPayload = z.infer<typeof peerReconnectedPayloadSchema>;

export const forceLogoutPayloadSchema = z.object({
  reason: z.string(),
});
export type ForceLogoutPayload = z.infer<typeof forceLogoutPayloadSchema>;

export const errorPayloadSchema = z.object({
  code: z.string(),
  message: z.string(),
});
export type ErrorPayload = z.infer<typeof errorPayloadSchema>;

export const onlineCountPayloadSchema = z.object({
  count: z.number(),
});
export type OnlineCountPayload = z.infer<typeof onlineCountPayloadSchema>;

// ---- Typed event maps (for Socket.IO server/client generics) ----

export interface ClientToServerEvents {
  [ChatClientEvent.JOIN_QUEUE]: (payload: JoinQueuePayload) => void;
  [ChatClientEvent.LEAVE_QUEUE]: () => void;
  [ChatClientEvent.CHECK_SESSION]: () => void;
  [ChatClientEvent.SKIP]: (payload: SkipPayload) => void;
  [ChatClientEvent.SEND_MESSAGE]: (payload: SendMessagePayload) => void;
  [ChatClientEvent.TYPING_START]: (payload: TypingPayload) => void;
  [ChatClientEvent.TYPING_STOP]: (payload: TypingPayload) => void;
}

export interface ServerToClientEvents {
  [ChatServerEvent.QUEUE_STATUS]: (payload: QueueStatusPayload) => void;
  [ChatServerEvent.MATCH_FOUND]: (payload: MatchFoundPayload) => void;
  [ChatServerEvent.RECEIVE_MESSAGE]: (payload: ReceiveMessagePayload) => void;
  [ChatServerEvent.TYPING]: (payload: TypingBroadcastPayload) => void;
  [ChatServerEvent.SESSION_ENDED]: (payload: SessionEndedPayload) => void;
  [ChatServerEvent.PEER_RECONNECTED]: (payload: PeerReconnectedPayload) => void;
  [ChatServerEvent.FORCE_LOGOUT]: (payload: ForceLogoutPayload) => void;
  [ChatServerEvent.ERROR]: (payload: ErrorPayload) => void;
  [ChatServerEvent.ONLINE_COUNT]: (payload: OnlineCountPayload) => void;
}
