import { requireAuth } from "@/lib/server-auth";

import ReportsClient from "./reports-client";

export default async function ReportsPage() {
  await requireAuth("moderator");
  return <ReportsClient />;
}
