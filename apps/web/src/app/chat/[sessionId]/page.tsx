"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowRight, Flag, Send } from "lucide-react";
import type {
  MatchFoundPayload,
  ReceiveMessagePayload,
  SessionEndedPayload,
  TypingBroadcastPayload,
} from "@anontalk/shared";
import { useSocketContext } from "@/components/socket-provider";
import { useAuthStore } from "@/store/auth-store";
import { useChatStore } from "@/store/chat-store";
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
      if (payload.sessionId !== sessionId) return;
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

    socket.on("match_found", handleMatchFound);
    socket.on("receive_message", handleReceiveMessage);
    socket.on("typing", handleTyping);
    socket.on("session_ended", handleSessionEnded);
    socket.on("peer_reconnected", handlePeerReconnected);

    return () => {
      socket.off("match_found", handleMatchFound);
      socket.off("receive_message", handleReceiveMessage);
      socket.off("typing", handleTyping);
      socket.off("session_ended", handleSessionEnded);
      socket.off("peer_reconnected", handlePeerReconnected);
    };
  }, [socket, sessionId, setMatch]);

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

  return (
    <div className="flex flex-1 flex-col">
      <header className="border-b border-border px-4 py-3">{peer ? <PeerBadge peer={peer} /> : <div className="h-10" />}</header>

      <div className="flex flex-1 flex-col gap-2 overflow-y-auto px-4 py-4">
        {messages.length === 0 && !isEnded && (
          <div className="flex flex-1 flex-col items-center justify-center gap-1 text-center text-muted-foreground">
            <p className="font-medium text-foreground">Start the conversation!</p>
            <p className="text-sm">Say hi to break the ice.</p>
          </div>
        )}

        {messages.map((message) => {
          const isSelf = message.senderId === selfId;
          return (
            <div key={message.messageId} className={cn("flex", isSelf ? "justify-end" : "justify-start")}>
              <div
                className={cn(
                  "max-w-[75%] rounded-2xl px-4 py-2 text-sm",
                  isSelf ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground",
                )}
              >
                {message.content}
              </div>
            </div>
          );
        })}

        {peerTyping && (
          <div className="flex justify-start">
            <div className="flex items-center gap-1 rounded-2xl bg-secondary px-4 py-2.5">
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.3s]" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.15s]" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground" />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {isEnded ? (
        <div className="flex items-center justify-between gap-3 border-t border-border px-4 py-3">
          <p className="text-sm text-muted-foreground">
            {endedReason === "peer_disconnected" ? "Your chat partner left." : "This chat has ended."}
          </p>
          <button
            onClick={handleFindNewChat}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
          >
            Find new chat
          </button>
        </div>
      ) : (
        <>
          <div className="flex items-center gap-2 border-t border-border p-3">
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
              className="h-11 flex-1 rounded-lg border border-border bg-background px-4 text-sm outline-none focus:border-primary"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim()}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
          <div className="flex items-center justify-between gap-3 px-4 pb-3">
            <button
              onClick={() => setReportOpen(true)}
              className="flex items-center gap-1.5 text-sm font-medium text-destructive hover:opacity-80"
            >
              <Flag className="h-4 w-4" />
              Report
            </button>
            <button
              onClick={handleSkip}
              className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm font-medium transition-colors hover:bg-secondary"
            >
              Next
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </>
      )}

      <ReportDialog open={reportOpen} onOpenChange={setReportOpen} sessionId={sessionId} />
    </div>
  );
}
