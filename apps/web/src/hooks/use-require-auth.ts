"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth-store";

/**
 * Gate for pages that require a logged-in user. Waits for zustand's persist
 * middleware to finish rehydrating from localStorage before deciding whether
 * to redirect -- checking `user` before hydration completes would bounce a
 * genuinely logged-in user to /login on every fresh page load.
 */
export function useRequireAuth() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const hasHydrated = useAuthStore((s) => s.hasHydrated);

  useEffect(() => {
    if (hasHydrated && !user) router.replace("/login");
  }, [hasHydrated, user, router]);

  return { user, ready: hasHydrated && !!user };
}
