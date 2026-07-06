"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import api from "@/lib/api";
import { useAuthStore } from "@/store/auth";

export default function LoginPage() {
  const router = useRouter();
  const setSession = useAuthStore((s) => s.setSession);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otpCode, setOtpCode] = useState("");

  const login = useMutation({
    mutationFn: async () => {
      const { data } = await api.post("/admin/auth/login", {
        email,
        password,
        otp_code: otpCode || null
      });
      setSession({
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        user: {
          ...data.user,
          role: data.user.role,
          status: data.user.status
        }
      });
      router.replace("/dashboard");
    }
  });

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    login.mutate();
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Admin Login</CardTitle>
          <CardDescription>Sign in to Football AI Predictor admin panel</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="otp">2FA code (if enabled)</Label>
              <Input id="otp" value={otpCode} onChange={(e) => setOtpCode(e.target.value)} />
            </div>
            <Button className="w-full" type="submit" disabled={login.isPending}>
              {login.isPending ? "Signing in..." : "Sign in"}
            </Button>
            {login.isError && <p className="text-sm text-destructive">Login failed. Check credentials.</p>}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
