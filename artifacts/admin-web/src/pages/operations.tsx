import { useMutation } from "@tanstack/react-query";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import api from "@/lib/api";

type ActionResult = { label: string; data: unknown } | null;

function ActionCard({
  title,
  description,
  buttonLabel,
  endpoint
}: {
  title: string;
  description: string;
  buttonLabel: string;
  endpoint: string;
}) {
  const [result, setResult] = useState<ActionResult>(null);
  const mutation = useMutation({
    mutationFn: async () => (await api.post(endpoint)).data,
    onSuccess: (data) => setResult({ label: "Success", data }),
    onError: (error: unknown) => setResult({ label: "Error", data: String(error) })
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">{description}</p>
        <Button onClick={() => mutation.mutate()} disabled={mutation.isPending}>
          {mutation.isPending ? "Running..." : buttonLabel}
        </Button>
        {result ? (
          <pre className="overflow-x-auto rounded-md bg-muted p-3 text-xs">
            {result.label}: {JSON.stringify(result.data, null, 2)}
          </pre>
        ) : null}
      </CardContent>
    </Card>
  );
}

export default function OperationsPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold tracking-tight">Operations</h1>
      <p className="text-sm text-muted-foreground">
        Trigger data synchronization, prediction generation, and model retraining.
      </p>
      <div className="grid gap-4 md:grid-cols-2">
        <ActionCard
          title="Sync Live Matches"
          description="Pull live scores from API-Football and regenerate predictions."
          buttonLabel="Sync Live"
          endpoint="/admin/sync/live"
        />
        <ActionCard
          title="Sync Today's Fixtures"
          description="Import today's fixtures and league standings, then generate predictions."
          buttonLabel="Sync Fixtures"
          endpoint="/admin/sync/fixtures"
        />
        <ActionCard
          title="Generate Predictions"
          description="Regenerate AI predictions for all upcoming and live matches."
          buttonLabel="Generate"
          endpoint="/admin/predictions/generate"
        />
        <ActionCard
          title="Retrain ML Models"
          description="Retrain match-winner, over/under, BTTS, and correct-score models."
          buttonLabel="Retrain Models"
          endpoint="/admin/ml/retrain"
        />
      </div>
    </div>
  );
}
