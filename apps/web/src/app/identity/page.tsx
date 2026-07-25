"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Ghost, User as UserIcon } from "lucide-react";
import { DEPARTMENT_LABELS, YEAR_LABELS, type Department, type UserMode, type Year } from "@anontalk/shared";
import { cn } from "@/lib/utils";
import { apiFetch } from "@/lib/api";
import { useAuthStore } from "@/store/auth-store";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const MODE_OPTIONS: Array<{ mode: UserMode; title: string; description: string; icon: typeof Ghost }> = [
  {
    mode: "ANONYMOUS",
    title: "Anonymous",
    description: "Chat with a random generated identity. No personal info shown.",
    icon: Ghost,
  },
  {
    mode: "REAL",
    title: "Real Profile",
    description: "Chat using your name, department, and year.",
    icon: UserIcon,
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
    <div className="flex flex-1 flex-col items-center justify-center gap-6 px-6 py-10 text-center">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">Complete your profile</h1>
        <p className="text-sm text-muted-foreground">This is only asked once — you can chat anonymously either way</p>
      </div>

      <div className="grid w-full max-w-sm grid-cols-2 gap-3">
        <Select value={department} onValueChange={(v) => setDepartment(v as Department)}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Department">
              {(value: Department | null) => (value ? DEPARTMENT_LABELS[value] : "Department")}
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
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Year">{(value: Year | null) => (value ? YEAR_LABELS[value] : "Year")}</SelectValue>
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

      <div className="flex w-full max-w-sm flex-col gap-3">
        {MODE_OPTIONS.map(({ mode: optionMode, title, description, icon: Icon }) => (
          <button
            key={optionMode}
            onClick={() => setMode(optionMode)}
            className={cn(
              "flex items-center gap-4 rounded-xl border p-4 text-left transition-colors",
              mode === optionMode ? "border-primary bg-primary/10" : "border-border bg-card hover:bg-secondary",
            )}
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary">
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <p className="font-medium">{title}</p>
              <p className="text-xs text-muted-foreground">{description}</p>
            </div>
          </button>
        ))}
      </div>

      <button
        onClick={handleContinue}
        disabled={loading || !canContinue}
        className="flex h-11 w-full max-w-sm items-center justify-center gap-2 rounded-lg bg-primary text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
      >
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        Continue
      </button>
    </div>
  );
}
