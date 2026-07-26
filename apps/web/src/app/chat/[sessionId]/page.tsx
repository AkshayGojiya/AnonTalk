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
  const self = useAuthStore((s) => s.user);

  const peer = useChatStore((s) => (s.sessionId === sessionId ? s.peer : null));
  const setMatch = useChatStore((s) => s.setMatch);
  const clearMatch = useChatStore((s) => s.clear);

  const [messages, setMessages] = useState<ReceiveMessagePayload[]>([]);
  const [peerTyping, setPeerTyping] = useState(false);
  const [endedReason, setEndedReason] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [reportOpen, setReportOpen] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
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
      if (payload.reason === "skip") {
        // Whoever clicked Next already left+requeued themselves client-side;
        // the peer gets no say in it either -- both sides land back in the
        // queue automatically rather than the peer needing to click through
        // a "chat ended" screen first.
        clearMatch();
        router.replace("/queue");
        return;
      }
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
  }, [socket, sessionId, setMatch, router, peer, clearMatch]);

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
    // Sending shouldn't close the mobile keyboard -- re-focus in case the
    // send button (or the Enter keypress's default handling) took it away.
    inputRef.current?.focus();
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
    <div className="flex flex-1 overflow-hidden lg:bg-secondary">
      <aside className="hidden w-[300px] shrink-0 flex-col gap-6 overflow-y-auto border-r border-border bg-secondary p-6 lg:flex">
        <div className="flex items-center gap-3">
          <span className="h-7 w-7 rounded-full bg-cobalt" />
          <span className="font-heading text-lg font-extrabold tracking-tight">AnonTalk</span>
        </div>

        <div className="flex flex-col gap-2 rounded-2xl bg-card p-5">
          <span className="text-xs font-bold tracking-wide text-muted-foreground">YOU APPEAR AS</span>
          <span className="font-heading text-lg font-extrabold">{self?.displayName}</span>
          <span
            className={cn(
              "inline-flex w-fit items-center rounded-full px-3 py-1 text-xs font-bold",
              self?.defaultMode === "REAL" ? "bg-orange-light text-orange" : "bg-cobalt-light text-cobalt",
            )}
          >
            {self?.defaultMode === "REAL" ? "Real Profile" : "Anonymous"}
          </span>
        </div>

        <div className="flex flex-col gap-1.5 rounded-2xl bg-card p-5">
          <span className="text-xs font-bold tracking-wide text-muted-foreground">THIS SESSION</span>
          <span className="text-sm leading-relaxed text-muted-foreground">
            Nothing in this window is saved. Closing the tab ends the chat.
          </span>
        </div>

        <div className="flex-1" />

        <button
          onClick={() => router.push("/profile")}
          className="rounded-full border border-border py-3.5 text-sm font-bold text-muted-foreground"
        >
          Profile &amp; settings
        </button>
      </aside>

      <div className="flex flex-1 flex-col overflow-hidden bg-background">
        <header className="flex items-center justify-between gap-3 border-b border-border bg-card px-4 py-3 lg:px-9 lg:py-5">
          {peer ? <PeerBadge peer={peer} /> : <div className="h-11" />}
          <div className="flex items-center gap-2 lg:gap-2.5">
            <button
              onClick={() => setReportOpen(true)}
              className="flex items-center gap-1.5 rounded-full bg-orange-light px-3.5 py-2 text-sm font-bold text-orange lg:px-5 lg:py-2.5"
            >
              <Flag className="h-3.5 w-3.5" />
              Report
            </button>
            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={handleSkip}
              className="flex items-center gap-1.5 rounded-full bg-foreground px-3.5 py-2 text-sm font-bold text-background lg:px-5 lg:py-2.5"
            >
              Next
              <ArrowRight className="h-3.5 w-3.5" />
            </motion.button>
          </div>
        </header>

        <div className="flex flex-1 flex-col gap-2.5 overflow-y-auto px-4 py-5 lg:px-9 lg:py-7">
          {messages.length === 0 && !isEnded && (
            <div className="flex flex-1 flex-col items-center justify-center gap-1 text-center text-muted-foreground">
              <p className="font-heading font-extrabold text-foreground">Start the conversation!</p>
              <p className="text-sm">Say hi to break the ice.</p>
            </div>
          )}

          <AnimatePresence initial={false}>
            {messages.map((message) => {
              const isSelf = message.senderId === self?.id;
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
                      "max-w-[75%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed lg:max-w-[55%] lg:px-5 lg:py-3 lg:text-base",
                      isSelf
                        ? "rounded-br-md bg-cobalt text-cobalt-foreground"
                        : "rounded-bl-md bg-secondary text-foreground",
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
              <div className="flex items-center gap-1 rounded-2xl rounded-bl-md bg-secondary px-4 py-3">
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.3s]" />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.15s]" />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground" />
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {isEnded ? (
          <div className="flex items-center justify-between gap-3 border-t border-border bg-card px-4 py-4 lg:px-9 lg:py-6">
            <p className="text-sm text-muted-foreground">
              {endedReason === "peer_disconnected" ? "Your chat partner left." : "This chat has ended."}
            </p>
            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={handleFindNewChat}
              className="rounded-full bg-cobalt px-5 py-2.5 text-sm font-bold text-cobalt-foreground"
            >
              Find new chat
            </motion.button>
          </div>
        ) : (
          <div className="border-t border-border bg-card pt-3 lg:px-5 lg:pt-4 lg:pb-5">
            <div className="flex items-center gap-2.5 px-4 pb-3 lg:gap-3.5 lg:px-4 lg:pb-0">
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => handleInputChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="Type a message…"
                className="h-12 flex-1 rounded-full bg-secondary px-5 text-base outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-ring lg:h-14"
              />
              <motion.button
                whileTap={{ scale: 0.9 }}
                onMouseDown={(e) => e.preventDefault()}
                onClick={handleSend}
                disabled={!input.trim()}
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-cobalt text-cobalt-foreground disabled:opacity-40 lg:h-14 lg:w-14"
              >
                <Send className="h-4 w-4" />
              </motion.button>
            </div>
          </div>
        )}
      </div>

      <ReportDialog open={reportOpen} onOpenChange={setReportOpen} sessionId={sessionId} />
    </div>
  );
}
