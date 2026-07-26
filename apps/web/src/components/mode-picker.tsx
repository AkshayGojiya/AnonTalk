"use client";

import { Check, Ghost, User as UserIcon } from "lucide-react";
import type { UserMode } from "@anontalk/shared";
import { cn } from "@/lib/utils";

const MODE_OPTIONS: Array<{
  mode: UserMode;
  title: string;
  description: string;
  icon: typeof Ghost;
  tone: "cobalt" | "orange";
}> = [
  {
    mode: "ANONYMOUS",
    title: "Anonymous",
    description: "Only your display name is shown to partners.",
    icon: Ghost,
    tone: "cobalt",
  },
  {
    mode: "REAL",
    title: "Real Profile",
    description: "Display name + dept + year shown.",
    icon: UserIcon,
    tone: "orange",
  },
];

export function ModePicker({ value, onChange }: { value: UserMode; onChange: (mode: UserMode) => void }) {
  return (
    <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-2">
      {MODE_OPTIONS.map(({ mode, title, description, icon: Icon, tone }) => {
        const selected = value === mode;
        return (
          <button
            key={mode}
            type="button"
            onClick={() => onChange(mode)}
            className={cn(
              "relative flex items-start gap-4 rounded-2xl p-5 text-left transition-colors",
              selected
                ? tone === "cobalt"
                  ? "bg-cobalt text-cobalt-foreground"
                  : "bg-orange text-orange-foreground"
                : "border border-border bg-card text-foreground",
            )}
          >
            <span
              className={cn(
                "flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
                selected ? "bg-white/20" : "bg-muted text-muted-foreground",
              )}
            >
              <Icon className="h-4 w-4" strokeWidth={1.75} />
            </span>
            <span className="flex flex-col gap-1">
              <span className="font-heading text-base font-extrabold">{title}</span>
              <span className={cn("text-sm leading-snug", selected ? "text-white/85" : "text-muted-foreground")}>
                {description}
              </span>
            </span>
            {selected && (
              <span className="absolute top-4 right-4 flex h-5 w-5 items-center justify-center rounded-full bg-white/25">
                <Check className="h-3 w-3" strokeWidth={3} />
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
