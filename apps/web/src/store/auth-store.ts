import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CurrentUserDto } from "@anontalk/shared";

interface AuthState {
  accessToken: string | null;
  user: CurrentUserDto | null;
  hasHydrated: boolean;
  setHasHydrated: (value: boolean) => void;
  setSession: (accessToken: string, user: CurrentUserDto) => void;
  setUser: (user: CurrentUserDto) => void;
  clear: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      user: null,
      hasHydrated: false,
      setHasHydrated: (value) => set({ hasHydrated: value }),
      setSession: (accessToken, user) => set({ accessToken, user }),
      setUser: (user) => set({ user }),
      clear: () => set({ accessToken: null, user: null }),
    }),
    {
      name: "anontalk-auth",
      // hasHydrated must never be persisted -- it needs to start `false` on every
      // fresh load so guarded pages can wait for rehydration instead of reading
      // `user` before localStorage has actually been restored.
      partialize: (state) => ({ accessToken: state.accessToken, user: state.user }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    },
  ),
);
