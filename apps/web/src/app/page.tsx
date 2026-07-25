"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/auth-store";

export default function Home() {
  const router = useRouter();
  const isAuthenticated = useAuthStore((s) => Boolean(s.user));

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 bg-background px-6 text-center text-foreground">
      <div className="flex flex-col gap-2">
        <h1 className="text-4xl font-semibold tracking-tight">
          Anon<span className="text-primary">Talk</span>
        </h1>
        <p className="text-muted-foreground">Verified students. Real conversations.</p>
      </div>
      <Button onClick={() => router.push(isAuthenticated ? "/identity" : "/login")}>Start Chat</Button>
    </div>
  );
}
