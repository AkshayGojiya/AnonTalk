import type { PeerIdentity } from "@anontalk/shared";
import { cn } from "@/lib/utils";

export function PeerBadge({ peer, className }: { peer: PeerIdentity; className?: string }) {
  if (peer.mode === "ANONYMOUS") {
    const [from, to] = peer.identity.gradient;
    return (
      <div className={cn("flex items-center gap-3", className)}>
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-lg"
          style={{ backgroundImage: `linear-gradient(135deg, ${from}, ${to})` }}
        >
          {peer.identity.emoji}
        </div>
        <div>
          <p className="font-medium leading-tight">{peer.identity.nickname}</p>
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
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary text-sm font-medium">
        {initials}
      </div>
      <div>
        <p className="font-medium leading-tight">{peer.identity.displayName}</p>
        <p className="text-xs text-muted-foreground">
          {[peer.identity.department, peer.identity.collegeName].filter(Boolean).join(" · ")}
        </p>
      </div>
    </div>
  );
}
