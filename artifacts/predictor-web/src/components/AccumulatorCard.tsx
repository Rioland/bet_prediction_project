import { Card } from "./ui/card";
import { Layers, TriangleAlert } from "lucide-react";
import { pct, type Accumulator } from "@/lib/api";

/**
 * Accumulators multiply risk as fast as they multiply returns, so the combined
 * probability is shown as prominently as the price.
 */
export function AccumulatorCard({ accumulator }: { accumulator: Accumulator }) {
  if (!accumulator.legs.length) return null;

  return (
    <Card className="border-border/40 bg-card/50 p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-muted-foreground">
          <Layers className="h-4 w-4 text-primary" />
          {accumulator.legs.length}-leg accumulator
        </h3>
        <span className="font-mono text-lg font-bold tabular-nums text-primary">
          {accumulator.total_odds.toFixed(2)}
        </span>
      </div>

      <ul className="mb-3 divide-y divide-border/30">
        {accumulator.legs.map((leg) => (
          <li key={leg.fixture_id} className="flex items-center justify-between gap-3 py-2">
            <div className="min-w-0">
              <p className="truncate text-xs font-semibold">
                {leg.home_team} v {leg.away_team}
              </p>
              <p className="font-mono text-[11px] text-muted-foreground">{leg.label}</p>
            </div>
            <div className="shrink-0 text-right">
              <p className="font-mono text-xs font-bold tabular-nums">{leg.odds.toFixed(2)}</p>
              <p className="font-mono text-[10px] text-muted-foreground">{pct(leg.probability)}</p>
            </div>
          </li>
        ))}
      </ul>

      <div className="flex items-start gap-2 rounded-sm border border-amber-500/20 bg-amber-500/5 p-2">
        <TriangleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-400" />
        <p className="text-[11px] leading-relaxed text-muted-foreground">
          All {accumulator.legs.length} legs must land. Combined chance of a return is{" "}
          <span className="font-mono font-bold text-amber-400">
            {pct(accumulator.combined_probability)}
          </span>
          , not the chance of any single leg.
        </p>
      </div>
    </Card>
  );
}
