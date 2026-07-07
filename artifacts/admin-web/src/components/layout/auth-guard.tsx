import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuthStore } from "@/store/auth";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const [, setLocation] = useLocation();
  const { user, hydrate } = useAuthStore();

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (user === null && !localStorage.getItem("admin_user")) {
      setLocation("/login");
    }
  }, [user, setLocation]);

  const storedUser = localStorage.getItem("admin_user");
  if (!user && !storedUser) return null;

  return <>{children}</>;
}
