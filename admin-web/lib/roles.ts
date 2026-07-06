import type { AdminRole } from "@/types/auth";

export const ROLE_LEVEL: Record<AdminRole, number> = {
  user: 1,
  premium_user: 2,
  moderator: 3,
  admin: 4,
  super_admin: 5
};

export function hasMinimumRole(role: AdminRole, minimum: AdminRole): boolean {
  return ROLE_LEVEL[role] >= ROLE_LEVEL[minimum];
}

export const ROUTE_MIN_ROLES: Record<string, AdminRole> = {
  "/dashboard": "admin",
  "/users": "moderator",
  "/analytics": "admin",
  "/subscriptions": "admin",
  "/notifications": "admin",
  "/reports": "moderator",
  "/settings": "super_admin"
};
