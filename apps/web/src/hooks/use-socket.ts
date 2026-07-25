"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/store/auth-store";
import { createSocket, type AppSocket } from "@/lib/socket";

export function useSocket(): AppSocket | null {
  const userId = useAuthStore((s) => s.user?.id);
  const [socket, setSocket] = useState<AppSocket | null>(null);

  useEffect(() => {
    if (!userId) return;

    const s = createSocket(() => useAuthStore.getState().accessToken);
    const handleConnect = () => setSocket(s);
    s.on("connect", handleConnect);

    return () => {
      s.off("connect", handleConnect);
      s.disconnect();
      setSocket(null);
    };
  }, [userId]);

  return socket;
}
