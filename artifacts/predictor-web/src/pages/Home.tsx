import { 
  useGetFootballLeagues, 
  useGetFootballMatchesToday, 
  useGetFootballPredictionsToday,
  useGetFootballLive, 
  getGetFootballMatchesTodayQueryKey, 
  getGetFootballPredictionsTodayQueryKey,
  getGetFootballLiveQueryKey 
} from "@workspace/api-client-react";
import type { MatchWithPrediction } from "@workspace/api-client-react";
import { Layout } from "@/components/Layout";
import { MatchCard } from "@/components/MatchCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { useState } from "react";
import { Activity, ArrowRight, Calendar, ShieldCheck, Trophy, Zap } from "lucide-react";
import { format } from "date-fns";

type DailyPickResponse = {
  pick_date: string;
  is_today: boolean;
  pick_count: number;
  picks: MatchWithPrediction[];
  match: MatchWithPrediction | null;
  reason: string;
};

type DailyPickEntry = {
  pick_date: string;
  pick_count: number;
  picks: MatchWithPrediction[];
  match?: MatchWithPrediction | null;
  reason: string;
};

export default function Home() {
  const [leagueId, setLeagueId] = useState<string>("all");
  const { data: dailyPick, isLoading: dailyPickLoading } = useQuery<DailyPickResponse>({
    queryKey: ["/api/football/pick/today"],
    queryFn: async () => {
      const response = await fetch("/api/football/pick/today");
      if (!response.ok) throw new Error("Unable to load daily pick");
      return response.json();
    },
    staleTime: 1000 * 60 * 5,
    refetchInterval: 1000 * 60 * 5,
  });
  const { data: dailyPicks } = useQuery<DailyPickEntry[]>({
    queryKey: ["/api/football/picks/daily"],
    queryFn: async () => {
      const response = await fetch("/api/football/picks/daily");
      if (!response.ok) throw new Error("Unable to load daily picks");
      return response.json();
    },
    staleTime: 1000 * 60 * 5,
    refetchInterval: 1000 * 60 * 5,
  });

  const { data: leagues, isLoading: leaguesLoading } = useGetFootballLeagues({
    query: {
      staleTime: 1000 * 60 * 60, // 1 hour
    }
  });

  const parsedLeagueId = leagueId === "all" ? undefined : Number(leagueId);

  const { data: todayMatches, isLoading: todayLoading } = useGetFootballMatchesToday(
    { league_id: parsedLeagueId },
    {
      query: {
        queryKey: getGetFootballMatchesTodayQueryKey({ league_id: parsedLeagueId }),
        refetchInterval: 1000 * 60 * 5, // 5 min
      }
    }
  );

  const { data: predictionsToday, isLoading: predictionsLoading } = useGetFootballPredictionsToday(
    { league_id: parsedLeagueId },
    {
      query: {
        queryKey: getGetFootballPredictionsTodayQueryKey({ league_id: parsedLeagueId }),
        refetchInterval: 1000 * 60 * 5,
      }
    }
  );

  const { data: liveMatches, isLoading: liveLoading } = useGetFootballLive({
    query: {
      queryKey: getGetFootballLiveQueryKey(),
      refetchInterval: 1000 * 60, // 1 min
    }
  });

  const liveMatchesFiltered = parsedLeagueId && liveMatches 
    ? liveMatches.filter(m => m.league_id === parsedLeagueId)
    : liveMatches;

  return (
    <Layout>
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight uppercase mb-2 flex items-center gap-3">
            <span className="w-3 h-8 bg-primary block rounded-sm shadow-[0_0_10px_rgba(0,255,150,0.5)]"></span>
            Predictions
          </h1>
          <p className="text-muted-foreground font-mono flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            {format(new Date(), "EEEE, MMMM do yyyy")}
          </p>
        </div>

        <div className="w-full md:w-64">
          <Select value={leagueId} onValueChange={setLeagueId}>
            <SelectTrigger className="w-full bg-card/50 border-border/50 font-mono text-sm">
              <SelectValue placeholder="All Leagues" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Leagues</SelectItem>
              {leagues?.map((l) => (
                <SelectItem key={l.id} value={l.id.toString()}>
                  {l.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <section className="relative overflow-hidden rounded-xl border border-primary/30 bg-gradient-to-br from-primary/10 via-card/70 to-card/40 p-5 md:p-6 mb-8">
        <div className="absolute -right-8 -top-10 h-36 w-36 rounded-full bg-primary/10 blur-3xl" />
        <div className="relative">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
            <div className="flex items-center gap-2 text-primary font-mono text-xs font-bold tracking-[0.2em] uppercase">
              <ShieldCheck className="w-4 h-4" />
              {dailyPick?.is_today ? "AI Picks of the Day" : "Next Available AI Picks"}
            </div>
            <p className="text-muted-foreground font-mono text-xs">
              {dailyPick
                ? `${format(new Date(`${dailyPick.pick_date}T12:00:00`), "EEEE, MMMM do")} · ${dailyPick.pick_count} picks`
                : "Finding the strongest available fixtures..."}
            </p>
          </div>

          {dailyPickLoading ? (
            <Skeleton className="h-24 w-full bg-background/60" />
          ) : dailyPick?.picks?.length ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
              {dailyPick.picks.map((pick, index) => {
                const pickedTeam = pick.prediction.predicted_winner === "home"
                  ? pick.home_team
                  : pick.prediction.predicted_winner === "away"
                    ? pick.away_team
                    : "Draw";
                return (
                  <Link key={pick.fixture_id} href={`/match/${pick.fixture_id}`} className="group flex items-center gap-3 rounded-lg border border-border/50 bg-background/50 p-3 hover:border-primary/60 transition-colors">
                    {index === 0 ? <Trophy className="w-5 h-5 shrink-0 text-primary" /> : <Zap className="w-4 h-4 shrink-0 text-primary/70" />}
                    <div className="min-w-0 flex-1">
                      <p className="text-[9px] uppercase tracking-widest text-muted-foreground font-mono truncate">{pick.league_name}</p>
                      <p className="text-xs font-bold truncate">{pick.home_team} <span className="text-muted-foreground">vs</span> {pick.away_team}</p>
                      <p className="text-[10px] text-primary font-mono mt-1 truncate">
                        {pickedTeam} · {(pick.prediction.confidence * 100).toFixed(0)}%
                      </p>
                    </div>
                    <ArrowRight className="w-3 h-3 shrink-0 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                  </Link>
                );
              })}
            </div>
          ) : (
            <p className="rounded-lg border border-border/50 bg-background/50 p-4 text-sm text-muted-foreground font-mono">
              No live fixture source is available right now.
            </p>
          )}
        </div>
      </section>

      {dailyPicks && dailyPicks.length > 0 && (
        <section className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="font-bold uppercase tracking-wider text-sm">6–7 picks per day</h2>
              <p className="text-xs text-muted-foreground font-mono mt-1">High-confidence picks diversified across available leagues</p>
            </div>
            <Zap className="w-4 h-4 text-primary" />
          </div>
          <div className="space-y-4">
            {dailyPicks.map((entry) => {
              const picks = entry.picks?.length
                ? entry.picks
                : entry.match
                  ? [entry.match]
                  : [];
              return (
                <div key={entry.pick_date} className="rounded-lg border border-border/50 bg-card/30 p-3">
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                      {format(new Date(`${entry.pick_date}T12:00:00`), "EEE, MMM d")}
                    </span>
                    <span className="text-[10px] text-primary font-mono">{entry.pick_count} picks</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-2">
                    {picks.map((pick) => {
                      const pickedTeam = pick.prediction.predicted_winner === "home"
                        ? pick.home_team
                        : pick.prediction.predicted_winner === "away"
                          ? pick.away_team
                          : "Draw";
                      return (
                        <Link key={pick.fixture_id} href={`/match/${pick.fixture_id}`} className="group rounded-md border border-border/40 bg-background/30 p-2 hover:border-primary/50 transition-colors">
                          <p className="text-[9px] uppercase tracking-wider text-muted-foreground font-mono truncate">{pick.league_name}</p>
                          <p className="mt-1 text-[11px] font-semibold truncate">{pick.home_team} <span className="text-muted-foreground">vs</span> {pick.away_team}</p>
                          <p className="mt-1 text-[10px] text-primary font-mono truncate group-hover:underline">{pickedTeam} · {(pick.prediction.confidence * 100).toFixed(0)}%</p>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      <Tabs defaultValue="predictions" className="w-full">
        <TabsList className="mb-6 w-full max-w-2xl grid grid-cols-3 bg-card/50 border border-border/50">
          <TabsTrigger value="predictions" className="font-mono uppercase tracking-widest text-xs flex items-center gap-2">
            <Zap className="w-3 h-3 text-primary" />
            AI Picks
          </TabsTrigger>
          <TabsTrigger value="today" className="font-mono uppercase tracking-widest text-xs">All Matches</TabsTrigger>
          <TabsTrigger value="live" className="font-mono uppercase tracking-widest text-xs flex items-center gap-2">
            Live
            {liveMatchesFiltered && liveMatchesFiltered.length > 0 && (
              <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-sm font-bold">
                {liveMatchesFiltered.length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="predictions" className="focus-visible:outline-none focus-visible:ring-0 mt-0">
          {predictionsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-64 w-full rounded-lg bg-card border border-border/20" />
              ))}
            </div>
          ) : predictionsToday && predictionsToday.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {predictionsToday
                // Sort by highest confidence for the top picks view
                .sort((a, b) => b.prediction.confidence - a.prediction.confidence)
                .map((match) => (
                <MatchCard key={match.fixture_id} match={match} />
              ))}
            </div>
          ) : (
            <div className="py-20 text-center border border-border/50 rounded-lg bg-card/20 border-dashed">
              <Activity className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="text-xl font-bold mb-2">No top predictions today</h3>
              <p className="text-muted-foreground font-mono text-sm">Check back later or select another league.</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="today" className="focus-visible:outline-none focus-visible:ring-0 mt-0">
          {todayLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-64 w-full rounded-lg bg-card border border-border/20" />
              ))}
            </div>
          ) : todayMatches && todayMatches.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {todayMatches.map((match) => (
                <MatchCard key={match.fixture_id} match={match} />
              ))}
            </div>
          ) : (
            <div className="py-20 text-center border border-border/50 rounded-lg bg-card/20 border-dashed">
              <Activity className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="text-xl font-bold mb-2">No matches today</h3>
              <p className="text-muted-foreground font-mono text-sm">Check back later or select another league.</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="live" className="focus-visible:outline-none focus-visible:ring-0 mt-0">
          {liveLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-64 w-full rounded-lg bg-card border border-border/20" />
              ))}
            </div>
          ) : liveMatchesFiltered && liveMatchesFiltered.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {liveMatchesFiltered.map((match) => (
                <MatchCard key={match.fixture_id} match={match} />
              ))}
            </div>
          ) : (
            <div className="py-20 text-center border border-border/50 rounded-lg bg-card/20 border-dashed">
              <span className="relative flex h-12 w-12 mx-auto mb-4">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-20"></span>
                <span className="relative inline-flex rounded-full h-12 w-12 bg-card border border-border/50 items-center justify-center text-muted-foreground">
                  <Activity className="w-6 h-6" />
                </span>
              </span>
              <h3 className="text-xl font-bold mb-2">No live matches</h3>
              <p className="text-muted-foreground font-mono text-sm">There are no live matches right now.</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </Layout>
  );
}
