import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { format } from "date-fns";
import { ArrowRight, ShieldCheck, Trophy, Zap } from "lucide-react";
import { Skeleton } from "./ui/skeleton";
import { api, pct } from "@/lib/api";

// Ten is the published card size.
const CARD_SIZE = 10;

/**
 * The day's strongest selections, spread across competitions so one busy
 * league cannot dominate the card.
 */
export function DailyPickHero() {
  // Same endpoint the Top Picks page uses, so the hero and that page can never
  // disagree about what the day's selection is.
  const { data, isLoading } = useQuery({
    queryKey: ["daily-selection-hero", CARD_SIZE],
    queryFn: () => api.dailySelection({ limit: CARD_SIZE }),
    staleTime: 1000 * 60 * 5,
    refetchInterval: 1000 * 60 * 5,
    retry: false,
  });

  const picks = data?.matches ?? [];
  if (!isLoading && !picks.length) return null;

  return (
    <section className="relative mb-8 overflow-hidden rounded-xl border border-primary/30 bg-gradient-to-br from-primary/10 via-card/70 to-card/40 p-5 md:p-6">
      <div className="pointer-events-none absolute -right-8 -top-10 h-36 w-36 rounded-full bg-primary/10 blur-3xl" />
      <div className="relative">
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-[0.2em] text-primary">
            <ShieldCheck className="h-4 w-4" />
            Picks of the day
          </h2>
          <p className="font-mono text-xs text-muted-foreground">
            {data
              ? `${format(new Date(`${data.date}T12:00:00`), "EEEE, MMMM do")} · ${data.selected} picks` +
                (data.days_covered > 1 ? ` · next ${data.days_covered} days` : "")
              : "Finding the strongest available fixtures…"}
          </p>
        </div>

        {isLoading ? (
          <Skeleton className="h-24 w-full bg-background/60" />
        ) : (
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {picks.map((pick, index) => {
              const recommendation = pick.recommendation;
              if (!recommendation) return null;

              return (
                <Link
                  key={pick.fixture_id}
                  href={`/match/${pick.fixture_id}`}
                  className="group flex items-center gap-3 rounded-lg border border-border/50 bg-background/50 p-3 transition-colors hover:border-primary/60"
                >
                  {index === 0 ? (
                    <Trophy className="h-5 w-5 shrink-0 text-primary" />
                  ) : (
                    <Zap className="h-4 w-4 shrink-0 text-primary/70" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-mono text-[9px] uppercase tracking-widest text-muted-foreground">
                      {pick.league_name}
                    </p>
                    <p className="truncate text-xs font-bold">
                      {pick.home_team} <span className="text-muted-foreground">v</span>{" "}
                      {pick.away_team}
                    </p>
                    <p className="mt-1 truncate font-mono text-[10px] text-primary">
                      {recommendation.label} · {pct(recommendation.probability)}
                    </p>
                  </div>
                  <ArrowRight className="h-3 w-3 shrink-0 text-muted-foreground transition-all group-hover:translate-x-1 group-hover:text-primary" />
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
