"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { useAuthStore } from "@/store/auth-store";
import { ProfileForm } from "@/components/profile-form";

export default function ProfilePage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const hasHydrated = useAuthStore((s) => s.hasHydrated);
  const [showSaved, setShowSaved] = useState(false);

  useEffect(() => {
    if (hasHydrated && !user) router.replace("/login");
  }, [hasHydrated, user, router]);

  if (!hasHydrated || !user) return null;

  return (
    <div className="flex flex-1 flex-col items-center gap-8 overflow-y-auto px-6 py-10 text-center">
      <div className="flex w-full max-w-sm items-center gap-3">
        <button
          onClick={() => router.push("/")}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-card shadow-sm"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="text-left">
          <h1 className="font-heading text-lg font-bold">Your profile</h1>
          <p className="text-xs text-muted-foreground">Update anytime — changes apply to your next chat</p>
        </div>
      </div>

      <ProfileForm
        initialUser={user}
        submitLabel="Save changes"
        onSaved={(updated) => {
          setUser(updated);
          setShowSaved(true);
          setTimeout(() => setShowSaved(false), 2500);
        }}
      />

      <AnimatePresence>
        {showSaved && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="flex items-center gap-2 rounded-full bg-sage-light px-4 py-2 text-sm font-semibold text-foreground"
          >
            <CheckCircle2 className="h-4 w-4 text-sage" />
            Profile updated
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
