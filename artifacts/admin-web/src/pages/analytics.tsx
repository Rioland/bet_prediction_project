import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import api from "@/lib/api";

export default function AnalyticsPage() {
  const users = useQuery({
    queryKey: ["analytics-users"],
    queryFn: async () => (await api.get("/admin/analytics/users")).data
  });
  const revenue = useQuery({
    queryKey: ["analytics-revenue"],
    queryFn: async () => (await api.get("/admin/analytics/revenue")).data
  });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold tracking-tight">Analytics</h1>
      <Card>
        <CardHeader>
          <CardTitle>User Growth</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="overflow-auto text-xs text-muted-foreground">
            {JSON.stringify(users.data?.series ?? [], null, 2)}
          </pre>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Revenue Analytics</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="overflow-auto text-xs text-muted-foreground">
            {JSON.stringify(revenue.data?.series ?? [], null, 2)}
          </pre>
        </CardContent>
      </Card>
    </div>
  );
}
