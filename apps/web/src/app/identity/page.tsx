"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useAuthStore } from "@/store/auth-store";
import { useRequireAuth } from "@/hooks/use-require-auth";
import { ProfileForm } from "@/components/profile-form";
import { Logo } from "@/components/logo";

export default function IdentityPage() {
  const router = useRouter();
  const { user, ready } = useRequireAuth();
  const setUser = useAuthStore((s) => s.setUser);

  if (!ready) return null;

  return (
    <div className="flex flex-1 flex-col overflow-hidden lg:bg-secondary">
      <header className="flex items-center justify-between border-b border-border bg-card px-6 py-5 lg:px-14 lg:py-6">
        <Logo />
        <span className="hidden text-sm font-semibold text-muted-foreground lg:block">{user?.email}</span>
      </header>

      <div className="flex flex-1 flex-col overflow-y-auto overscroll-none px-6 py-10 lg:items-center lg:justify-center lg:px-10 lg:py-12">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex w-full max-w-3xl flex-col gap-8 lg:rounded-3xl lg:bg-card lg:p-14 lg:shadow-[0_16px_44px_-16px_rgba(10,10,20,.18)]"
        >
          <div className="flex flex-col gap-3">
            <div className="h-1.5 w-40 overflow-hidden rounded-full bg-muted">
              <div className="h-full w-[70%] rounded-full bg-cobalt" />
            </div>
            <h1 className="font-heading text-4xl font-extrabold tracking-tight lg:text-5xl">Tell us about you</h1>
            <p className="text-base text-muted-foreground">
              One time only. You can change all of this later in your profile.
            </p>
          </div>

          <ProfileForm
            initialUser={user}
            submitLabel="Continue"
            onSaved={(updated) => {
              setUser(updated);
              router.push("/");
            }}
          />
        </motion.div>
      </div>
    </div>
  );
}
