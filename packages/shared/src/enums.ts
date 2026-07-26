export const UserMode = {
  ANONYMOUS: "ANONYMOUS",
  REAL: "REAL",
} as const;
export type UserMode = (typeof UserMode)[keyof typeof UserMode];

export const Department = {
  CIVIL: "CIVIL",
  STRUCTURE: "STRUCTURE",
  COMPUTER: "COMPUTER",
  ELECTRONICS: "ELECTRONICS",
  ELECTRICAL: "ELECTRICAL",
  MECHANICAL: "MECHANICAL",
  PRODUCTION: "PRODUCTION",
  ELECTRONICS_AND_COMMUNICATION: "ELECTRONICS_AND_COMMUNICATION",
  INFORMATION_TECHNOLOGY: "INFORMATION_TECHNOLOGY",
  MATHEMATICS: "MATHEMATICS",
} as const;
export type Department = (typeof Department)[keyof typeof Department];

export const DEPARTMENT_LABELS: Record<Department, string> = {
  CIVIL: "Civil",
  STRUCTURE: "Structure",
  COMPUTER: "Computer",
  ELECTRONICS: "Electronics",
  ELECTRICAL: "Electrical",
  MECHANICAL: "Mechanical",
  PRODUCTION: "Production",
  ELECTRONICS_AND_COMMUNICATION: "Electronics & Communication",
  INFORMATION_TECHNOLOGY: "Information Technology",
  MATHEMATICS: "Mathematics",
};

export const Year = {
  YEAR_1: "YEAR_1",
  YEAR_2: "YEAR_2",
  YEAR_3: "YEAR_3",
  YEAR_4: "YEAR_4",
} as const;
export type Year = (typeof Year)[keyof typeof Year];

export const YEAR_LABELS: Record<Year, string> = {
  YEAR_1: "1st Year",
  YEAR_2: "2nd Year",
  YEAR_3: "3rd Year",
  YEAR_4: "4th Year",
};

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
  LEFT: "left",
  PEER_DISCONNECTED: "peer_disconnected",
  REPORTED: "reported",
  MODERATION_BAN: "moderation_ban",
} as const;
export type SessionEndReason = (typeof SessionEndReason)[keyof typeof SessionEndReason];
