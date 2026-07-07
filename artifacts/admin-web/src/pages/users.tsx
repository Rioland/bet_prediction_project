import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import api from "@/lib/api";

type UserRow = {
  id: number;
  name: string;
  email: string;
  role: string;
  status: string;
  subscription_type: string;
};

export default function UsersPage() {
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("");
  const [status, setStatus] = useState("");
  const { data, isLoading, isError } = useQuery({
    queryKey: ["admin-users", search, role, status],
    queryFn: async () =>
      (
        await api.get("/admin/users", {
          params: { q: search || undefined, role: role || undefined, status: status || undefined }
        })
      ).data
  });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold tracking-tight">Users</h1>
      <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
        <Input
          placeholder="Search name/email"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <Input
          placeholder="Role filter"
          value={role}
          onChange={(e) => setRole(e.target.value)}
        />
        <Input
          placeholder="Status filter"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        />
      </div>
      {isLoading ? (
        <p className="text-muted-foreground">Loading users...</p>
      ) : isError ? (
        <p className="text-destructive">Failed to load users.</p>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Subscription</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(data?.items ?? []).map((u: UserRow) => (
                <TableRow key={u.id}>
                  <TableCell>
                    <Link
                      href={`/users/${u.id}`}
                      className="font-medium text-primary hover:underline"
                    >
                      {u.name}
                    </Link>
                  </TableCell>
                  <TableCell>{u.email}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{u.role}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={u.status === "active" ? "default" : "destructive"}>
                      {u.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{u.subscription_type}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
      <a
        className="text-sm text-primary underline"
        href={`${import.meta.env.VITE_API_URL ?? "http://localhost:8000"}/admin/users/export`}
      >
        Export CSV
      </a>
    </div>
  );
}
