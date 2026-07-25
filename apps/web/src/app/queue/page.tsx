"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { MessagesSquare } from "lucide-react";
import type { MatchFoundPayload } from "@anontalk/shared";
import { useSocketContext } from "@/components/socket-provider";
import { useAuthStore } from "@/store/auth-store";
import { useChatStore } from "@/store/chat-store";
import { useRequireAuth } from "@/hooks/use-require-auth";
import { DecorativeBlob } from "@/components/decorative-blob";

const WAVEFORM_BARS = [10, 22, 14, 30, 18, 26, 12, 20, 16, 28, 10, 22];

export default function QueuePage() {
  const router = useRouter();
  const { ready } = useRequireAuth();
  const socket = useSocketContext();
  const mode = useAuthStore((s) => s.user?.defaultMode ?? "ANONYMOUS");
  const setMatch = useChatStore((s) => s.setMatch);

  useEffect(() => {
    if (!socket) return;

    function handleMatchFound(payload: MatchFoundPayload) {
      setMatch(payload.sessionId, payload.peer, payload.startedAt);
      router.replace(`/chat/${payload.sessionId}`);
    }
    socket.on("match_found", handleMatchFound);
    socket.emit("join_queue", { mode });

    return () => {
      socket.off("match_found", handleMatchFound);
    };
  }, [socket, mode, router, setMatch]);

  function handleCancel() {
    socket?.emit("leave_queue");
    router.push("/");
  }

  if (!ready) return null;

  return (
    <div className="relative flex flex-1 flex-col items-center justify-center gap-10 overflow-hidden px-6 text-center">
      <DecorativeBlob
        color="var(--coral-light)"
        variant={2}
        className="pointer-events-none absolute -top-16 -right-24 h-80 w-80 opacity-60"
      />

      <div className="relative z-10 flex h-32 w-32 items-center justify-center">
        {[0, 1].map((i) => (
          <motion.span
            key={i}
            className="absolute inset-0 rounded-full bg-coral/40"
            animate={{ scale: [1, 1.6], opacity: [0.5, 0] }}
            transition={{ duration: 1.8, repeat: Infinity, delay: i * 0.6, ease: "easeOut" }}
          />
        ))}
        <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground">
          <MessagesSquare className="h-6 w-6" strokeWidth={1.75} />
        </div>
      </div>

      <div className="relative z-10 flex flex-col items-center gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="font-heading text-xl font-bold">Finding someone for you…</h1>
          <p className="text-sm text-muted-foreground">This usually takes less than a second.</p>
        </div>

        <div className="flex h-8 items-center gap-1">
          {WAVEFORM_BARS.map((h, i) => (
            <motion.span
              key={i}
              className="w-1 rounded-full bg-sage"
              style={{ height: h }}
              animate={{ scaleY: [0.4, 1, 0.4] }}
              transition={{ duration: 1 + (i % 3) * 0.2, repeat: Infinity, delay: i * 0.06, ease: "easeInOut" }}
            />
          ))}
        </div>
      </div>

      <button
        onClick={handleCancel}
        className="relative z-10 text-sm font-semibold text-muted-foreground underline underline-offset-4 hover:text-foreground"
      >
        Cancel
      </button>
    </div>
  );
}
