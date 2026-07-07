import { useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Route, Switch, Router as WouterRouter, Redirect, useLocation } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AdminShell } from "@/components/layout/admin-shell";
import { useAuthStore } from "@/store/auth";
import { hasMinimumRole, ROUTE_MIN_ROLES } from "@/lib/roles";
import type { AdminRole } from "@/types/auth";
import NotFound from "@/pages/not-found";

import LoginPage from "@/pages/login";
import DashboardPage from "@/pages/dashboard";
import AnalyticsPage from "@/pages/analytics";
import NotificationsPage from "@/pages/notifications";
import OperationsPage from "@/pages/operations";
import ReportsPage from "@/pages/reports";
import SettingsPage from "@/pages/settings";
import SubscriptionsPage from "@/pages/subscriptions";
import UsersPage from "@/pages/users";
import UserDetailsPage from "@/pages/user-details";

const queryClient = new QueryClient();

function ProtectedRoute({
  component: Component,
  path
}: {
  component: React.ComponentType;
  path: string;
}) {
  const user = useAuthStore((s) => s.user);
  const isHydrated = useAuthStore((s) => s.isHydrated);
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isHydrated) return; // wait for localStorage to be read
    if (!user) {
      setLocation("/login");
      return;
    }
    // Enforce per-route minimum role
    const minRole = ROUTE_MIN_ROLES[path] as AdminRole | undefined;
    if (minRole && !hasMinimumRole(user.role, minRole)) {
      setLocation("/dashboard"); // redirect unauthorized users to dashboard
    }
  }, [isHydrated, user, setLocation, path]);

  if (!isHydrated) return null; // wait for hydration before rendering
  if (!user) return null;

  // Block rendering if user lacks the required role
  const minRole = ROUTE_MIN_ROLES[path] as AdminRole | undefined;
  if (minRole && !hasMinimumRole(user.role, minRole)) return null;

  return (
    <AdminShell>
      <Component />
    </AdminShell>
  );
}

function AppRoutes() {
  const { hydrate, isHydrated } = useAuthStore();

  useEffect(() => {
    if (!isHydrated) hydrate();
  }, [hydrate, isHydrated]);

  return (
    <Switch>
      <Route path="/login" component={LoginPage} />
      <Route path="/">
        <Redirect to="/dashboard" />
      </Route>
      <Route path="/dashboard">
        <ProtectedRoute path="/dashboard" component={DashboardPage} />
      </Route>
      <Route path="/analytics">
        <ProtectedRoute path="/analytics" component={AnalyticsPage} />
      </Route>
      <Route path="/notifications">
        <ProtectedRoute path="/notifications" component={NotificationsPage} />
      </Route>
      <Route path="/operations">
        <ProtectedRoute path="/operations" component={OperationsPage} />
      </Route>
      <Route path="/reports">
        <ProtectedRoute path="/reports" component={ReportsPage} />
      </Route>
      <Route path="/settings">
        <ProtectedRoute path="/settings" component={SettingsPage} />
      </Route>
      <Route path="/subscriptions">
        <ProtectedRoute path="/subscriptions" component={SubscriptionsPage} />
      </Route>
      <Route path="/users">
        <ProtectedRoute path="/users" component={UsersPage} />
      </Route>
      <Route path="/users/:id">
        <ProtectedRoute path="/users" component={UserDetailsPage} />
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <AppRoutes />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
