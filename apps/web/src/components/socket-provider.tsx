"use client";

import { createContext, useContext } from "react";
import { useSocket } from "@/hooks/use-socket";
import type { AppSocket } from "@/lib/socket";

const SocketContext = createContext<AppSocket | null>(null);

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const socket = useSocket();
  return <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>;
}

export function useSocketContext(): AppSocket | null {
  return useContext(SocketContext);
}
