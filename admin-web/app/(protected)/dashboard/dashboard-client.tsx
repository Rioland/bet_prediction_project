"use client";

import { useQuery } from "@tanstack/react-query";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import api from "@/lib/api";

export default function DashboardClient() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["admin-dashboard"],
    queryFn: async () => (await api.get("/admin/analytics/dashboard")).data
  });

  if (isLoading) return <p className="text-muted-foreground">Loading dashboard...</p>;
  if (isError) return <p className="text-destructive">Failed to load dashboard.</p>;

  const cards = [
    ["Total Users", data.total_users],
    ["Active Users", data.active_users],
    ["Premium Users", data.premium_users],
    ["Live Matches", data.live_matches],
    ["Predictions Today", data.predictions_today],
    ["Revenue", `$${data.revenue}`],
    ["Monthly Growth", `${data.monthly_growth}%`]
  ];

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {cards.map(([label, value]) => (
          <Card key={String(label)}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
