"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Loader2 } from "lucide-react";
import {
  DEPARTMENT_LABELS,
  type CurrentUserDto,
  type Department,
  type UserMode,
  type Year,
} from "@anontalk/shared";
import { apiFetch } from "@/lib/api";
import { cn } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ModePicker } from "@/components/mode-picker";
import { YearSelector } from "@/components/year-selector";

export function ProfileForm({
  initialUser,
  submitLabel,
  submitTone = "cobalt",
  onSaved,
}: {
  initialUser: CurrentUserDto | null;
  submitLabel: string;
  submitTone?: "cobalt" | "primary";
  onSaved: (user: CurrentUserDto) => void;
}) {
  const [displayName, setDisplayName] = useState(initialUser?.displayName ?? "");
  const [department, setDepartment] = useState<Department | "">(initialUser?.department ?? "");
  const [year, setYear] = useState<Year | "">(initialUser?.year ?? "");
  const [mode, setMode] = useState<UserMode>(initialUser?.defaultMode ?? "ANONYMOUS");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = displayName.trim().length > 0 && department !== "" && year !== "";

  async function handleSubmit() {
    if (!canSubmit) return;
    setLoading(true);
    setError(null);
    const res = await apiFetch("/users/me/profile", {
      method: "POST",
      body: JSON.stringify({ displayName: displayName.trim(), department, year, mode }),
    });
    if (res.ok) {
      const updated = await res.json();
      onSaved(updated);
    } else {
      setError("Something went wrong. Please try again.");
    }
    setLoading(false);
  }

  return (
    <div className="flex w-full flex-col gap-6">
      <div className="grid gap-6 sm:grid-cols-2 sm:gap-8">
        <div className="text-left">
          <label htmlFor="displayName" className="mb-2 block text-sm font-bold text-muted-foreground">
            Display name
          </label>
          <input
            id="displayName"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            maxLength={40}
            placeholder="What should we call you?"
            className="h-14 w-full rounded-lg border-2 border-foreground bg-background px-4 text-base font-medium outline-none"
          />
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Shown to chat partners in both modes — pick something other than your real name if you plan to stay
            anonymous.
          </p>
        </div>

        <div className="flex flex-col gap-5 text-left">
          <div>
            <label className="mb-2 block text-sm font-bold text-muted-foreground">Department</label>
            <Select value={department} onValueChange={(v) => setDepartment(v as Department)}>
              <SelectTrigger className="h-14 w-full rounded-lg border border-border bg-background px-4">
                <SelectValue placeholder="Department">
                  {(value: Department | null) => (
                    <span className="truncate text-base font-medium">
                      {value ? DEPARTMENT_LABELS[value] : "Department"}
                    </span>
                  )}
                </SelectValue>
              </SelectTrigger>
              <SelectContent alignItemWithTrigger={false} align="start" className="w-64">
                {Object.entries(DEPARTMENT_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-bold text-muted-foreground">Year</label>
            <YearSelector value={year} onChange={setYear} />
          </div>
        </div>
      </div>

      <div className="text-left">
        <label className="mb-2 block text-sm font-bold text-muted-foreground">How you appear</label>
        <ModePicker value={mode} onChange={setMode} />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <motion.button
        type="button"
        whileTap={{ scale: 0.97 }}
        onClick={handleSubmit}
        disabled={loading || !canSubmit}
        className={cn(
          "flex h-14 w-full items-center justify-center gap-2 rounded-full font-heading text-base font-extrabold transition-opacity hover:opacity-90 disabled:opacity-40 sm:w-auto sm:self-end sm:px-14",
          submitTone === "cobalt" ? "bg-cobalt text-cobalt-foreground" : "bg-primary text-primary-foreground",
        )}
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
        {submitLabel}
      </motion.button>
    </div>
  );
}
