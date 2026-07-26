"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowRight, ShieldCheck, EyeOff, Ban, UserCog } from "lucide-react";
import type { OnlineCountPayload } from "@anontalk/shared";
import { useAuthStore } from "@/store/auth-store";
import { useSocketContext } from "@/components/socket-provider";

const FEATURES = [
  {
    icon: ShieldCheck,
    title: "Verified students only",
    description: "Google login gated to your campus domain.",
    tone: "cobalt" as const,
  },
  {
    icon: EyeOff,
    title: "Identity protected",
    description: "Switch between anonymous and real profile any time.",
    tone: "cobalt" as const,
  },
  {
    icon: Ban,
    title: "No chats stored",
    description: "Messages disappear when the chat ends — unless reported.",
    tone: "orange" as const,
  },
];

export default function Home() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const socket = useSocketContext();
  const [onlineCount, setOnlineCount] = useState<number | null>(null);

  useEffect(() => {
    if (!socket) return;
    function handleOnlineCount(payload: OnlineCountPayload) {
      setOnlineCount(payload.count);
    }
    socket.on("online_count", handleOnlineCount);
    return () => {
      socket.off("online_count", handleOnlineCount);
    };
  }, [socket]);

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
    <div className="flex flex-1 flex-col">
      <header className="flex items-center justify-between px-6 py-5 lg:px-14 lg:py-6">
        <div className="flex items-center gap-3">
          <span className="h-8 w-8 rounded-full bg-cobalt lg:h-8 lg:w-8" />
          <span className="font-heading text-lg font-extrabold tracking-tight">AnonTalk</span>
        </div>
        {user && (
          <button
            onClick={() => router.push("/profile")}
            aria-label="Your profile"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary"
          >
            <UserCog className="h-4 w-4 text-foreground" strokeWidth={1.75} />
          </button>
        )}
      </header>

      <div className="flex flex-1 flex-col px-6 pb-10 lg:grid lg:grid-cols-2 lg:items-center lg:gap-16 lg:px-14 lg:pb-0">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="flex flex-1 flex-col justify-center gap-5 lg:flex-none lg:gap-7"
        >
          <span className="inline-flex w-fit items-center rounded-full bg-foreground px-4 py-2 text-xs font-semibold tracking-wide text-background">
            CAMPUS ONLY{onlineCount !== null && ` · ${onlineCount} ONLINE`}
          </span>

          <h1 className="font-heading text-6xl leading-[0.9] font-extrabold tracking-tight lg:text-8xl">
            Anon
            <br />
            <span className="text-cobalt">Talk</span>
          </h1>

          <p className="max-w-sm text-lg text-muted-foreground lg:text-2xl">
            Two minutes with a stranger who sits three rows behind you.
          </p>

          <div className="flex flex-wrap gap-2">
            <span className="rounded-full bg-secondary px-4 py-2.5 text-sm font-semibold">Anonymous or real</span>
            <span className="rounded-full bg-orange-light px-4 py-2.5 text-sm font-semibold text-orange">
              Nothing stored
            </span>
          </div>

          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={handleStartChat}
            className="mt-2 flex h-16 w-full items-center justify-center gap-2 rounded-full bg-cobalt text-lg font-extrabold text-cobalt-foreground shadow-[0_14px_30px_-8px_rgba(27,52,255,.4)] lg:w-fit lg:px-14"
          >
            Start Chatting
            <ArrowRight className="h-5 w-5" />
          </motion.button>

          <p className="text-sm font-medium text-muted-foreground">Only @bvmengineering.ac.in accounts allowed</p>
        </motion.div>

        <div className="hidden flex-col gap-4 lg:flex">
          {FEATURES.map(({ icon: Icon, title, description, tone }) => (
            <div key={title} className="flex items-center gap-4 rounded-2xl bg-card p-6 shadow-[0_8px_24px_-12px_rgba(10,10,20,.15)]">
              <span
                className={
                  "flex h-11 w-11 shrink-0 items-center justify-center rounded-full " +
                  (tone === "cobalt" ? "bg-cobalt text-cobalt-foreground" : "bg-orange text-orange-foreground")
                }
              >
                <Icon className="h-5 w-5" strokeWidth={1.75} />
              </span>
              <div className="flex flex-col gap-0.5">
                <span className="font-heading text-base font-extrabold">{title}</span>
                <span className="text-sm text-muted-foreground">{description}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
