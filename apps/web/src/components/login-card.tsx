"use client";

import { motion } from "framer-motion";
import { AlertCircle, Check, ShieldCheck } from "lucide-react";
import { API_URL } from "@/lib/api";
import { DecorativeBlob } from "@/components/decorative-blob";

const TRUST_POINTS = ["Verified college students only", "Your identity is protected", "No chats are stored"];

export function LoginCard({ errorMessage }: { errorMessage: string | null }) {
  return (
    <div className="relative flex flex-1 flex-col items-center justify-center overflow-hidden px-6 text-center">
      <DecorativeBlob
        color="var(--sage-light)"
        variant={1}
        className="pointer-events-none absolute -top-20 -left-16 h-72 w-72 opacity-70"
      />

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative z-10 flex w-full max-w-sm flex-col items-center gap-6"
      >
        <div className="relative flex h-20 w-20 items-center justify-center">
          <DecorativeBlob color="var(--sage)" variant={0} className="absolute inset-0" />
          <ShieldCheck className="relative h-8 w-8 text-sage-foreground" strokeWidth={1.75} />
        </div>

        <div className="flex flex-col gap-2">
          <h1 className="font-heading text-3xl font-bold tracking-tight">Welcome to AnonTalk</h1>
          <p className="text-sm text-muted-foreground">Sign in to continue</p>
        </div>

        <div className="flex w-full flex-col gap-5 rounded-4xl bg-card p-6 shadow-[0_20px_45px_-20px_rgba(43,36,32,0.25)]">
          {errorMessage && (
            <div className="flex items-start gap-2 rounded-2xl bg-destructive/10 p-3 text-left text-sm text-destructive">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <motion.a
            whileTap={{ scale: 0.97 }}
            href={`${API_URL}/auth/google`}
            className="flex h-14 w-full items-center justify-center gap-2 rounded-full bg-primary text-sm font-semibold text-primary-foreground"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.99.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Continue with Google
          </motion.a>

          <div className="flex flex-col gap-2.5 text-left">
            {TRUST_POINTS.map((point) => (
              <div key={point} className="flex items-center gap-2.5 text-xs text-muted-foreground">
                <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-sage-light">
                  <Check className="h-2.5 w-2.5 text-sage" strokeWidth={3} />
                </span>
                {point}
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
