"use client";

import { motion } from "framer-motion";
import { AlertCircle, Ban, EyeOff, ShieldCheck } from "lucide-react";
import { API_URL } from "@/lib/api";
import { Logo } from "@/components/logo";

const TRUST_POINTS = [
  { icon: ShieldCheck, label: "Verified students only" },
  { icon: EyeOff, label: "Identity protected — you pick the mode" },
  { icon: Ban, label: "No chats stored, ever" },
];

function GoogleButton() {
  return (
    <motion.a
      whileTap={{ scale: 0.97 }}
      href={`${API_URL}/auth/google`}
      className="flex h-16 w-full items-center justify-center gap-3 rounded-full bg-foreground text-lg font-bold text-background"
    >
      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-background text-sm font-extrabold text-foreground">
        G
      </span>
      Continue with Google
    </motion.a>
  );
}

function TrustList() {
  return (
    <div className="flex flex-col gap-3">
      {TRUST_POINTS.map(({ icon: Icon, label }) => (
        <div key={label} className="flex items-center gap-3.5 rounded-2xl bg-secondary px-4.5 py-4">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-cobalt text-cobalt-foreground">
            <Icon className="h-4 w-4" strokeWidth={2} />
          </span>
          <span className="text-sm font-medium lg:text-base">{label}</span>
        </div>
      ))}
    </div>
  );
}

export function LoginCard({ errorMessage }: { errorMessage: string | null }) {
  return (
    <div className="flex flex-1 flex-col overflow-hidden lg:grid lg:grid-cols-2">
      <div className="hidden flex-col justify-between bg-cobalt p-14 lg:flex">
        <Logo tone="white" />
        <h2 className="font-heading text-6xl leading-[0.95] font-extrabold tracking-tight text-white">
          A stranger,
          <br />
          but one of us.
        </h2>
        <p className="text-base text-white/75">Only @bvmengineering.ac.in accounts allowed</p>
      </div>

      <div className="flex items-center px-6 pt-6 lg:hidden">
        <Logo />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="flex flex-1 flex-col justify-center gap-6 overflow-y-auto overscroll-none px-6 py-12 lg:px-20"
      >
        <div className="flex flex-col gap-2">
          <h1 className="font-heading text-4xl font-extrabold tracking-tight lg:text-5xl">One tap to get in.</h1>
          <p className="text-base text-muted-foreground lg:text-lg">
            We only read your email domain to confirm you&apos;re a student. Nothing else leaves Google.
          </p>
        </div>

        {errorMessage && (
          <div className="flex items-start gap-3 rounded-2xl border-2 border-orange bg-orange-light p-4">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-orange text-orange-foreground">
              <AlertCircle className="h-3.5 w-3.5" strokeWidth={2.5} />
            </span>
            <span className="text-sm text-orange">{errorMessage}</span>
          </div>
        )}

        <GoogleButton />
        <TrustList />

        <p className="text-center text-xs font-medium text-muted-foreground lg:hidden">
          Only @bvmengineering.ac.in accounts allowed
        </p>
      </motion.div>
    </div>
  );
}
