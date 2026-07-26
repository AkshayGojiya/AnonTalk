import { cn } from "@/lib/utils";

// Ratios lifted from the brand mark reference (150px circle: 12px bars, 11px
// gap, heights 38/74/52/90) scaled down to the 28px mark used in-app.
const BAR_HEIGHTS = [7, 14, 10, 17];

function SignalMark({ inverse }: { inverse: boolean }) {
  return (
    <span
      className={cn(
        "flex h-7 w-7 shrink-0 items-center justify-center gap-[2px] rounded-full",
        inverse ? "bg-orange" : "bg-cobalt",
      )}
    >
      {BAR_HEIGHTS.map((height, i) => (
        <span
          key={i}
          className={cn("w-[2px] rounded-full", !inverse && i === 2 ? "bg-orange" : "bg-white")}
          style={{ height }}
        />
      ))}
    </span>
  );
}

export function Logo({ tone = "cobalt", className }: { tone?: "cobalt" | "white"; className?: string }) {
  const inverse = tone === "white";
  return (
    <div className={cn("flex items-center gap-3", inverse && "text-white", className)}>
      <SignalMark inverse={inverse} />
      <span className="font-heading text-lg font-extrabold tracking-tight">
        {inverse ? (
          "AnonTalk"
        ) : (
          <>
            Anon<span className="text-cobalt">Talk</span>
          </>
        )}
      </span>
    </div>
  );
}
