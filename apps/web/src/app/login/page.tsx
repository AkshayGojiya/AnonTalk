import { LoginCard } from "@/components/login-card";

const ERROR_MESSAGES: Record<string, string> = {
  domain_not_allowed: "Only @bvmengineering.ac.in college accounts can sign in.",
  email_not_verified: "Your Google account's email isn't verified.",
};

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  const errorMessage = error ? (ERROR_MESSAGES[error] ?? "Something went wrong signing you in.") : null;

  return <LoginCard errorMessage={errorMessage} />;
}
