import { requireAuth } from "@/lib/server-auth";

import UserDetailsClient from "./user-details-client";

export default async function UserDetailsPage() {
  await requireAuth("moderator");
  return <UserDetailsClient />;
}
