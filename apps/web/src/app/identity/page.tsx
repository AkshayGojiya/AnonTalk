"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useAuthStore } from "@/store/auth-store";
import { useRequireAuth } from "@/hooks/use-require-auth";
import { ProfileForm } from "@/components/profile-form";

export default function IdentityPage() {
  const router = useRouter();
  const { user, ready } = useRequireAuth();
  const setUser = useAuthStore((s) => s.setUser);

  if (!ready) return null;

  return (
    <div className="flex flex-1 flex-col items-center gap-8 overflow-y-auto px-6 py-12 text-center">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col gap-2"
      >
        <p className="text-xs font-bold tracking-[0.25em] text-coral uppercase">One-time setup</p>
        <h1 className="font-heading text-3xl font-bold tracking-tight">Tell us about you</h1>
        <p className="text-sm text-muted-foreground">You can change any of this later from your profile</p>
      </motion.div>

      <ProfileForm
        initialUser={user}
        submitLabel="Continue"
        onSaved={(updated) => {
          setUser(updated);
          router.push("/queue");
        }}
      />
    </div>
  );
}
