import { requireAuth } from "@/lib/server-auth";

import AnalyticsClient from "./analytics-client";

export default async function AnalyticsPage() {
  await requireAuth("admin");
  return <AnalyticsClient />;
}
