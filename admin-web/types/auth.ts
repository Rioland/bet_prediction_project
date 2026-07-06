export type AdminRole = "user" | "premium_user" | "moderator" | "admin" | "super_admin";

export type AdminUser = {
  id: number;
  name: string;
  email: string;
  role: AdminRole;
  status: "active" | "suspended" | "banned";
};
