import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import api from "@/lib/api";

export default function DashboardPage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["admin-dashboard"],
    queryFn: async () => (await api.get("/admin/analytics/dashboard")).data
  });

  if (isLoading) return <p className="text-muted-foreground">Loading dashboard...</p>;
  if (isError) return <p className="text-destructive">Failed to load dashboard.</p>;

  // A figure with no source shows a dash and its reason, rather than "$null"
  // or a plausible-looking number nobody can act on.
  const cards: [string, string | number, string?][] = [
    ["Total Users", data.total_users],
    ["Active Users", data.active_users],
    ["Premium Users", data.premium_users],
    ["Live Matches", data.live_matches],
    ["Predictions Today", data.predictions_today],
    ["Slips Today", data.slips_today ?? 0],
    [
      "Revenue this month",
      data.revenue === null || data.revenue === undefined
        ? "—"
        : new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN" }).format(data.revenue),
      data.revenue === null || data.revenue === undefined ? data.revenue_note : undefined,
    ],
    [
      "Monthly Growth",
      data.monthly_growth === null || data.monthly_growth === undefined
        ? "—"
        : `${data.monthly_growth}%`,
      data.monthly_growth === null || data.monthly_growth === undefined
        ? "Not enough signup history to compare periods."
        : undefined,
    ],
  ];

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {cards.map(([label, value, note]) => (
          <Card key={String(label)}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold tabular-nums">{value}</p>
              {note && (
                <p className="mt-1 text-[11px] leading-snug text-muted-foreground">{note}</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
