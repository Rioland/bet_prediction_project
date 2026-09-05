import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { Check, X } from "lucide-react";
import { Layout } from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { api, pct, signed, type Performance } from "@/lib/api";
import { cn } from "@/lib/utils";

const WINDOWS = [7, 30, 90] as const;

function Stat({
  label,
  value,
  tone,
  hint,
}: {
  label: string;
  value: string;
  tone?: "good" | "bad";
  hint?: string;
}) {
  return (
    <Card className="border-border/40 bg-card/50 p-4">
      <p className="mb-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p
        className={cn(
          "font-mono text-2xl font-bold tabular-nums",
          tone === "good" && "text-emerald-400",
          tone === "bad" && "text-rose-400",
        )}
      >
        {value}
      </p>
      {hint && <p className="mt-1 text-[11px] text-muted-foreground">{hint}</p>}
    </Card>
  );
}

function roiTone(performance: Performance) {
  if (performance.roi_percent === null) return undefined;
  return performance.roi_percent >= 0 ? ("good" as const) : ("bad" as const);
}

export default function Results() {
  const [days, setDays] = useState<number>(30);

  const { data, isLoading } = useQuery({
    queryKey: ["performance", days],
    queryFn: () => api.performance(days),
  });
  const { data: recent } = useQuery({
    queryKey: ["recent-results"],
    queryFn: () => api.recentResults(30),
  });

  const overall = data?.overall;

  return (
    <Layout>
      <section className="mb-6">
        <h1 className="mb-2 text-3xl font-bold uppercase tracking-tight">Verified results</h1>
        <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
          Every pick below was recorded before kickoff and scored against the final
          result. Nothing here is selected after the fact — the API refuses to publish a
          tip once a match has started.
        </p>
      </section>

      <div className="mb-6 flex gap-2">
        {WINDOWS.map((window) => (
          <button
            key={window}
            onClick={() => setDays(window)}
            className={cn(
              "rounded-sm border px-3 py-1.5 font-mono text-xs uppercase tracking-wider transition-colors",
              days === window
                ? "border-primary/60 bg-primary/10 text-primary"
                : "border-border/50 bg-card/40 text-muted-foreground hover:text-foreground",
            )}
          >
            {window} days
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-lg" />
          ))}
        </div>
      ) : !overall || overall.settled === 0 ? (
        <Card className="border-dashed border-border/50 bg-card/20 p-10 text-center">
          <h3 className="mb-1 font-bold">No settled picks yet</h3>
          <p className="font-mono text-xs text-muted-foreground">
            {overall?.note ?? "Results appear here once published tips have been played out."}
          </p>
        </Card>
      ) : (
        <>
          <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
            <Stat
              label="Return on investment"
              value={overall.roi_percent === null ? "—" : `${signed(overall.roi_percent)}%`}
              tone={roiTone(overall)}
              hint="Flat stakes. The number that actually matters."
            />
            <Stat
              label="Strike rate"
              value={overall.strike_rate === null ? "—" : `${overall.strike_rate}%`}
              hint={`${overall.won} of ${overall.settled} settled`}
            />
            <Stat
              label="Profit"
              value={`${signed(overall.profit_units)} u`}
              tone={overall.profit_units >= 0 ? "good" : "bad"}
              hint="Units, at 1 unit per pick"
            />
            <Stat
              label="Average odds"
              value={overall.average_odds ? overall.average_odds.toFixed(2) : "—"}
              hint="Across all settled picks"
            />
          </div>

          {overall.roi_percent !== null && overall.roi_percent < 0 && (
            <Card className="mb-8 border-amber-500/30 bg-amber-500/5 p-4">
              <p className="text-xs leading-relaxed text-muted-foreground">
                <span className="font-bold text-amber-400">Currently negative.</span> A
                strike rate above 50% can still lose money when the winners are short
                priced. This figure is shown as-is rather than hidden.
              </p>
            </Card>
          )}

          {data?.by_market?.length ? (
            <section className="mb-8">
              <h2 className="mb-3 font-mono text-xs uppercase tracking-wider text-muted-foreground">
                By market
              </h2>
              <div className="overflow-x-auto rounded-lg border border-border/40">
                <table className="w-full text-sm">
                  <thead className="bg-muted/20 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                    <tr>
                      <th className="px-4 py-2 text-left">Market</th>
                      <th className="px-4 py-2 text-right">Settled</th>
                      <th className="px-4 py-2 text-right">Strike</th>
                      <th className="px-4 py-2 text-right">ROI</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/30">
                    {data.by_market.map((row) => (
                      <tr key={row.market}>
                        <td className="px-4 py-2 font-mono text-xs">{row.market}</td>
                        <td className="px-4 py-2 text-right font-mono tabular-nums">{row.settled}</td>
                        <td className="px-4 py-2 text-right font-mono tabular-nums">
                          {row.strike_rate === null ? "—" : `${row.strike_rate}%`}
                        </td>
                        <td
                          className={cn(
                            "px-4 py-2 text-right font-mono tabular-nums",
                            (row.roi_percent ?? 0) >= 0 ? "text-emerald-400" : "text-rose-400",
                          )}
                        >
                          {row.roi_percent === null ? "—" : `${signed(row.roi_percent)}%`}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          ) : null}
        </>
      )}

      {recent?.length ? (
        <section>
          <h2 className="mb-3 font-mono text-xs uppercase tracking-wider text-muted-foreground">
            Recent settled picks
          </h2>
          <ul className="divide-y divide-border/30 rounded-lg border border-border/40">
            {recent.map((tip, i) => (
              <li key={`${tip.match_id}-${tip.selection}-${i}`} className="flex items-center gap-3 px-4 py-3">
                <span
                  className={cn(
                    "flex h-6 w-6 shrink-0 items-center justify-center rounded-full",
                    tip.result === "won" ? "bg-emerald-500/15 text-emerald-400" : "bg-rose-500/15 text-rose-400",
                  )}
                >
                  {tip.result === "won" ? <Check className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">
                    {tip.home_team} v {tip.away_team}
                  </p>
                  <p className="font-mono text-[11px] text-muted-foreground">
                    {tip.market} · {tip.selection} @ {tip.odds.toFixed(2)} · called at{" "}
                    {pct(tip.probability)}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="font-mono text-sm font-bold tabular-nums">{tip.score ?? "—"}</p>
                  <p className="font-mono text-[10px] text-muted-foreground">
                    {format(new Date(tip.kickoff), "d MMM")}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </Layout>
  );
}
