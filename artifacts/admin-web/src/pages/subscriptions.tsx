import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import api from "@/lib/api";

export default function SubscriptionsPage() {
  const queryClient = useQueryClient();
  const { data, isLoading, isError } = useQuery({
    queryKey: ["admin-subscriptions"],
    queryFn: async () => (await api.get("/admin/subscriptions")).data
  });
  const cancel = useMutation({
    mutationFn: async (id: number) => api.post(`/admin/subscriptions/${id}/cancel`),
    onSuccess: async () => queryClient.invalidateQueries({ queryKey: ["admin-subscriptions"] })
  });

  if (isLoading) return <p className="text-muted-foreground">Loading subscriptions...</p>;
  if (isError) return <p className="text-destructive">Failed to load subscriptions.</p>;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold tracking-tight">Subscriptions</h1>
      <div className="space-y-2">
        {(data ?? []).map(
          (s: { id: number; user_id: number; provider: string; status: string }) => (
            <Card key={s.id}>
              <CardContent className="flex items-center justify-between p-4">
                <div>
                  <p className="font-medium">User #{s.user_id}</p>
                  <p className="text-sm text-muted-foreground">
                    {s.provider} - {s.status}
                  </p>
                </div>
                <Button variant="outline" onClick={() => cancel.mutate(s.id)}>
                  Cancel
                </Button>
              </CardContent>
            </Card>
          )
        )}
      </div>
    </div>
  );
}
