"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Flag, Send } from "lucide-react";
import type {
  ErrorPayload,
  MatchFoundPayload,
  ReceiveMessagePayload,
  SessionEndedPayload,
  TypingBroadcastPayload,
} from "@anontalk/shared";
import { useSocketContext } from "@/components/socket-provider";
import { useAuthStore } from "@/store/auth-store";
import { useChatStore } from "@/store/chat-store";
import { useRequireAuth } from "@/hooks/use-require-auth";
import { PeerBadge } from "@/components/chat/peer-badge";
import { ReportDialog } from "@/components/chat/report-dialog";
import { cn } from "@/lib/utils";

const TYPING_STOP_DELAY_MS = 2000;

export default function ChatPageRoute() {
  const params = useParams<{ sessionId: string }>();
  // Remounting on sessionId change (via key) resets all chat state for free —
  // no manual reset-effect needed when a user skips into a new session.
  return <ChatPage key={params.sessionId} sessionId={params.sessionId} />;
}

function ChatPage({ sessionId }: { sessionId: string }) {
  const router = useRouter();
  const { ready } = useRequireAuth();
  const socket = useSocketContext();
  const selfId = useAuthStore((s) => s.user?.id);

  const peer = useChatStore((s) => (s.sessionId === sessionId ? s.peer : null));
  const setMatch = useChatStore((s) => s.setMatch);
  const clearMatch = useChatStore((s) => s.clear);

  const [messages, setMessages] = useState<ReceiveMessagePayload[]>([]);
  const [peerTyping, setPeerTyping] = useState(false);
  const [endedReason, setEndedReason] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [reportOpen, setReportOpen] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isTypingRef = useRef(false);

  useEffect(() => {
    if (!socket) return;

    function handleMatchFound(payload: MatchFoundPayload) {
      if (payload.sessionId !== sessionId) {
        // The server says our real active session is a different one -- this
        // URL doesn't belong to us (stale link, or typed/guessed directly).
        router.replace(`/chat/${payload.sessionId}`);
        return;
      }
      setMatch(payload.sessionId, payload.peer, payload.startedAt);
      setEndedReason(null);
    }
    function handleReceiveMessage(payload: ReceiveMessagePayload) {
      if (payload.sessionId !== sessionId) return;
      setMessages((prev) => [...prev, payload]);
    }
    function handleTyping(payload: TypingBroadcastPayload) {
      if (payload.sessionId !== sessionId) return;
      setPeerTyping(payload.isTyping);
    }
    function handleSessionEnded(payload: SessionEndedPayload) {
      if (payload.sessionId !== sessionId) return;
      setEndedReason(payload.reason);
    }
    function handlePeerReconnected(payload: { sessionId: string }) {
      if (payload.sessionId !== sessionId) return;
      setEndedReason(null);
    }
    function handleError(payload: ErrorPayload) {
      if (payload.code === "no_active_session") router.replace("/queue");
    }

    socket.on("match_found", handleMatchFound);
    socket.on("receive_message", handleReceiveMessage);
    socket.on("typing", handleTyping);
    socket.on("session_ended", handleSessionEnded);
    socket.on("peer_reconnected", handlePeerReconnected);
    socket.on("error", handleError);

    // A page landed on directly (bookmark, typed URL, reload) won't have a
    // locally-known peer yet -- confirm this sessionId is actually ours rather
    // than trusting the URL param alone.
    if (!peer) socket.emit("check_session");

    return () => {
      socket.off("match_found", handleMatchFound);
      socket.off("receive_message", handleReceiveMessage);
      socket.off("typing", handleTyping);
      socket.off("session_ended", handleSessionEnded);
      socket.off("peer_reconnected", handlePeerReconnected);
      socket.off("error", handleError);
    };
  }, [socket, sessionId, setMatch, router, peer]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, peerTyping]);

  function stopTyping() {
    if (!isTypingRef.current || !socket) return;
    isTypingRef.current = false;
    socket.emit("typing_stop", { sessionId });
  }

  function handleInputChange(value: string) {
    setInput(value);
    if (!socket) return;

    if (!isTypingRef.current) {
      isTypingRef.current = true;
      socket.emit("typing_start", { sessionId });
    }
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(stopTyping, TYPING_STOP_DELAY_MS);
  }

  function handleSend() {
    const content = input.trim();
    if (!content || !socket) return;
    socket.emit("send_message", { sessionId, content, clientMsgId: crypto.randomUUID() });
    setInput("");
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    stopTyping();
  }

  function handleSkip() {
    socket?.emit("skip", { sessionId });
    clearMatch();
    router.replace("/queue");
  }

  function handleFindNewChat() {
    clearMatch();
    router.replace("/queue");
  }

  const isEnded = endedReason !== null;

  if (!ready) return null;

  return (
    <div className="flex flex-1 flex-col bg-background">
      <header className="flex items-center bg-card px-4 py-3 shadow-[0_2px_12px_-6px_rgba(43,36,32,0.12)]">
        {peer ? <PeerBadge peer={peer} /> : <div className="h-11" />}
      </header>

      <div className="flex flex-1 flex-col gap-2.5 overflow-y-auto px-4 py-5">
        {messages.length === 0 && !isEnded && (
          <div className="flex flex-1 flex-col items-center justify-center gap-1 text-center text-muted-foreground">
            <p className="font-heading font-bold text-foreground">Start the conversation!</p>
            <p className="text-sm">Say hi to break the ice.</p>
          </div>
        )}

        <AnimatePresence initial={false}>
          {messages.map((message) => {
            const isSelf = message.senderId === selfId;
            return (
              <motion.div
                key={message.messageId}
                initial={{ opacity: 0, y: 10, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                className={cn("flex", isSelf ? "justify-end" : "justify-start")}
              >
                <div
                  className={cn(
                    "max-w-[75%] rounded-3xl px-4 py-2.5 text-sm shadow-sm",
                    isSelf
                      ? "rounded-br-lg bg-primary text-primary-foreground"
                      : "rounded-bl-lg bg-card text-card-foreground",
                  )}
                >
                  {message.content}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {peerTyping && (
          <div className="flex justify-start">
            <div className="flex items-center gap-1 rounded-3xl rounded-bl-lg bg-card px-4 py-3 shadow-sm">
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-coral [animation-delay:-0.3s]" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-coral [animation-delay:-0.15s]" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-coral" />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {isEnded ? (
        <div className="flex items-center justify-between gap-3 bg-card px-4 py-4 shadow-[0_-2px_12px_-6px_rgba(43,36,32,0.12)]">
          <p className="text-sm text-muted-foreground">
            {endedReason === "peer_disconnected" ? "Your chat partner left." : "This chat has ended."}
          </p>
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={handleFindNewChat}
            className="rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground"
          >
            Find new chat
          </motion.button>
        </div>
      ) : (
        <div className="bg-card pt-3 shadow-[0_-2px_12px_-6px_rgba(43,36,32,0.12)]">
          <div className="flex items-center gap-2 px-4 pb-3">
            <input
              value={input}
              onChange={(e) => handleInputChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Type a message…"
              className="h-12 flex-1 rounded-full bg-muted px-5 text-sm outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-ring"
            />
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={handleSend}
              disabled={!input.trim()}
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground disabled:opacity-40"
            >
              <Send className="h-4 w-4" />
            </motion.button>
          </div>
          <div className="flex items-center justify-between gap-3 px-4 pb-4">
            <button
              onClick={() => setReportOpen(true)}
              className="flex items-center gap-1.5 text-sm font-semibold text-destructive"
            >
              <Flag className="h-4 w-4" />
              Report
            </button>
            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={handleSkip}
              className="flex items-center gap-1.5 rounded-full bg-sage-light px-4 py-2 text-sm font-semibold text-foreground"
            >
              Next
              <ArrowRight className="h-4 w-4" />
            </motion.button>
          </div>
        </div>
      )}

      <ReportDialog open={reportOpen} onOpenChange={setReportOpen} sessionId={sessionId} />
    </div>
  );
}
