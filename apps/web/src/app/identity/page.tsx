"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Loader2, Ghost, User as UserIcon, Check, ArrowRight } from "lucide-react";
import { DEPARTMENT_LABELS, YEAR_LABELS, type Department, type UserMode, type Year } from "@anontalk/shared";
import { cn } from "@/lib/utils";
import { apiFetch } from "@/lib/api";
import { useAuthStore } from "@/store/auth-store";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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
    description: "Random identity. No personal info shown.",
    icon: Ghost,
    tone: "sage",
  },
  {
    mode: "REAL",
    title: "Real Profile",
    description: "Chat using your name, dept & year.",
    icon: UserIcon,
    tone: "coral",
  },
];

export default function IdentityPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const [department, setDepartment] = useState<Department | "">(user?.department ?? "");
  const [year, setYear] = useState<Year | "">(user?.year ?? "");
  const [mode, setMode] = useState<UserMode>(user?.defaultMode ?? "ANONYMOUS");
  const [loading, setLoading] = useState(false);

  const canContinue = department !== "" && year !== "";

  async function handleContinue() {
    if (!canContinue) return;
    setLoading(true);
    const res = await apiFetch("/users/me/onboarding", {
      method: "POST",
      body: JSON.stringify({ department, year, mode }),
    });
    if (res.ok) {
      const updated = await res.json();
      setUser(updated);
      router.push("/queue");
    } else {
      setLoading(false);
    }
  }

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
        <p className="text-sm text-muted-foreground">You can chat anonymously either way</p>
      </motion.div>

      <div className="grid w-full max-w-sm grid-cols-2 gap-3">
        <Select value={department} onValueChange={(v) => setDepartment(v as Department)}>
          <SelectTrigger className="h-14 w-full rounded-2xl border-none bg-card px-4 shadow-sm">
            <SelectValue placeholder="Department">
              {(value: Department | null) => (
                <span className="truncate text-sm font-semibold">{value ? DEPARTMENT_LABELS[value] : "Department"}</span>
              )}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {Object.entries(DEPARTMENT_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={year} onValueChange={(v) => setYear(v as Year)}>
          <SelectTrigger className="h-14 w-full rounded-2xl border-none bg-card px-4 shadow-sm">
            <SelectValue placeholder="Year">
              {(value: Year | null) => (
                <span className="text-sm font-semibold">{value ? YEAR_LABELS[value] : "Year"}</span>
              )}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {Object.entries(YEAR_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid w-full max-w-sm grid-cols-2 gap-3">
        {MODE_OPTIONS.map(({ mode: optionMode, title, description, icon: Icon, tone }, i) => {
          const selected = mode === optionMode;
          return (
            <motion.button
              key={optionMode}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.1 + i * 0.08 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setMode(optionMode)}
              className={cn(
                "relative flex aspect-[4/5] flex-col items-start justify-between rounded-3xl p-4 text-left transition-shadow",
                tone === "sage" ? "bg-sage-light" : "bg-coral-light",
                selected ? "shadow-[0_0_0_3px_var(--foreground)]" : "shadow-none",
              )}
            >
              {selected && (
                <span className="absolute top-3 right-3 flex h-5 w-5 items-center justify-center rounded-full bg-foreground">
                  <Check className="h-3 w-3 text-background" strokeWidth={3} />
                </span>
              )}
              <div
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-full",
                  tone === "sage" ? "bg-sage text-sage-foreground" : "bg-coral text-coral-foreground",
                )}
              >
                <Icon className="h-5 w-5" strokeWidth={1.75} />
              </div>
              <div>
                <p className="font-heading text-sm font-bold">{title}</p>
                <p className="mt-1 text-xs text-muted-foreground">{description}</p>
              </div>
            </motion.button>
          );
        })}
      </div>

      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={handleContinue}
        disabled={loading || !canContinue}
        className="flex h-14 w-full max-w-sm items-center justify-center gap-2 rounded-full bg-primary font-heading text-sm font-semibold tracking-wide text-primary-foreground uppercase disabled:opacity-40"
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
        Continue
      </motion.button>
    </div>
  );
}
