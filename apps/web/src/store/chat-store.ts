import { create } from "zustand";
import type { PeerIdentity } from "@anontalk/shared";

interface ChatSessionState {
  sessionId: string | null;
  peer: PeerIdentity | null;
  startedAt: string | null;
  setMatch: (sessionId: string, peer: PeerIdentity, startedAt: string) => void;
  clear: () => void;
}

export const useChatStore = create<ChatSessionState>((set) => ({
  sessionId: null,
  peer: null,
  startedAt: null,
  setMatch: (sessionId, peer, startedAt) => set({ sessionId, peer, startedAt }),
  clear: () => set({ sessionId: null, peer: null, startedAt: null }),
}));
