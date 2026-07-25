"use client";

import { motion } from "framer-motion";
import { Check, Ghost, User as UserIcon } from "lucide-react";
import type { UserMode } from "@anontalk/shared";
import { cn } from "@/lib/utils";

const MODE_OPTIONS: Array<{
  mode: UserMode;
  title: string;
  description: string;
  icon: typeof Ghost;
  tone: "sage" | "coral";
}> = [
  {
    mode: "ANONYMOUS",
    title: "Anonymous",
    description: "Only your display name is shown. No dept or year.",
    icon: Ghost,
    tone: "sage",
  },
  {
    mode: "REAL",
    title: "Real Profile",
    description: "Shows your display name, dept & year.",
    icon: UserIcon,
    tone: "coral",
  },
];

export function ModePicker({ value, onChange }: { value: UserMode; onChange: (mode: UserMode) => void }) {
  return (
    <div className="grid w-full grid-cols-2 gap-3">
      {MODE_OPTIONS.map(({ mode, title, description, icon: Icon, tone }, i) => {
        const selected = value === mode;
        return (
          <motion.button
            key={mode}
            type="button"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.1 + i * 0.08 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => onChange(mode)}
            className={cn(
              "relative flex min-h-[10.5rem] flex-col items-start gap-4 rounded-2xl p-5 text-left transition-shadow",
              tone === "sage" ? "bg-sage-light" : "bg-coral-light",
              selected ? "shadow-[0_0_0_3px_var(--foreground)]" : "shadow-none",
            )}
          >
            {selected && (
              <span className="absolute top-4 right-4 flex h-5 w-5 items-center justify-center rounded-full bg-foreground">
                <Check className="h-3 w-3 text-background" strokeWidth={3} />
              </span>
            )}
            <div
              className={cn(
                "flex h-11 w-11 shrink-0 items-center justify-center rounded-full",
                tone === "sage" ? "bg-sage text-sage-foreground" : "bg-coral text-coral-foreground",
              )}
            >
              <Icon className="h-5 w-5" strokeWidth={1.75} />
            </div>
            <div className="mt-auto">
              <p className="font-heading text-sm font-bold">{title}</p>
              <p className="mt-1 text-xs leading-snug text-muted-foreground">{description}</p>
            </div>
          </motion.button>
        );
      })}
    </div>
  );
}
