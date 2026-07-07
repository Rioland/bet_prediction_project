import { PropsWithChildren } from "react";

import { AdminShell } from "@/components/layout/admin-shell";
import { requireAuth } from "@/lib/server-auth";

export default async function ProtectedLayout({ children }: PropsWithChildren) {
  const user = await requireAuth("moderator");
  return <AdminShell initialUser={user}>{children}</AdminShell>;
}
