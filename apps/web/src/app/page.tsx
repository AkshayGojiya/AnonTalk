"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowRight, MessagesSquare } from "lucide-react";
import { useAuthStore } from "@/store/auth-store";
import { DecorativeBlob } from "@/components/decorative-blob";

export default function Home() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);

  function handleStartChat() {
    if (!user) {
      router.push("/login");
    } else if (user.department) {
      router.push("/queue");
    } else {
      router.push("/identity");
    }
  }

  return (
    <div className="relative flex flex-1 flex-col items-center justify-center overflow-hidden px-6 text-center">
      <DecorativeBlob
        color="var(--coral-light)"
        variant={0}
        className="pointer-events-none absolute -top-16 -right-20 h-72 w-72 opacity-70"
      />
      <DecorativeBlob
        color="var(--sage-light)"
        variant={1}
        className="pointer-events-none absolute -bottom-24 -left-16 h-64 w-64 opacity-70"
      />

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative z-10 flex flex-col items-center gap-8"
      >
        <div className="relative flex h-28 w-28 items-center justify-center">
          <DecorativeBlob color="var(--coral)" variant={2} className="absolute inset-0" />
          <MessagesSquare className="relative h-11 w-11 text-primary-foreground" strokeWidth={1.75} />
        </div>

        <div className="flex flex-col gap-3">
          <p className="text-xs font-bold tracking-[0.25em] text-sage uppercase">College Chat, Reimagined</p>
          <h1 className="font-heading text-5xl font-bold tracking-tight text-foreground">AnonTalk</h1>
          <p className="max-w-xs text-base text-muted-foreground">
            Talk freely with verified students. Anonymous or real — always your choice.
          </p>
        </div>

        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={handleStartChat}
          className="flex h-14 items-center gap-2 rounded-full bg-primary px-8 font-heading text-sm font-semibold tracking-wide text-primary-foreground uppercase shadow-[0_12px_24px_-8px_rgba(43,36,32,0.35)]"
        >
          Start Chatting
          <ArrowRight className="h-4 w-4" />
        </motion.button>

        <p className="text-xs text-muted-foreground">Only @bvmengineering.ac.in accounts allowed</p>
      </motion.div>
    </div>
  );
}
