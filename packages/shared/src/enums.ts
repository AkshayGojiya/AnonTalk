export const UserMode = {
  ANONYMOUS: "ANONYMOUS",
  REAL: "REAL",
} as const;
export type UserMode = (typeof UserMode)[keyof typeof UserMode];

export const UserRole = {
  USER: "USER",
  MODERATOR: "MODERATOR",
  ADMIN: "ADMIN",
} as const;
export type UserRole = (typeof UserRole)[keyof typeof UserRole];

export const UserStatus = {
  ACTIVE: "ACTIVE",
  MUTED: "MUTED",
  BANNED: "BANNED",
} as const;
export type UserStatus = (typeof UserStatus)[keyof typeof UserStatus];

export const ReportReason = {
  SPAM: "SPAM",
  HARASSMENT: "HARASSMENT",
  HATE_SPEECH: "HATE_SPEECH",
  THREATS: "THREATS",
  NSFW: "NSFW",
  OTHER: "OTHER",
} as const;
export type ReportReason = (typeof ReportReason)[keyof typeof ReportReason];

export const ReportStatus = {
  PENDING: "PENDING",
  REVIEWED: "REVIEWED",
  ACTIONED: "ACTIONED",
  DISMISSED: "DISMISSED",
} as const;
export type ReportStatus = (typeof ReportStatus)[keyof typeof ReportStatus];

export const ModerationActionType = {
  WARN: "WARN",
  MUTE: "MUTE",
  BAN: "BAN",
  UNMUTE: "UNMUTE",
  UNBAN: "UNBAN",
} as const;
export type ModerationActionType = (typeof ModerationActionType)[keyof typeof ModerationActionType];

export const SessionEndReason = {
  SKIP: "skip",
  PEER_DISCONNECTED: "peer_disconnected",
  REPORTED: "reported",
  MODERATION_BAN: "moderation_ban",
} as const;
export type SessionEndReason = (typeof SessionEndReason)[keyof typeof SessionEndReason];
