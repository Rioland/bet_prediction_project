import { requireAuth } from "@/lib/server-auth";

import SettingsClient from "./settings-client";

export default async function SettingsPage() {
  await requireAuth("super_admin");
  return <SettingsClient />;
}
