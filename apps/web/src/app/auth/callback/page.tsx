"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { API_URL } from "@/lib/api";
import { useAuthStore } from "@/store/auth-store";

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <AuthCallback />
    </Suspense>
  );
}

function AuthCallback() {
  const searchParams = useSearchParams();
  const code = searchParams.get("code");
  const router = useRouter();
  const setSession = useAuthStore((s) => s.setSession);
  const [asyncError, setAsyncError] = useState<string | null>(null);
  const ranOnce = useRef(false);

  useEffect(() => {
    if (!code || ranOnce.current) return;
    ranOnce.current = true;

    fetch(`${API_URL}/auth/token`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (!data.accessToken) {
          setAsyncError("Login link expired. Please try again.");
          return;
        }
        setSession(data.accessToken, data.user);
        router.replace("/identity");
      })
      .catch(() => setAsyncError("Couldn't reach the server. Please try again."));
  }, [code, router, setSession]);

  const errorMessage = !code ? "Missing login code." : asyncError;

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
      {errorMessage ? (
        <>
          <p className="text-sm text-destructive">{errorMessage}</p>
          <a href="/login" className="text-sm text-primary underline underline-offset-4">
            Back to login
          </a>
        </>
      ) : (
        <>
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Signing you in…</p>
        </>
      )}
    </div>
  );
}
