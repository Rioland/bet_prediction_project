"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import api from "@/lib/api";

export default function ReportsClient() {
  const queryClient = useQueryClient();
  const { data, isLoading, isError } = useQuery({
    queryKey: ["admin-reports"],
    queryFn: async () => (await api.get("/admin/reports")).data
  });

  const resolve = useMutation({
    mutationFn: async (id: number) =>
      api.patch(`/admin/reports/${id}/resolve`, { moderation_notes: "Resolved by admin panel" }),
    onSuccess: async () => queryClient.invalidateQueries({ queryKey: ["admin-reports"] })
  });

  if (isLoading) return <p className="text-muted-foreground">Loading reports...</p>;
  if (isError) return <p className="text-destructive">Failed to load reports.</p>;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold tracking-tight">Reports</h1>
      {(data ?? []).map((r: { id: number; category: string; status: string; message: string }) => (
        <Card key={r.id}>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <p className="font-medium">{r.category}</p>
              <Badge variant={r.status === "open" ? "destructive" : "secondary"}>{r.status}</Badge>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">{r.message}</p>
            <Button className="mt-3" size="sm" onClick={() => resolve.mutate(r.id)}>
              Resolve
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
