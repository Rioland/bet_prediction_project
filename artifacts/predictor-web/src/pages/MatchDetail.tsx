import { useGetFootballPredictionById, getGetFootballPredictionByIdQueryKey } from "@workspace/api-client-react";
import { Layout } from "@/components/Layout";
import { useParams, Link } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ProbabilityBar } from "@/components/ProbabilityBar";
import { ChevronLeft, BarChart2, Target, Zap, Goal, Activity } from "lucide-react";
import { format } from "date-fns";
import { getConfidenceBg, getConfidenceColor } from "@/lib/utils";

export default function MatchDetail() {
  const params = useParams<{ fixture_id: string }>();
  const fixtureId = Number(params.fixture_id);

  const { data: match, isLoading } = useGetFootballPredictionById(fixtureId, {
    query: {
      enabled: !!fixtureId,
      queryKey: getGetFootballPredictionByIdQueryKey(fixtureId)
    }
  });

  if (isLoading) {
    return (
      <Layout>
        <div className="space-y-6">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-64 w-full" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Skeleton className="h-96 w-full" />
            <Skeleton className="h-96 w-full" />
          </div>
        </div>
      </Layout>
    );
  }

  if (!match) {
    return (
      <Layout>
        <div className="py-20 text-center">
          <h2 className="text-2xl font-bold">Match not found</h2>
          <Link href="/" className="text-primary hover:underline mt-4 inline-block">
            Return to predictions
          </Link>
        </div>
      </Layout>
    );
  }

  const { prediction } = match;
  const isLive = match.status === "LIVE" || match.status === "IN_PLAY" || match.status === "HALFTIME";
  const isFinished = match.status === "FINISHED" || match.status === "FT";

  return (
    <Layout>
      <div className="mb-6">
        <Link href="/" className="inline-flex items-center text-sm font-mono text-muted-foreground hover:text-primary transition-colors">
          <ChevronLeft className="w-4 h-4 mr-1" />
          BACK TO PREDICTIONS
        </Link>
      </div>

      {/* Hero Scoreboard */}
      <Card className="mb-8 border-border/40 bg-card/40 overflow-hidden relative shadow-2xl shadow-black/50">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />
        
        <div className="p-6 md:p-10 relative z-10">
          <div className="text-center mb-8 flex flex-col items-center justify-center">
            <div className="flex items-center gap-2 mb-2">
              {match.league_logo && <img src={match.league_logo} className="w-5 h-5 object-contain" alt="League" />}
              <Badge variant="outline" className="bg-background/80 backdrop-blur font-mono uppercase tracking-widest text-xs border-border/50">
                {match.league_name} {match.league_country && `• ${match.league_country}`}
              </Badge>
            </div>
            
            <div className="font-mono text-sm text-muted-foreground">
              {isLive ? (
                <span className="text-red-500 font-bold animate-pulse flex items-center justify-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-red-500" /> LIVE MATCH
                </span>
              ) : isFinished ? (
                "FULL TIME"
              ) : (
                format(new Date(match.kickoff), "EEEE, MMM do • HH:mm")
              )}
            </div>
          </div>

          <div className="grid grid-cols-[1fr_auto_1fr] gap-6 items-center">
            {/* Home */}
            <div className="flex flex-col md:flex-row items-center gap-6 justify-end">
              <h2 className="text-2xl md:text-4xl font-bold text-center md:text-right order-2 md:order-1 tracking-tight">
                {match.home_team}
              </h2>
              <div className="w-20 h-20 md:w-32 md:h-32 rounded-2xl bg-white/5 p-4 flex items-center justify-center order-1 md:order-2 border border-white/10 shadow-lg">
                {match.home_logo ? (
                  <img src={match.home_logo} alt={match.home_team} className="w-full h-full object-contain drop-shadow-2xl" />
                ) : (
                  <div className="w-full h-full bg-secondary rounded-full" />
                )}
              </div>
            </div>

            {/* Score */}
            <div className="flex flex-col items-center justify-center px-4 md:px-8">
              {(isLive || isFinished) ? (
                <div className="text-5xl md:text-7xl font-bold font-mono tracking-tighter text-primary drop-shadow-[0_0_15px_rgba(0,255,150,0.3)]">
                  {match.home_score} - {match.away_score}
                </div>
              ) : (
                <div className="text-3xl md:text-5xl font-black text-muted-foreground/30 px-6 py-2 rounded-xl bg-muted/20">
                  VS
                </div>
              )}
            </div>

            {/* Away */}
            <div className="flex flex-col md:flex-row items-center gap-6 justify-start">
              <div className="w-20 h-20 md:w-32 md:h-32 rounded-2xl bg-white/5 p-4 flex items-center justify-center border border-white/10 shadow-lg">
                {match.away_logo ? (
                  <img src={match.away_logo} alt={match.away_team} className="w-full h-full object-contain drop-shadow-2xl" />
                ) : (
                  <div className="w-full h-full bg-secondary rounded-full" />
                )}
              </div>
              <h2 className="text-2xl md:text-4xl font-bold text-center md:text-left tracking-tight">
                {match.away_team}
              </h2>
            </div>
          </div>
        </div>
      </Card>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Core Prediction */}
        <Card className="col-span-1 border-border/40 bg-card/60 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -mr-10 -mt-10 transition-transform group-hover:scale-150 duration-700" />
          <CardHeader className="border-b border-border/30 pb-4">
            <CardTitle className="text-lg flex items-center gap-2 uppercase tracking-wide">
              <Zap className="w-5 h-5 text-primary" />
              AI Verdict
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 relative z-10">
            <div className="flex flex-col items-center text-center space-y-6">
              <div>
                <div className="text-xs font-mono text-muted-foreground uppercase tracking-widest mb-2">Predicted Winner</div>
                <div className="text-4xl font-black tracking-tight text-white drop-shadow-md">
                  {prediction.predicted_winner === 'home' ? match.home_team : 
                   prediction.predicted_winner === 'away' ? match.away_team : 'Draw'}
                </div>
              </div>

              <div className="w-full grid grid-cols-2 gap-4">
                <div className="bg-background/80 rounded-lg p-4 border border-border/50">
                  <div className="text-[10px] uppercase font-mono text-muted-foreground mb-1">Score Model</div>
                  <div className="text-3xl font-mono font-bold text-primary">{prediction.predicted_score}</div>
                </div>
                <div className="bg-background/80 rounded-lg p-4 border border-border/50">
                  <div className="text-[10px] uppercase font-mono text-muted-foreground mb-1">Confidence</div>
                  <div className={`text-3xl font-mono font-bold ${getConfidenceColor(prediction.confidence)}`}>
                    {(prediction.confidence * 10).toFixed(1)}<span className="text-sm text-muted-foreground">/10</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 1X2 Probabilities */}
        <Card className="col-span-1 md:col-span-2 border-border/40 bg-card/60">
          <CardHeader className="border-b border-border/30 pb-4">
            <CardTitle className="text-lg flex items-center gap-2 uppercase tracking-wide">
              <BarChart2 className="w-5 h-5 text-primary" />
              Match Result Probabilities
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-6">
              <ProbabilityBar 
                label={`${match.home_team} Win`} 
                probability={prediction.home_win_prob} 
                isWinner={prediction.predicted_winner === 'home'}
                colorClass={prediction.predicted_winner === 'home' ? 'bg-primary' : 'bg-slate-400'}
              />
              <ProbabilityBar 
                label="Draw" 
                probability={prediction.draw_prob} 
                isWinner={prediction.predicted_winner === 'draw'}
                colorClass={prediction.predicted_winner === 'draw' ? 'bg-primary' : 'bg-slate-500'}
              />
              <ProbabilityBar 
                label={`${match.away_team} Win`} 
                probability={prediction.away_win_prob} 
                isWinner={prediction.predicted_winner === 'away'}
                colorClass={prediction.predicted_winner === 'away' ? 'bg-primary' : 'bg-slate-400'}
              />
            </div>
          </CardContent>
        </Card>

        {/* Expected Goals (xG) */}
        <Card className="col-span-1 md:col-span-2 border-border/40 bg-card/60">
          <CardHeader className="border-b border-border/30 pb-4">
            <CardTitle className="text-lg flex items-center gap-2 uppercase tracking-wide">
              <Target className="w-5 h-5 text-primary" />
              Expected Goals (xG) Model
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-8">
            <div className="relative">
              {/* Center Line */}
              <div className="absolute left-1/2 top-0 bottom-0 w-px bg-border/50 -translate-x-1/2" />
              
              <div className="grid grid-cols-2 gap-8 items-center text-center">
                <div className="space-y-2">
                  <div className="text-5xl font-black font-mono text-white drop-shadow-lg">
                    {prediction.home_xg.toFixed(2)}
                  </div>
                  <div className="text-sm font-mono text-muted-foreground truncate">{match.home_team} xG</div>
                </div>
                
                <div className="space-y-2">
                  <div className="text-5xl font-black font-mono text-white drop-shadow-lg">
                    {prediction.away_xg.toFixed(2)}
                  </div>
                  <div className="text-sm font-mono text-muted-foreground truncate">{match.away_team} xG</div>
                </div>
              </div>

              {/* Visual representation */}
              <div className="mt-8 flex h-4 rounded-full overflow-hidden bg-secondary">
                <div 
                  className="bg-primary h-full transition-all" 
                  style={{ width: `${(prediction.home_xg / (prediction.home_xg + prediction.away_xg)) * 100}%` }}
                />
                <div 
                  className="bg-blue-500 h-full transition-all" 
                  style={{ width: `${(prediction.away_xg / (prediction.home_xg + prediction.away_xg)) * 100}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Goals Markets */}
        <Card className="col-span-1 border-border/40 bg-card/60">
          <CardHeader className="border-b border-border/30 pb-4">
            <CardTitle className="text-lg flex items-center gap-2 uppercase tracking-wide">
              <Goal className="w-5 h-5 text-primary" />
              Goal Markets
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-8">
              <div>
                <div className="flex justify-between items-end mb-2">
                  <div className="text-sm font-bold">Both Teams to Score</div>
                  <Badge variant={prediction.btts_prob > 0.5 ? "default" : "secondary"}>
                    {prediction.btts_prob > 0.5 ? "YES" : "NO"}
                  </Badge>
                </div>
                <ProbabilityBar 
                  label="BTTS Probability" 
                  probability={prediction.btts_prob} 
                  colorClass={prediction.btts_prob > 0.5 ? 'bg-primary' : 'bg-slate-400'}
                />
              </div>

              <div>
                <div className="flex justify-between items-end mb-2">
                  <div className="text-sm font-bold">Over/Under 2.5 Goals</div>
                  <Badge variant={prediction.over_25_prob > 0.5 ? "default" : "secondary"}>
                    {prediction.over_25_prob > 0.5 ? "OVER" : "UNDER"}
                  </Badge>
                </div>
                <ProbabilityBar 
                  label="Over 2.5 Prob" 
                  probability={prediction.over_25_prob} 
                  colorClass={prediction.over_25_prob > 0.5 ? 'bg-primary' : 'bg-slate-400'}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
