"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, LogOut } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { useAuthStore } from "@/store/auth-store";
import { useRequireAuth } from "@/hooks/use-require-auth";
import { ProfileForm } from "@/components/profile-form";
import { Toast } from "@/components/toast";

export default function ProfilePage() {
  const router = useRouter();
  const { user, ready } = useRequireAuth();
  const setUser = useAuthStore((s) => s.setUser);
  const clear = useAuthStore((s) => s.clear);
  const [showSaved, setShowSaved] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  async function handleLogout() {
    setLoggingOut(true);
    await apiFetch("/auth/logout", { method: "POST" }).catch(() => {});
    clear();
    router.push("/login");
  }

  if (!ready) return null;

  return (
    <div className="flex flex-1 flex-col lg:bg-secondary">
      <header className="hidden items-center justify-between border-b border-border bg-card px-14 py-6 lg:flex">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push("/")}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary"
          >
            <ArrowLeft className="h-4 w-4" strokeWidth={2} />
          </button>
          <span className="font-heading text-lg font-extrabold tracking-tight">Your profile</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm font-semibold text-muted-foreground">{user?.email}</span>
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-foreground text-sm font-extrabold text-background">
            {user?.displayName?.[0]?.toUpperCase()}
          </span>
        </div>
      </header>

      <div className="flex flex-1 flex-col px-6 py-10 lg:items-center lg:justify-center lg:px-10 lg:py-12">
        <div className="mb-6 flex items-center gap-3 lg:hidden">
          <button
            onClick={() => router.push("/")}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary"
          >
            <ArrowLeft className="h-4 w-4" strokeWidth={2} />
          </button>
          <h1 className="font-heading text-2xl font-extrabold tracking-tight">Your profile</h1>
        </div>

        <div className="flex w-full max-w-3xl flex-col gap-8 lg:rounded-3xl lg:bg-card lg:p-14 lg:shadow-[0_16px_44px_-16px_rgba(10,10,20,.18)]">
          <h1 className="hidden font-heading text-4xl font-extrabold tracking-tight lg:block">Edit your details</h1>

          <ProfileForm
            initialUser={user}
            submitLabel="Save changes"
            submitTone="primary"
            onSaved={(updated) => {
              setUser(updated);
              setShowSaved(true);
              setTimeout(() => setShowSaved(false), 2500);
            }}
          />

          <button
            type="button"
            onClick={handleLogout}
            disabled={loggingOut}
            className="flex items-center justify-center gap-2 rounded-full border border-border py-3.5 text-sm font-bold text-muted-foreground disabled:opacity-60 lg:self-start lg:px-7"
          >
            <LogOut className="h-4 w-4" strokeWidth={2} />
            Log out
          </button>
        </div>
      </div>

      <Toast show={showSaved} message="Profile updated" />
    </div>
  );
}
