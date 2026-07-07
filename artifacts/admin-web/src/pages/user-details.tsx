import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams } from "wouter";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import api from "@/lib/api";

export default function UserDetailsPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const queryClient = useQueryClient();
  const { data, isLoading, isError } = useQuery({
    queryKey: ["admin-user", id],
    queryFn: async () => (await api.get(`/admin/users/${id}`)).data
  });

  const action = useMutation({
    mutationFn: async (type: "suspend" | "ban" | "grant-premium" | "revoke-premium") =>
      api.post(`/admin/users/${id}/${type}`, { reason: "Admin action" }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin-user", id] });
    }
  });

  if (isLoading) return <p className="text-muted-foreground">Loading user details...</p>;
  if (isError) return <p className="text-destructive">Failed to load user.</p>;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold tracking-tight">User Details</h1>
      <Card>
        <CardHeader>
          <CardTitle>{data.user.name}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1 text-sm">
          <p>Email: {data.user.email}</p>
          <p>Role: {data.user.role}</p>
          <p>Status: {data.user.status}</p>
        </CardContent>
      </Card>
      <div className="flex flex-wrap gap-2">
        <Button variant="secondary" onClick={() => action.mutate("suspend")}>
          Suspend
        </Button>
        <Button variant="destructive" onClick={() => action.mutate("ban")}>
          Ban
        </Button>
        <Button onClick={() => action.mutate("grant-premium")}>Grant Premium</Button>
        <Button variant="outline" onClick={() => action.mutate("revoke-premium")}>
          Revoke Premium
        </Button>
      </div>
    </div>
  );
}
