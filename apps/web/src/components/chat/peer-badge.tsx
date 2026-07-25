import type { PeerIdentity } from "@anontalk/shared";
import { cn } from "@/lib/utils";

export function PeerBadge({ peer, className }: { peer: PeerIdentity; className?: string }) {
  if (peer.mode === "ANONYMOUS") {
    const [from, to] = peer.identity.gradient;
    return (
      <div className={cn("flex items-center gap-3", className)}>
        <div
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-lg shadow-sm"
          style={{ backgroundImage: `linear-gradient(135deg, ${from}, ${to})` }}
        >
          {peer.identity.emoji}
        </div>
        <div>
          <p className="font-heading text-sm font-bold leading-tight">{peer.identity.nickname}</p>
          <p className="text-xs text-muted-foreground">Anonymous</p>
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
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-coral text-sm font-bold text-coral-foreground shadow-sm">
        {initials}
      </div>
      <div>
        <p className="font-heading text-sm font-bold leading-tight">{peer.identity.displayName}</p>
        <p className="text-xs text-muted-foreground">
          {peer.identity.department} · {peer.identity.year}
        </p>
      </div>
    </div>
  );
}
