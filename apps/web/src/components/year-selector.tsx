"use client";

import { YEAR_LABELS, type Year } from "@anontalk/shared";
import { cn } from "@/lib/utils";

const YEARS = Object.keys(YEAR_LABELS) as Year[];

export function YearSelector({ value, onChange }: { value: Year | ""; onChange: (year: Year) => void }) {
  return (
    <div className="grid grid-cols-4 gap-2">
      {YEARS.map((year) => {
        const selected = value === year;
        return (
          <button
            key={year}
            type="button"
            onClick={() => onChange(year)}
            className={cn(
              "rounded-full py-3 text-center text-xs font-semibold transition-colors sm:text-sm",
              selected
                ? "bg-cobalt text-cobalt-foreground"
                : "border border-border text-muted-foreground hover:border-cobalt/40",
            )}
          >
            {YEAR_LABELS[year]}
          </button>
        );
      })}
    </div>
  );
}
