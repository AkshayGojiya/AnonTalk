"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import type { ReportReason } from "@anontalk/shared";
import { apiFetch } from "@/lib/api";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";

const REASONS: Array<{ value: ReportReason; label: string }> = [
  { value: "SPAM", label: "Spam or sends links" },
  { value: "HARASSMENT", label: "Harassment or abuse" },
  { value: "HATE_SPEECH", label: "Hate speech" },
  { value: "THREATS", label: "Threats or violence" },
  { value: "NSFW", label: "Inappropriate content" },
  { value: "OTHER", label: "Other" },
];

interface ReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sessionId: string;
}

export function ReportDialog({ open, onOpenChange, sessionId }: ReportDialogProps) {
  const [reason, setReason] = useState<ReportReason>("SPAM");
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-heading text-lg">Report user</DialogTitle>
          <DialogDescription>Help us keep AnonTalk safe. This ends the current chat.</DialogDescription>
        </DialogHeader>

        <RadioGroup value={reason} onValueChange={(v) => setReason(v as ReportReason)} className="gap-3">
          {REASONS.map(({ value, label }) => (
            <div key={value} className="flex items-center gap-2">
              <RadioGroupItem value={value} id={`reason-${value}`} />
              <Label htmlFor={`reason-${value}`} className="font-normal">
                {label}
              </Label>
            </div>
          ))}
        </RadioGroup>

        <Textarea
          value={details}
          onChange={(e) => setDetails(e.target.value)}
          placeholder="Additional details (optional)"
          className="min-h-20"
        />

        <div className="flex items-center gap-2">
          <Checkbox checked={alsoBlock} onCheckedChange={(c) => setAlsoBlock(c === true)} id="also-block" />
          <Label htmlFor="also-block" className="font-normal">
            Also block this user
          </Label>
        </div>

        <DialogFooter>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="flex h-11 items-center justify-center gap-2 rounded-full bg-destructive px-5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            Submit Report
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
