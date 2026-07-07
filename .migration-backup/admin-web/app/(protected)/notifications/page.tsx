import { requireAuth } from "@/lib/server-auth";

import NotificationsClient from "./notifications-client";

export default async function NotificationsPage() {
  await requireAuth("admin");
  return <NotificationsClient />;
}
