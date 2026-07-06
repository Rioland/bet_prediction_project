import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { hasMinimumRole, ROUTE_MIN_ROLES } from "@/lib/roles";
import type { AdminRole, AdminUser } from "@/types/auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export async function getServerSession(): Promise<AdminUser | null> {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore
    .getAll()
    .map((c) => `${c.name}=${c.value}`)
    .join("; ");

  if (!cookieHeader.includes("admin_access_token")) {
    return null;
  }

  const response = await fetch(`${API_URL}/admin/auth/me`, {
    headers: { Cookie: cookieHeader },
    cache: "no-store"
  });

  if (!response.ok) {
    return null;
  }

  const data = (await response.json()) as AdminUser;
  return {
    ...data,
    role: data.role as AdminRole,
    status: data.status as AdminUser["status"]
  };
}

export async function requireAuth(minimumRole: AdminRole = "moderator"): Promise<AdminUser> {
  const user = await getServerSession();
  if (!user) {
    redirect("/login");
  }
  if (!hasMinimumRole(user.role, minimumRole)) {
    redirect("/dashboard?error=forbidden");
  }
  return user;
}

export async function requireRouteAuth(pathname: string): Promise<AdminUser> {
  const minimumRole = ROUTE_MIN_ROLES[pathname] ?? "admin";
  return requireAuth(minimumRole);
}
