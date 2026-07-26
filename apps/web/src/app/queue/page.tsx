"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { MessagesSquare } from "lucide-react";
import type { MatchFoundPayload, OnlineCountPayload } from "@anontalk/shared";
import { useSocketContext } from "@/components/socket-provider";
import { useAuthStore } from "@/store/auth-store";
import { useChatStore } from "@/store/chat-store";
import { useRequireAuth } from "@/hooks/use-require-auth";

const EQ_BARS = [10, 22, 14, 30, 18, 26, 12, 20, 16, 28, 10, 22];

export default function QueuePage() {
  const router = useRouter();
  const { ready } = useRequireAuth();
  const socket = useSocketContext();
  const mode = useAuthStore((s) => s.user?.defaultMode ?? "ANONYMOUS");
  const setMatch = useChatStore((s) => s.setMatch);
  const [onlineCount, setOnlineCount] = useState<number | null>(null);

  useEffect(() => {
    if (!socket) return;

    function handleMatchFound(payload: MatchFoundPayload) {
      setMatch(payload.sessionId, payload.peer, payload.startedAt);
      router.replace(`/chat/${payload.sessionId}`);
    }
    function handleOnlineCount(payload: OnlineCountPayload) {
      setOnlineCount(payload.count);
    }
    socket.on("match_found", handleMatchFound);
    socket.on("online_count", handleOnlineCount);
    socket.emit("join_queue", { mode });

    return () => {
      socket.off("match_found", handleMatchFound);
      socket.off("online_count", handleOnlineCount);
    };
  }, [socket, mode, router, setMatch]);

  function handleCancel() {
    socket?.emit("leave_queue");
    router.push("/");
  }

  if (!ready) return null;

  return (
    <div className="relative flex flex-1 flex-col items-center justify-center gap-10 overflow-hidden bg-cobalt px-6 text-center text-cobalt-foreground lg:gap-16">
      <div className="relative z-10 flex h-32 w-32 items-center justify-center lg:h-52 lg:w-52">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="absolute inset-0 rounded-full bg-white/15"
            animate={{ scale: [0.6, 1.7], opacity: [0.9, 0] }}
            transition={{ duration: 2.8, repeat: Infinity, delay: i * 0.9, ease: "easeOut" }}
          />
        ))}
        <motion.div
          animate={{ y: [0, -7, 0] }}
          transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
          className="relative flex h-16 w-16 items-center justify-center gap-1 rounded-full bg-orange text-orange-foreground shadow-[0_10px_30px_rgba(255,90,31,.45)] lg:h-28 lg:w-28"
        >
          <MessagesSquare className="h-6 w-6 lg:h-9 lg:w-9" strokeWidth={1.75} />
        </motion.div>
      </div>

      <div className="relative z-10 flex flex-col items-center gap-4 lg:gap-5">
        <div className="flex flex-col gap-1.5 lg:gap-3">
          <h1 className="font-heading text-2xl font-extrabold tracking-tight lg:text-6xl">
            Finding someone for you…
          </h1>
          <p className="text-sm text-white/75 lg:text-lg">
            {onlineCount !== null
              ? `${onlineCount} verified student${onlineCount === 1 ? "" : "s"} online right now`
              : "This usually takes less than a second."}
          </p>
        </div>

        <div className="flex h-8 items-center gap-1 lg:h-10 lg:gap-1.5">
          {EQ_BARS.map((h, i) => (
            <motion.span
              key={i}
              className="w-1 rounded-full bg-white lg:w-1.5"
              style={{ height: h }}
              animate={{ scaleY: [0.4, 1, 0.4] }}
              transition={{ duration: 1 + (i % 3) * 0.2, repeat: Infinity, delay: i * 0.06, ease: "easeInOut" }}
            />
          ))}
        </div>
      </div>

      <motion.button
        whileTap={{ scale: 0.96 }}
        onClick={handleCancel}
        className="relative z-10 rounded-full bg-white/15 px-6 py-3 text-sm font-semibold lg:px-10 lg:py-4 lg:text-base"
      >
        Cancel
      </motion.button>
    </div>
  );
}
