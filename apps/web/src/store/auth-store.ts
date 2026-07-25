import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CurrentUserDto } from "@anontalk/shared";

interface AuthState {
  accessToken: string | null;
  user: CurrentUserDto | null;
  setSession: (accessToken: string, user: CurrentUserDto) => void;
  setUser: (user: CurrentUserDto) => void;
  clear: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      user: null,
      setSession: (accessToken, user) => set({ accessToken, user }),
      setUser: (user) => set({ user }),
      clear: () => set({ accessToken: null, user: null }),
    }),
    { name: "anontalk-auth" },
  ),
);
