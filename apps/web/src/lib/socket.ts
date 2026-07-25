import { io, type Socket } from "socket.io-client";
import type { ClientToServerEvents, ServerToClientEvents } from "@anontalk/shared";
import { API_URL } from "./api";

export type AppSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

export function createSocket(getToken: () => string | null): AppSocket {
  return io(API_URL, {
    auth: (cb) => cb({ token: getToken() ?? undefined }),
    transports: ["websocket"],
  });
}
