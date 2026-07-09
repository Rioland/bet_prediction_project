import { MatchWithPrediction } from "@workspace/api-client-react/src/generated/api.schemas";
import { Link } from "wouter";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { formatPercent, getConfidenceBg, getConfidenceColor } from "@/lib/utils";
import { Activity, Clock, Trophy } from "lucide-react";
import { format } from "date-fns";

export function MatchCard({ match }: { match: MatchWithPrediction }) {
  const { prediction } = match;
  
  const isLive = match.status === "LIVE" || match.status === "IN_PLAY" || match.status === "HALFTIME";
  const isFinished = match.status === "FINISHED" || match.status === "FT";

  const winProb = prediction.home_win_prob > prediction.away_win_prob ? prediction.home_win_prob : prediction.away_win_prob;
  const isHomeFavored = prediction.home_win_prob > prediction.away_win_prob;

  return (
    <Link href={`/match/${match.fixture_id}`} className="block group">
      <Card className="relative overflow-hidden border-border/40 bg-card/50 hover:bg-card hover:border-primary/50 transition-all duration-300 hover:shadow-[0_0_20px_rgba(0,255,150,0.1)]">
        {/* Top bar: League info & Status */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-border/40 bg-muted/20 text-xs">
          <div className="flex items-center gap-2">
            {match.league_logo && (
              <img src={match.league_logo} alt={match.league_name} className="w-4 h-4 object-contain" />
            )}
            <span className="font-semibold tracking-wide text-muted-foreground uppercase">{match.league_name}</span>
          </div>
          <div className="flex items-center gap-2 font-mono">
            {isLive ? (
              <span className="flex items-center gap-1 text-red-500 font-bold animate-pulse">
                <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
                LIVE
              </span>
            ) : isFinished ? (
              <span className="text-muted-foreground">FT</span>
            ) : (
              <span className="flex items-center gap-1 text-muted-foreground">
                <Clock className="w-3 h-3" />
                {format(new Date(match.kickoff), "HH:mm")}
              </span>
            )}
          </div>
        </div>

        {/* Teams and Score */}
        <div className="p-4 grid grid-cols-[1fr_auto_1fr] gap-4 items-center">
          {/* Home Team */}
          <div className={`flex flex-col items-center gap-2 text-center ${isHomeFavored ? '' : 'opacity-75'}`}>
            <div className="w-12 h-12 rounded-full bg-muted/30 p-2 flex items-center justify-center">
              {match.home_logo ? (
                <img src={match.home_logo} alt={match.home_team} className="w-full h-full object-contain" />
              ) : (
                <div className="w-full h-full bg-secondary rounded-full" />
              )}
            </div>
            <span className="font-bold text-sm leading-tight line-clamp-2">{match.home_team}</span>
          </div>

          {/* Score / VS */}
          <div className="flex flex-col items-center justify-center font-mono">
            {(isLive || isFinished) ? (
              <div className="text-3xl font-bold tracking-tighter tabular-nums flex items-center gap-2 text-primary">
                <span>{match.home_score}</span>
                <span className="text-muted-foreground/50 text-xl">-</span>
                <span>{match.away_score}</span>
              </div>
            ) : (
              <div className="text-sm font-bold text-muted-foreground px-3 py-1 rounded-full bg-muted/50">VS</div>
            )}
            
            {/* Predicted Score snippet */}
            <div className="mt-2 text-xs text-muted-foreground font-mono bg-background/50 px-2 py-0.5 rounded border border-border/50">
              xScore {prediction.predicted_score}
            </div>
          </div>

          {/* Away Team */}
          <div className={`flex flex-col items-center gap-2 text-center ${!isHomeFavored ? '' : 'opacity-75'}`}>
            <div className="w-12 h-12 rounded-full bg-muted/30 p-2 flex items-center justify-center">
              {match.away_logo ? (
                <img src={match.away_logo} alt={match.away_team} className="w-full h-full object-contain" />
              ) : (
                <div className="w-full h-full bg-secondary rounded-full" />
              )}
            </div>
            <span className="font-bold text-sm leading-tight line-clamp-2">{match.away_team}</span>
          </div>
        </div>

        {/* Prediction summary */}
        <div className="p-4 pt-0">
          <div className="rounded-md bg-background/80 border border-border/50 p-3 grid grid-cols-3 gap-2 divide-x divide-border/50 text-center">
            <div className="flex flex-col justify-center">
              <span className="text-[10px] text-muted-foreground uppercase font-semibold tracking-wider mb-1">Pick</span>
              <span className="font-bold text-sm flex items-center justify-center gap-1">
                {prediction.predicted_winner === 'home' ? '1' : prediction.predicted_winner === 'away' ? '2' : 'X'}
                <Trophy className="w-3 h-3 text-primary" />
              </span>
            </div>
            <div className="flex flex-col justify-center px-2">
              <span className="text-[10px] text-muted-foreground uppercase font-semibold tracking-wider mb-1">Win Prob</span>
              <span className={`font-mono font-bold text-sm ${getConfidenceColor(winProb)}`}>
                {formatPercent(winProb)}
              </span>
            </div>
            <div className="flex flex-col justify-center pl-2">
              <span className="text-[10px] text-muted-foreground uppercase font-semibold tracking-wider mb-1">Conf</span>
              <Badge variant="outline" className={`mx-auto text-[10px] h-5 border rounded font-mono ${getConfidenceBg(prediction.confidence)}`}>
                {(prediction.confidence * 10).toFixed(1)}/10
              </Badge>
            </div>
          </div>
        </div>
      </Card>
    </Link>
  );
}
