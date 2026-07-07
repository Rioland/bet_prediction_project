import { requireAuth } from "@/lib/server-auth";

import UsersClient from "./users-client";

export default async function UsersPage() {
  await requireAuth("moderator");
  return <UsersClient />;
}
