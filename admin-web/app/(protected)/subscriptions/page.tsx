import { requireAuth } from "@/lib/server-auth";

import SubscriptionsClient from "./subscriptions-client";

export default async function SubscriptionsPage() {
  await requireAuth("admin");
  return <SubscriptionsClient />;
}
