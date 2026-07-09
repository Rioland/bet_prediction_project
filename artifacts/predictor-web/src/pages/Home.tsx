import { 
  useGetFootballLeagues, 
  useGetFootballMatchesToday, 
  useGetFootballPredictionsToday,
  useGetFootballLive, 
  getGetFootballMatchesTodayQueryKey, 
  getGetFootballPredictionsTodayQueryKey,
  getGetFootballLiveQueryKey 
} from "@workspace/api-client-react";
import { Layout } from "@/components/Layout";
import { MatchCard } from "@/components/MatchCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { Activity, Calendar, Zap } from "lucide-react";
import { format } from "date-fns";

export default function Home() {
  const [leagueId, setLeagueId] = useState<string>("all");

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
