import { Ghost } from "lucide-react";
import type { PeerIdentity } from "@anontalk/shared";
import { cn } from "@/lib/utils";

export function PeerBadge({ peer, className }: { peer: PeerIdentity; className?: string }) {
  if (peer.mode === "ANONYMOUS") {
    return (
      <div className={cn("flex items-center gap-3", className)}>
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-foreground text-background lg:h-12 lg:w-12">
          <Ghost className="h-5 w-5" strokeWidth={1.75} />
        </div>
        <div className="flex flex-col gap-1">
          <p className="font-heading text-base font-extrabold leading-none">{peer.identity.displayName}</p>
          <span className="inline-flex w-fit items-center rounded-full bg-secondary px-2.5 py-0.5 text-xs font-semibold text-muted-foreground">
            Anonymous
          </span>
        </div>
      </div>
    );
  }

  const initials = peer.identity.displayName
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-foreground text-sm font-bold text-background lg:h-12 lg:w-12">
        {initials}
      </div>
      <div className="flex flex-col gap-0.5">
        <p className="font-heading text-base font-extrabold leading-none">{peer.identity.displayName}</p>
        <p className="text-xs font-semibold text-muted-foreground">
          {peer.identity.department} · {peer.identity.year}
        </p>
      </div>
    </div>
  );
}
