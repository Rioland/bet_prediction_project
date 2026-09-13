import { useState, type FormEvent } from "react";
import { Link, useLocation } from "wouter";
import { Layout } from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/api";
import { useAccount } from "@/hooks/use-account";

function AuthForm({ mode }: { mode: "login" | "register" }) {
  const [, navigate] = useLocation();
  const { signIn } = useAccount();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const isRegister = mode === "register";

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const result = isRegister
        ? await api.register({ name, email, password })
        : await api.login({ email, password });
      signIn(result.access_token);
      navigate("/account");
    } catch (err) {
      setError((err as Error).message || "Something went wrong. Try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Layout>
      <div className="mx-auto max-w-sm py-8">
        <Card className="border-border/40 bg-card/50 p-6">
          <h1 className="mb-1 text-xl font-bold">
            {isRegister ? "Create an account" : "Sign in"}
          </h1>
          <p className="mb-6 text-sm text-muted-foreground">
            {isRegister
              ? "Subscribe to see the booking codes behind each day's slips."
              : "Welcome back."}
          </p>

          <form onSubmit={submit} className="space-y-4">
            {isRegister && (
              <div className="space-y-1.5">
                <Label htmlFor="name">Name</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)}
                       autoComplete="name" required />
              </div>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                     autoComplete="email" required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" value={password}
                     onChange={(e) => setPassword(e.target.value)}
                     autoComplete={isRegister ? "new-password" : "current-password"}
                     minLength={isRegister ? 8 : undefined} required />
              {isRegister && (
                <p className="text-[11px] text-muted-foreground">At least 8 characters.</p>
              )}
            </div>

            {error && (
              <p role="alert" className="rounded-sm border border-destructive/40 bg-destructive/10 p-2 text-xs text-destructive">
                {error}
              </p>
            )}

            <Button type="submit" className="w-full" disabled={busy}>
              {busy ? "Please wait…" : isRegister ? "Create account" : "Sign in"}
            </Button>
          </form>

          <p className="mt-5 text-center text-xs text-muted-foreground">
            {isRegister ? "Already have an account? " : "New here? "}
            <Link href={isRegister ? "/login" : "/register"} className="text-primary underline underline-offset-4">
              {isRegister ? "Sign in" : "Create an account"}
            </Link>
          </p>
        </Card>
      </div>
    </Layout>
  );
}

export const LoginPage = () => <AuthForm mode="login" />;
export const RegisterPage = () => <AuthForm mode="register" />;
