"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Loader2 } from "lucide-react";
import {
  DEPARTMENT_LABELS,
  YEAR_LABELS,
  type CurrentUserDto,
  type Department,
  type UserMode,
  type Year,
} from "@anontalk/shared";
import { apiFetch } from "@/lib/api";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ModePicker } from "@/components/mode-picker";

export function ProfileForm({
  initialUser,
  submitLabel,
  onSaved,
}: {
  initialUser: CurrentUserDto | null;
  submitLabel: string;
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
    <div className="flex w-full max-w-sm flex-col items-center gap-6">
      <div className="w-full text-left">
        <label htmlFor="displayName" className="mb-1.5 block text-xs font-semibold tracking-wide text-muted-foreground uppercase">
          Display name
        </label>
        <input
          id="displayName"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          maxLength={40}
          placeholder="What should we call you?"
          className="h-14 w-full rounded-2xl border-none bg-card px-4 text-sm font-semibold shadow-sm outline-none focus:ring-2 focus:ring-ring"
        />
        <p className="mt-1.5 text-xs text-muted-foreground">
          Shown to chat partners in both modes — pick something other than your real name if you plan to use Anonymous.
        </p>
      </div>

      <div className="grid w-full grid-cols-2 gap-3">
        <Select value={department} onValueChange={(v) => setDepartment(v as Department)}>
          <SelectTrigger className="h-14 w-full rounded-2xl border-none bg-card px-4 shadow-sm">
            <SelectValue placeholder="Department">
              {(value: Department | null) => (
                <span className="truncate text-sm font-semibold">{value ? DEPARTMENT_LABELS[value] : "Department"}</span>
              )}
            </SelectValue>
          </SelectTrigger>
          <SelectContent alignItemWithTrigger={false} align="start" className="w-56">
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
              {(value: Year | null) => <span className="text-sm font-semibold">{value ? YEAR_LABELS[value] : "Year"}</span>}
            </SelectValue>
          </SelectTrigger>
          <SelectContent alignItemWithTrigger={false} align="start" className="w-40">
            {Object.entries(YEAR_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <ModePicker value={mode} onChange={setMode} />

      {error && <p className="text-sm text-destructive">{error}</p>}

      <motion.button
        type="button"
        whileTap={{ scale: 0.97 }}
        onClick={handleSubmit}
        disabled={loading || !canSubmit}
        className="flex h-14 w-full items-center justify-center gap-2 rounded-full bg-primary font-heading text-sm font-semibold tracking-wide text-primary-foreground uppercase disabled:opacity-40"
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
        {submitLabel}
      </motion.button>
    </div>
  );
}
