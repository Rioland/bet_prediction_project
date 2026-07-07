import { create } from "zustand";

import type { AdminRole, AdminUser } from "@/types/auth";

type AuthState = {
  accessToken: string | null;
  refreshToken: string | null;
  user: AdminUser | null;
  isHydrated: boolean;
  setSession: (payload: { accessToken: string; refreshToken: string; user: AdminUser }) => void;
  setUser: (user: AdminUser | null) => void;
  hydrate: () => void;
  logout: () => void;
  hasRole: (minimumRole: AdminRole) => boolean;
};

const level: Record<AdminRole, number> = {
  user: 1,
  premium_user: 2,
  moderator: 3,
  admin: 4,
  super_admin: 5
};

export const useAuthStore = create<AuthState>((set, get) => ({
  accessToken: null,
  refreshToken: null,
  user: null,
  isHydrated: false,
  setSession: ({ accessToken, refreshToken, user }) => {
    localStorage.setItem("admin_access_token_hint", accessToken);
    localStorage.setItem("admin_refresh_token_hint", refreshToken);
    localStorage.setItem("admin_user", JSON.stringify(user));
    set({ accessToken, refreshToken, user });
  },
  setUser: (user) => set((state) => ({ ...state, user })),
  hydrate: () => {
    const accessToken = localStorage.getItem("admin_access_token_hint");
    const refreshToken = localStorage.getItem("admin_refresh_token_hint");
    const rawUser = localStorage.getItem("admin_user");
    const user = rawUser ? (JSON.parse(rawUser) as AdminUser) : null;
    set({ accessToken, refreshToken, user, isHydrated: true });
  },
  logout: () => {
    localStorage.removeItem("admin_access_token_hint");
    localStorage.removeItem("admin_refresh_token_hint");
    localStorage.removeItem("admin_user");
    set({ accessToken: null, refreshToken: null, user: null });
  },
  hasRole: (minimumRole) => {
    const role = get().user?.role;
    if (!role) return false;
    return level[role] >= level[minimumRole];
  }
}));
