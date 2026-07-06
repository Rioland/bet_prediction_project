import { requireAuth } from "@/lib/server-auth";

import OperationsClient from "./operations-client";

export default async function OperationsPage() {
  await requireAuth("admin");
  return <OperationsClient />;
}
