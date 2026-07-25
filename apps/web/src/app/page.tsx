"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/auth-store";

export default function Home() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);

  function handleStartChat() {
    if (!user) {
      router.push("/login");
    } else if (user.department) {
      router.push("/queue");
    } else {
      router.push("/identity");
    }
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 bg-background px-6 text-center text-foreground">
      <div className="flex flex-col gap-2">
        <h1 className="text-4xl font-semibold tracking-tight">
          Anon<span className="text-primary">Talk</span>
        </h1>
        <p className="text-muted-foreground">Verified students. Real conversations.</p>
      </div>
      <Button onClick={handleStartChat}>Start Chat</Button>
    </div>
  );
}
