"use client";

import { useState } from "react";
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { Check, Loader2, X } from "lucide-react";
import type { ReportReason } from "@anontalk/shared";
import { apiFetch } from "@/lib/api";
import { cn } from "@/lib/utils";

const REASONS: Array<{ value: ReportReason; label: string }> = [
  { value: "HARASSMENT", label: "Harassment or abuse" },
  { value: "NSFW", label: "Sexual content" },
  { value: "SPAM", label: "Spam or advertising" },
  { value: "THREATS", label: "Threats or violence" },
  { value: "HATE_SPEECH", label: "Hate speech" },
  { value: "OTHER", label: "Something else" },
];

interface ReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sessionId: string;
}

export function ReportDialog({ open, onOpenChange, sessionId }: ReportDialogProps) {
  const [reason, setReason] = useState<ReportReason>("HARASSMENT");
  const [details, setDetails] = useState("");
  const [alsoBlock, setAlsoBlock] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    setSubmitting(true);
    await apiFetch("/reports", {
      method: "POST",
      body: JSON.stringify({ sessionId, reason, details: details.trim() || undefined, alsoBlock }),
    });
    setSubmitting(false);
    onOpenChange(false);
  }

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Backdrop className="fixed inset-0 z-50 bg-foreground/50 data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0" />
        <DialogPrimitive.Popup
          className={cn(
            "fixed z-50 flex max-h-[85vh] flex-col gap-5 overflow-y-auto bg-card outline-none",
            "inset-x-0 bottom-0 rounded-t-3xl p-6 pb-8",
            "data-open:animate-in data-open:slide-in-from-bottom data-closed:animate-out data-closed:slide-out-to-bottom",
            "lg:inset-x-auto lg:inset-y-auto lg:top-1/2 lg:left-1/2 lg:w-[620px] lg:max-h-[85vh] lg:-translate-x-1/2 lg:-translate-y-1/2 lg:rounded-3xl lg:p-10",
            "lg:data-open:zoom-in-95 lg:data-closed:zoom-out-95 lg:data-open:slide-in-from-bottom-0 lg:data-closed:slide-out-to-bottom-0",
          )}
        >
          <span className="mx-auto h-1.5 w-11 rounded-full bg-border lg:hidden" />

          <div className="flex items-start justify-between gap-4">
            <div className="flex flex-col gap-1.5">
              <DialogPrimitive.Title className="font-heading text-2xl font-extrabold tracking-tight lg:text-3xl">
                Report this chat
              </DialogPrimitive.Title>
              <DialogPrimitive.Description className="text-sm leading-relaxed text-muted-foreground lg:max-w-sm">
                Reporting saves this conversation for moderators. Otherwise nothing is kept.
              </DialogPrimitive.Description>
            </div>
            <DialogPrimitive.Close className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary text-muted-foreground">
              <X className="h-3.5 w-3.5" strokeWidth={2.5} />
            </DialogPrimitive.Close>
          </div>

          <div className="grid grid-cols-1 gap-2 lg:grid-cols-2">
            {REASONS.map(({ value, label }) => {
              const selected = reason === value;
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => setReason(value)}
                  className={cn(
                    "flex items-center gap-3 rounded-2xl px-4 py-3.5 text-left transition-colors",
                    selected ? "bg-cobalt-light ring-2 ring-cobalt" : "bg-secondary",
                  )}
                >
                  <span
                    className={cn(
                      "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2",
                      selected ? "border-cobalt bg-cobalt" : "border-border",
                    )}
                  >
                    {selected && <Check className="h-3 w-3 text-cobalt-foreground" strokeWidth={3.5} />}
                  </span>
                  <span className={cn("text-sm font-medium", selected && "font-bold text-cobalt")}>{label}</span>
                </button>
              );
            })}
          </div>

          <textarea
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            placeholder="Add details (optional)"
            className="h-20 w-full rounded-lg border border-border bg-background px-4 py-3.5 text-base outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-ring"
          />

          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <button
              type="button"
              onClick={() => setAlsoBlock((v) => !v)}
              className="flex items-center gap-3 text-left"
            >
              <span
                className={cn(
                  "flex h-6 w-6 shrink-0 items-center justify-center rounded-md",
                  alsoBlock ? "bg-cobalt text-cobalt-foreground" : "border-2 border-border",
                )}
              >
                {alsoBlock && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
              </span>
              <span className="text-sm font-medium">Also block this user</span>
            </button>

            <div className="flex gap-3">
              <DialogPrimitive.Close className="hidden rounded-full border border-border px-7 py-3.5 text-sm font-bold text-muted-foreground lg:block">
                Cancel
              </DialogPrimitive.Close>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting}
                className="flex flex-1 items-center justify-center gap-2 rounded-full bg-orange px-6 py-3.5 text-sm font-bold text-orange-foreground disabled:opacity-60 lg:flex-none"
              >
                {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                Submit report
              </button>
            </div>
          </div>
        </DialogPrimitive.Popup>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
