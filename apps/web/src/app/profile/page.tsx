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
    <div className="flex flex-1 flex-col overflow-hidden lg:bg-secondary">
      <header className="flex items-center justify-between border-b border-border bg-card px-6 py-5 lg:px-14 lg:py-6">
        <div className="flex items-center gap-3 lg:gap-4">
          <button
            onClick={() => router.push("/")}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-secondary lg:h-9 lg:w-9"
          >
            <ArrowLeft className="h-4 w-4" strokeWidth={2} />
          </button>
          <h1 className="font-heading text-lg font-extrabold tracking-tight">Your profile</h1>
        </div>
        <div className="hidden items-center gap-4 lg:flex">
          <span className="text-sm font-semibold text-muted-foreground">{user?.email}</span>
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-foreground text-sm font-extrabold text-background">
            {user?.displayName?.[0]?.toUpperCase()}
          </span>
        </div>
      </header>

      <div className="flex flex-1 flex-col overflow-y-auto overscroll-none px-6 py-10 lg:items-center lg:justify-center lg:px-10 lg:py-12">
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
