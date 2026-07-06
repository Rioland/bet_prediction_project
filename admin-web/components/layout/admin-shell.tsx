"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { PropsWithChildren, useEffect } from "react";

import { Button } from "@/components/ui/button";
import { hasMinimumRole } from "@/lib/roles";
import api from "@/lib/api";
import { useAuthStore } from "@/store/auth";
import type { AdminRole, AdminUser } from "@/types/auth";

const links: { href: string; label: string; minRole: AdminRole }[] = [
  { href: "/dashboard", label: "Dashboard", minRole: "admin" },
  { href: "/users", label: "Users", minRole: "moderator" },
  { href: "/analytics", label: "Analytics", minRole: "admin" },
  { href: "/subscriptions", label: "Subscriptions", minRole: "admin" },
  { href: "/notifications", label: "Notifications", minRole: "admin" },
  { href: "/operations", label: "Operations", minRole: "admin" },
  { href: "/reports", label: "Reports", minRole: "moderator" },
  { href: "/settings", label: "Settings", minRole: "super_admin" }
];

type Props = PropsWithChildren<{
  initialUser: AdminUser;
}>;

export function AdminShell({ children, initialUser }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, setUser, logout } = useAuthStore();

  const currentUser = user ?? initialUser;

  useEffect(() => {
    if (!user) setUser(initialUser);
  }, [initialUser, setUser, user]);

  const handleLogout = async () => {
    try {
      await api.post("/admin/auth/logout");
    } finally {
      logout();
      router.replace("/login");
    }
  };

  const visibleLinks = links.filter((l) => hasMinimumRole(currentUser.role, l.minRole));

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto grid max-w-7xl grid-cols-[240px_1fr] gap-6 p-6">
        <aside className="rounded-lg border bg-card p-4 shadow-sm">
          <p className="mb-1 text-sm font-medium">Football AI Predictor</p>
          <p className="mb-4 text-xs text-muted-foreground">{currentUser.email}</p>
          <nav className="space-y-1">
            {visibleLinks.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={`block rounded-md px-3 py-2 text-sm transition-colors hover:bg-accent ${
                  pathname.startsWith(l.href) ? "bg-accent font-medium" : ""
                }`}
              >
                {l.label}
              </Link>
            ))}
          </nav>
          <Button variant="ghost" className="mt-6 w-full justify-start text-destructive" onClick={() => void handleLogout()}>
            Logout
          </Button>
        </aside>
        <main>{children}</main>
      </div>
    </div>
  );
}
