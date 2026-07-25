"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { MessageCircle } from "lucide-react";
import type { MatchFoundPayload } from "@anontalk/shared";
import { useSocketContext } from "@/components/socket-provider";
import { useAuthStore } from "@/store/auth-store";
import { useChatStore } from "@/store/chat-store";

export default function QueuePage() {
  const router = useRouter();
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

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-8 px-6 text-center">
      <div className="relative flex h-28 w-28 items-center justify-center">
        <span className="absolute inset-0 animate-ping rounded-full bg-primary/20" />
        <span className="absolute inset-3 animate-ping rounded-full bg-primary/30 [animation-delay:300ms]" />
        <div className="relative flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground">
          <MessageCircle className="h-6 w-6" />
        </div>
      </div>
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold">Finding someone for you…</h1>
        <p className="text-sm text-muted-foreground">This usually takes less than a second.</p>
      </div>
      <button
        onClick={() => router.push("/identity")}
        className="text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground"
      >
        Cancel
      </button>
    </div>
  );
}
