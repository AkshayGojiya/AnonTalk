"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth-store";
import { apiFetch } from "@/lib/api";

/**
 * Gate for pages that require a logged-in user. Waits for zustand's persist
 * middleware to finish rehydrating from localStorage, then actively verifies
 * the session against the server (GET /users/me) rather than trusting the
 * cached user object alone -- a stale/expired session (refresh cookie expired,
 * banned, tokenVersion bumped elsewhere) would otherwise still render the page
 * as if logged in, only failing once the user tries to submit something.
 * apiFetch's own 401 -> refresh -> clear() flow updates the store on failure,
 * which this hook picks up like any other state change.
 */
export function useRequireAuth() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const hasHydrated = useAuthStore((s) => s.hasHydrated);
  const setUser = useAuthStore((s) => s.setUser);
  const [verifying, setVerifying] = useState(true);

  useEffect(() => {
    if (!hasHydrated) return;
    if (!user) {
      router.replace("/login");
      return;
    }

    let cancelled = false;
    apiFetch("/users/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((fresh) => {
        if (cancelled) return;
        if (fresh) setUser(fresh);
        setVerifying(false);
      })
      .catch(() => {
        if (!cancelled) setVerifying(false);
      });

    return () => {
      cancelled = true;
    };
    // Depend on user?.id (not the whole user object) -- setUser above assigns
    // a new object reference every time, and depending on the full object
    // would re-run this effect after every single verification, forever.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasHydrated, user?.id, router, setUser]);

  return { user, ready: hasHydrated && !!user && !verifying };
}
