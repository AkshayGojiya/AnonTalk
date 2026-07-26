import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CurrentUserDto } from "@anontalk/shared";

interface AuthState {
  accessToken: string | null;
  user: CurrentUserDto | null;
  hasHydrated: boolean;
  justLoggedIn: boolean;
  setHasHydrated: (value: boolean) => void;
  setSession: (accessToken: string, user: CurrentUserDto) => void;
  setUser: (user: CurrentUserDto) => void;
  clearJustLoggedIn: () => void;
  clear: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      user: null,
      hasHydrated: false,
      justLoggedIn: false,
      setHasHydrated: (value) => set({ hasHydrated: value }),
      setSession: (accessToken, user) => set({ accessToken, user, justLoggedIn: true }),
      setUser: (user) => set({ user }),
      clearJustLoggedIn: () => set({ justLoggedIn: false }),
      clear: () => set({ accessToken: null, user: null }),
    }),
    {
      name: "anontalk-auth",
      // hasHydrated/justLoggedIn must never be persisted: hasHydrated needs to
      // start `false` on every fresh load so guarded pages can wait for
      // rehydration instead of reading `user` before localStorage has actually
      // restored, and justLoggedIn is a one-shot signal that shouldn't re-fire
      // just because the page was reloaded.
      partialize: (state) => ({ accessToken: state.accessToken, user: state.user }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    },
  ),
);
