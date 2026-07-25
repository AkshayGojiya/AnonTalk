import type { User } from "@prisma/client";
import type { Socket } from "socket.io";

export interface AuthenticatedSocket extends Socket {
  data: { user: User };
}

export interface MatchMessage {
  sessionId: string;
  userA: string;
  userB: string;
}

export interface SessionEndedMessage {
  sessionId: string;
  userA: string;
  userB: string;
  reason: string;
}
