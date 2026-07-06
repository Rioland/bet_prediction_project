import { requireAuth } from "@/lib/server-auth";

import DashboardClient from "./dashboard-client";

export default async function DashboardPage() {
  await requireAuth("admin");
  return <DashboardClient />;
}
