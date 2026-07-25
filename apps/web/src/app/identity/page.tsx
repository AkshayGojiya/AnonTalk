"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Ghost, User } from "lucide-react";
import type { UserMode } from "@anontalk/shared";
import { cn } from "@/lib/utils";
import { apiFetch } from "@/lib/api";
import { useAuthStore } from "@/store/auth-store";

const OPTIONS: Array<{ mode: UserMode; title: string; description: string; icon: typeof Ghost }> = [
  {
    mode: "ANONYMOUS",
    title: "Anonymous",
    description: "Chat with a random generated identity. No personal info shown.",
    icon: Ghost,
  },
  {
    mode: "REAL",
    title: "Real Profile",
    description: "Chat using your name, department, and college.",
    icon: User,
  },
];

export default function IdentityPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const [selected, setSelected] = useState<UserMode>(user?.defaultMode ?? "ANONYMOUS");
  const [loading, setLoading] = useState(false);

  async function handleContinue() {
    setLoading(true);
    const res = await apiFetch("/users/me/mode", {
      method: "PATCH",
      body: JSON.stringify({ mode: selected }),
    });
    if (res.ok) {
      const updated = await res.json();
      setUser(updated);
      router.push("/queue");
    } else {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-8 px-6 text-center">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">Choose your identity</h1>
        <p className="text-sm text-muted-foreground">You can always change this later</p>
      </div>

      <div className="flex w-full max-w-sm flex-col gap-3">
        {OPTIONS.map(({ mode, title, description, icon: Icon }) => (
          <button
            key={mode}
            onClick={() => setSelected(mode)}
            className={cn(
              "flex items-center gap-4 rounded-xl border p-4 text-left transition-colors",
              selected === mode ? "border-primary bg-primary/10" : "border-border bg-card hover:bg-secondary",
            )}
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary">
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <p className="font-medium">{title}</p>
              <p className="text-xs text-muted-foreground">{description}</p>
            </div>
          </button>
        ))}
      </div>

      <button
        onClick={handleContinue}
        disabled={loading}
        className="flex h-11 w-full max-w-sm items-center justify-center gap-2 rounded-lg bg-primary text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
      >
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        Continue
      </button>
    </div>
  );
}
