import { AlertCircle } from "lucide-react";
import { API_URL } from "@/lib/api";

const ERROR_MESSAGES: Record<string, string> = {
  domain_not_allowed: "Only @bvmengineering.ac.in college accounts can sign in.",
  email_not_verified: "Your Google account's email isn't verified.",
};

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  const errorMessage = error ? (ERROR_MESSAGES[error] ?? "Something went wrong signing you in.") : null;

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-8 px-6 text-center">
      <div className="flex flex-col gap-2">
        <h1 className="text-4xl font-semibold tracking-tight">
          Anon<span className="text-primary">Talk</span>
        </h1>
        <p className="text-muted-foreground">Verified students. Real conversations.</p>
      </div>

      <div className="flex w-full max-w-sm flex-col gap-4 rounded-2xl border border-border bg-card p-6">
        {errorMessage && (
          <div className="flex items-start gap-2 rounded-lg bg-destructive/10 p-3 text-left text-sm text-destructive">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <a
          href={`${API_URL}/auth/google`}
          className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-primary text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
        >
          Continue with Google
        </a>

        <div className="flex flex-col gap-1.5 text-left text-xs text-muted-foreground">
          <p>· Verified college students only</p>
          <p>· Your identity is protected</p>
          <p>· No chats are stored</p>
        </div>
      </div>
    </div>
  );
}
