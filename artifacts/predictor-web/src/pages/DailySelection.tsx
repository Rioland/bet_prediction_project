import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { format } from "date-fns";
import { ArrowRight, ServerCrash, Sparkles, TriangleAlert } from "lucide-react";
import { Layout } from "@/components/Layout";
import { DateStrip } from "@/components/DateStrip";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { api, ApiError, pct, type FixtureAnalysis } from "@/lib/api";
import { cn } from "@/lib/utils";

const BAND_TONE: Record<string, string> = {
  strong: "text-emerald-400 border-emerald-400/30 bg-emerald-400/10",
  solid: "text-amber-400 border-amber-400/30 bg-amber-400/10",
  slight: "text-orange-400 border-orange-400/30 bg-orange-400/10",
  weak: "text-rose-400 border-rose-400/30 bg-rose-400/10",
};

function SelectedMatch({ match, rank }: { match: FixtureAnalysis; rank: number }) {
  const pick = match.recommendation;
  if (!pick) return null;
  const h2h = match.head_to_head;

  return (
    <Card className="border-border/40 bg-card/50 p-5">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="mb-1 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            #{rank} · {match.league_name} · {format(new Date(match.kickoff), "HH:mm")}
          </p>
          <h3 className="truncate text-lg font-bold">
            {match.home_team} <span className="text-muted-foreground">v</span> {match.away_team}
          </h3>
        </div>
        <Badge
          variant="outline"
          className={cn("shrink-0 rounded-sm font-mono text-[10px] uppercase", BAND_TONE[pick.band])}
        >
          {pick.band}
        </Badge>
      </div>

      <div className="mb-3 rounded-md border border-primary/25 bg-primary/5 p-3">
        <div className="mb-1 flex flex-wrap items-baseline gap-2">
          <span className="font-bold">{pick.label}</span>
          <span className="font-mono text-sm font-bold tabular-nums">@ {pick.odds.toFixed(2)}</span>
          <span className="font-mono text-xs text-muted-foreground">
            model {pct(pick.probability)}
          </span>
          {pick.basis === "value" && pick.value >= 0.005 && (
            <span className="font-mono text-xs text-emerald-400">
              +{Math.round(pick.value * 100)} pts
            </span>
          )}
        </div>
        <p className="text-xs leading-relaxed text-muted-foreground">{pick.why}</p>
      </div>

      <div className="mb-3 grid grid-cols-3 gap-2 text-center">
        <div className="rounded-sm border border-border/40 bg-background/40 py-2">
          <p className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">xG</p>
          <p className="font-mono text-sm font-bold tabular-nums">
            {match.expected_goals.home}–{match.expected_goals.away}
          </p>
        </div>
        <div className="rounded-sm border border-border/40 bg-background/40 py-2">
          <p className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">H2H</p>
          <p className="font-mono text-sm font-bold tabular-nums">
            {h2h.played ? `${h2h.home_wins}-${h2h.draws}-${h2h.away_wins}` : "—"}
          </p>
        </div>
        <div className="rounded-sm border border-border/40 bg-background/40 py-2">
          <p className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">Form</p>
          <p className="font-mono text-sm font-bold tabular-nums">
            {match.form.home.points_per_game} v {match.form.away.points_per_game}
          </p>
        </div>
      </div>

      {match.value_pick && match.value_pick.selection !== pick.selection && (
        <div className="mb-3 flex items-start gap-2 rounded-sm border border-border/40 bg-background/40 p-2">
          <TriangleAlert className="mt-0.5 h-3 w-3 shrink-0 text-amber-400" />
          <p className="text-[11px] leading-relaxed text-muted-foreground">
            Bigger edge available on{" "}
            <span className="font-semibold text-foreground">{match.value_pick.label}</span> at{" "}
            {match.value_pick.odds.toFixed(2)} — but only {pct(match.value_pick.probability)} likely.
          </p>
        </div>
      )}

      <Link
        href={`/match/${match.fixture_id}`}
        className="inline-flex items-center gap-1 font-mono text-xs uppercase tracking-wider text-primary hover:underline"
      >
        Full analysis
        <ArrowRight className="h-3 w-3" />
      </Link>
    </Card>
  );
}

export default function DailySelection() {
  const [date, setDate] = useState(new Date());
  const isoDate = format(date, "yyyy-MM-dd");

  const { data, isLoading, error } = useQuery({
    queryKey: ["daily-selection", isoDate],
    queryFn: () => api.dailySelection({ date: isoDate }),
    retry: false,
  });

  const modelsMissing = error instanceof ApiError && error.status === 503;

  return (
    <Layout>
      <section className="mb-6">
        <h1 className="mb-2 flex items-center gap-2 text-3xl font-bold uppercase tracking-tight">
          <Sparkles className="h-6 w-6 text-primary" />
          Today's selection
        </h1>
        <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
          Every fixture on the card is analysed, then the strongest are kept — one per
          competition first, so a single busy league cannot take every slot.
        </p>
      </section>

      <div className="mb-6">
        <DateStrip selected={date} onSelect={setDate} />
      </div>

      {modelsMissing ? (
        <Card className="flex flex-col items-center border-amber-500/30 bg-amber-500/5 p-8 text-center">
          <ServerCrash className="mb-3 h-8 w-8 text-amber-400" />
          <h3 className="mb-1 font-bold">No model trained yet</h3>
          <p className="max-w-md font-mono text-xs text-muted-foreground">
            Fixtures need to accumulate before a model can be trained. See PIPELINE.md.
          </p>
        </Card>
      ) : isLoading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-64 rounded-lg" />
          ))}
        </div>
      ) : !data?.matches.length ? (
        <Card className="border-dashed border-border/50 bg-card/20 p-10 text-center">
          <h3 className="mb-1 font-bold">Nothing selected for this date</h3>
          <p className="mx-auto max-w-md font-mono text-xs leading-relaxed text-muted-foreground">
            {data
              ? `${data.considered} fixtures considered, ${data.analysed} had enough history, and none produced a call worth publishing.`
              : "No fixtures found."}
          </p>
        </Card>
      ) : (
        <>
          <p className="mb-4 font-mono text-xs text-muted-foreground">
            {data.selected} selected from {data.analysed} analysable of {data.considered} fixtures
          </p>
          <div className="grid gap-4 md:grid-cols-2">
            {data.matches.map((match, i) => (
              <SelectedMatch key={match.fixture_id} match={match} rank={i + 1} />
            ))}
          </div>
        </>
      )}

      <p className="mt-8 border-t border-border/40 pt-6 text-xs leading-relaxed text-muted-foreground">
        Selection is not a guarantee. These are the fixtures the model is most confident
        about relative to the market — several will still lose.
      </p>
    </Layout>
  );
}
