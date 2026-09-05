import { useQuery } from "@tanstack/react-query";
import { Link, useRoute } from "wouter";
import { format } from "date-fns";
import { ArrowLeft, Info, Target, TrendingUp, TriangleAlert } from "lucide-react";
import { Layout } from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { api, ApiError, pct, type RankedPick, type Tip } from "@/lib/api";
import { cn } from "@/lib/utils";

const BAND_TONE: Record<string, string> = {
  strong: "text-emerald-400 border-emerald-400/30 bg-emerald-400/10",
  solid: "text-amber-400 border-amber-400/30 bg-amber-400/10",
  slight: "text-orange-400 border-orange-400/30 bg-orange-400/10",
  weak: "text-rose-400 border-rose-400/30 bg-rose-400/10",
};

const MARKET_LABEL: Record<string, string> = {
  home_win: "1X2",
  away_win: "1X2",
  draws: "1X2",
  double_chance: "Double chance",
  either_half: "Win either half",
  btts: "Both teams to score",
  over_1_5: "Goals",
  over_2_5: "Goals",
  under_3_5: "Goals",
};

function PickCard({
  pick,
  title,
  icon,
  priced,
}: {
  pick: RankedPick;
  title: string;
  icon: React.ReactNode;
  priced: boolean;
}) {
  return (
    <Card className="border-border/40 bg-card/50 p-5">
      <h2 className="mb-3 flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-muted-foreground">
        {icon}
        {title}
      </h2>

      <div className="mb-3 flex flex-wrap items-baseline gap-3">
        <span className="text-xl font-bold">{pick.label}</span>
        <Badge variant="outline" className="rounded-sm border-primary/40 font-mono text-primary">
          {pick.selection}
        </Badge>
        <span className="font-mono text-lg font-bold tabular-nums">@ {pick.odds.toFixed(2)}</span>
        <Badge variant="outline" className={cn("rounded-sm font-mono text-[10px] uppercase", BAND_TONE[pick.band])}>
          {pick.band}
        </Badge>
      </div>

      <div className="mb-3 flex flex-wrap gap-x-6 gap-y-1 font-mono text-xs">
        <span>
          <span className="text-muted-foreground">model </span>
          <span className="font-bold text-foreground">{pct(pick.probability)}</span>
        </span>
        {priced && (
          <span>
            <span className="text-muted-foreground">market </span>
            <span className="font-bold text-foreground">{pct(1 / pick.odds)}</span>
          </span>
        )}
        {priced && pick.value >= 0.005 && (
          <span className="text-emerald-400">+{Math.round(pick.value * 100)} pts edge</span>
        )}
      </div>

      <p className="mb-2 text-sm leading-relaxed text-muted-foreground">{pick.why}</p>
      <p className="text-xs leading-relaxed text-muted-foreground/80">{pick.note}</p>

      {pick.loses_more_often_than_not && (
        <div className="mt-3 flex items-start gap-2 rounded-sm border border-amber-500/20 bg-amber-500/5 p-2">
          <TriangleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-400" />
          <p className="text-[11px] leading-relaxed text-muted-foreground">
            This selection loses more often than it wins. It is listed because the price is
            generous relative to the model, not because it is likely.
          </p>
        </div>
      )}
    </Card>
  );
}

function MarketRow({ tip, priced }: { tip: Tip; priced: boolean }) {
  return (
    <tr className="border-b border-border/30 last:border-0">
      <td className="px-3 py-2">
        <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
          {MARKET_LABEL[tip.market] ?? tip.market}
        </span>
        <p className="text-sm font-semibold">{tip.label}</p>
      </td>
      <td className="px-3 py-2 text-right font-mono text-sm tabular-nums">{pct(tip.probability)}</td>
      <td className="px-3 py-2 text-right font-mono text-sm tabular-nums">{tip.odds.toFixed(2)}</td>
      <td
        className={cn(
          "px-3 py-2 text-right font-mono text-sm tabular-nums",
          tip.value >= 0.005 ? "text-emerald-400" : "text-muted-foreground",
        )}
      >
        {priced ? `${tip.value > 0 ? "+" : ""}${Math.round(tip.value * 100)}` : "—"}
      </td>
      <td className="px-3 py-2 text-right">
        {tip.source === "derived" && (
          <span title="Derived from expected goals, not a separately trained model">
            <Info className="ml-auto h-3 w-3 text-muted-foreground" />
          </span>
        )}
      </td>
    </tr>
  );
}

export default function MatchAnalysis() {
  const [, params] = useRoute("/match/:fixture_id");
  const fixtureId = params?.fixture_id ?? "";

  const { data, isLoading, error } = useQuery({
    queryKey: ["analysis", fixtureId],
    queryFn: () => api.analysis(fixtureId),
    enabled: Boolean(fixtureId),
    retry: false,
  });

  const notEnoughHistory = error instanceof ApiError && error.status === 409;

  return (
    <Layout>
      <Link
        href="/"
        className="mb-6 inline-flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-3 w-3" />
        All predictions
      </Link>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-12 w-2/3" />
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      ) : notEnoughHistory ? (
        <Card className="border-amber-500/30 bg-amber-500/5 p-8 text-center">
          <h2 className="mb-2 text-lg font-bold">Not enough history to analyse</h2>
          <p className="mx-auto max-w-md text-sm leading-relaxed text-muted-foreground">
            {(error as ApiError).message} Rather than fill the gap with assumptions, this
            fixture is left unanalysed.
          </p>
        </Card>
      ) : error || !data ? (
        <p className="font-mono text-sm text-muted-foreground">
          Could not load this fixture{error ? `: ${(error as Error).message}` : "."}
        </p>
      ) : (
        <>
          <header className="mb-6">
            <p className="mb-1 font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
              {data.league_name} · {format(new Date(data.kickoff), "EEE d MMM, HH:mm")}
            </p>
            <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
              {data.home_team} <span className="text-muted-foreground">v</span> {data.away_team}
            </h1>
            <p className="mt-2 font-mono text-xs text-muted-foreground">
              Expected goals {data.expected_goals.home} – {data.expected_goals.away} (total{" "}
              {data.expected_goals.total})
            </p>
          </header>

          <div className="mb-6 grid gap-4 lg:grid-cols-2">
            {data.recommendation && (
              <PickCard
                pick={data.recommendation}
                title="Recommended pick"
                icon={<Target className="h-4 w-4 text-primary" />}
                priced={data.recommendation.basis === "value"}
              />
            )}
            {data.value_pick && data.value_pick.selection !== data.recommendation?.selection && (
              <PickCard
                pick={data.value_pick}
                title="Biggest edge vs the market"
                icon={<TrendingUp className="h-4 w-4 text-primary" />}
                priced
              />
            )}
          </div>

          {!data.priced_markets.length && (
            <Card className="mb-6 border-border/40 bg-card/30 p-4">
              <p className="text-xs leading-relaxed text-muted-foreground">
                No bookmaker prices were available for this fixture, so no edge could be
                measured. Every figure below is the model's own estimate.
              </p>
            </Card>
          )}

          <section className="mb-6">
            <h2 className="mb-3 font-mono text-xs uppercase tracking-wider text-muted-foreground">
              Every market
            </h2>
            <div className="overflow-x-auto rounded-lg border border-border/40">
              <table className="w-full">
                <thead className="bg-muted/20 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="px-3 py-2 text-left">Selection</th>
                    <th className="px-3 py-2 text-right">Model</th>
                    <th className="px-3 py-2 text-right">Odds</th>
                    <th className="px-3 py-2 text-right">Edge</th>
                    <th className="px-3 py-2" />
                  </tr>
                </thead>
                <tbody>
                  {data.markets.map((tip) => (
                    <MarketRow
                      key={`${tip.market}-${tip.selection}`}
                      tip={tip}
                      priced={data.priced_markets.includes(tip.market)}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card className="border-border/40 bg-card/50 p-5">
              <h2 className="mb-3 font-mono text-xs uppercase tracking-wider text-muted-foreground">
                Head to head
              </h2>
              {data.head_to_head.played === 0 ? (
                <p className="text-sm text-muted-foreground">
                  These sides have no completed meetings on record.
                </p>
              ) : (
                <>
                  <div className="mb-3 flex gap-4 font-mono text-sm">
                    <span>
                      <span className="font-bold text-emerald-400">{data.head_to_head.home_wins}</span>
                      <span className="text-muted-foreground"> {data.home_team}</span>
                    </span>
                    <span>
                      <span className="font-bold">{data.head_to_head.draws}</span>
                      <span className="text-muted-foreground"> drawn</span>
                    </span>
                    <span>
                      <span className="font-bold text-rose-400">{data.head_to_head.away_wins}</span>
                      <span className="text-muted-foreground"> {data.away_team}</span>
                    </span>
                  </div>
                  <p className="mb-3 font-mono text-xs text-muted-foreground">
                    {data.head_to_head.played} meetings · {data.head_to_head.avg_goals} goals per
                    game
                    {data.head_to_head.btts_rate !== null &&
                      ` · both scored ${pct(data.head_to_head.btts_rate)}`}
                  </p>
                  <ul className="divide-y divide-border/30">
                    {data.head_to_head.fixtures.slice(0, 6).map((fixture, i) => (
                      <li key={i} className="flex items-center justify-between py-1.5 font-mono text-xs">
                        <span className="text-muted-foreground">
                          {format(new Date(fixture.kickoff), "MMM yyyy")}
                          {!fixture.at_home && " (a)"}
                        </span>
                        <span className="font-bold tabular-nums">{fixture.score}</span>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </Card>

            <Card className="border-border/40 bg-card/50 p-5">
              <h2 className="mb-3 font-mono text-xs uppercase tracking-wider text-muted-foreground">
                Recent form
              </h2>
              <table className="w-full text-sm">
                <thead className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="py-1 text-left" />
                    <th className="py-1 text-right">PPG</th>
                    <th className="py-1 text-right">Scored</th>
                    <th className="py-1 text-right">Conceded</th>
                    <th className="py-1 text-right">Rest</th>
                  </tr>
                </thead>
                <tbody>
                  {([["home", data.home_team], ["away", data.away_team]] as const).map(
                    ([side, name]) => {
                      const form = data.form[side];
                      return (
                        <tr key={side} className="border-t border-border/30">
                          <td className="py-2 pr-2 font-semibold">{name}</td>
                          <td className="py-2 text-right font-mono tabular-nums">
                            {form.points_per_game}
                          </td>
                          <td className="py-2 text-right font-mono tabular-nums">
                            {form.goals_scored_avg}
                          </td>
                          <td className="py-2 text-right font-mono tabular-nums">
                            {form.goals_conceded_avg}
                          </td>
                          <td className="py-2 text-right font-mono tabular-nums">
                            {form.rest_days}d
                          </td>
                        </tr>
                      );
                    },
                  )}
                </tbody>
              </table>
              <p className="mt-3 font-mono text-[11px] text-muted-foreground">
                Rolling averages over each side's last 10 completed fixtures.
              </p>
            </Card>
          </div>
        </>
      )}
    </Layout>
  );
}
