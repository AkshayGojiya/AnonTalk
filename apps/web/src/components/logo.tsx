import { cn } from "@/lib/utils";

export function Logo({ tone = "cobalt", className }: { tone?: "cobalt" | "white"; className?: string }) {
  return (
    <div className={cn("flex items-center gap-3", tone === "white" && "text-white", className)}>
      <span className={cn("h-7 w-7 rounded-full", tone === "cobalt" ? "bg-cobalt" : "bg-white")} />
      <span className="font-heading text-lg font-extrabold tracking-tight">AnonTalk</span>
    </div>
  );
}
