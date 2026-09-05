import { format } from "date-fns";
import { Link } from "wouter";
import { Clock, Info, TrendingUp } from "lucide-react";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";
import { pct, type TipCard as TipCardData } from "@/lib/api";
import { cn } from "@/lib/utils";

/** Colour by calibrated probability, not by how appealing the pick looks. */
function probabilityTone(probability: number): string {
  if (probability >= 0.7) return "text-emerald-400";
  if (probability >= 0.6) return "text-amber-400";
  return "text-muted-foreground";
}

function OddsCell({ label, value, emphasised }: { label: string; value?: number | null; emphasised?: boolean }) {
  return (
    <div
      className={cn(
        "flex flex-col items-center rounded-sm border py-1",
        emphasised ? "border-primary/40 bg-primary/5" : "border-border/40 bg-background/40",
      )}
    >
      <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</span>
      <span className="font-mono text-sm font-bold tabular-nums">
        {value ? value.toFixed(2) : "—"}
      </span>
    </div>
  );
}

export function TipCard({ card }: { card: TipCardData }) {
  const { tip } = card;
  if (!tip) return null;

  const hasValue = tip.value > 0.02;

  return (
    <Card className="overflow-hidden border-border/40 bg-card/50 transition-colors hover:border-primary/40">
      <div className="flex items-center justify-between border-b border-border/40 bg-muted/20 px-4 py-2">
        <span className="truncate font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
          {card.league_country ? `${card.league_country}: ` : ""}
          {card.league_name}
        </span>
        <span className="flex shrink-0 items-center gap-1 font-mono text-xs text-muted-foreground">
          <Clock className="h-3 w-3" />
          {format(new Date(card.kickoff), "HH:mm")}
        </span>
      </div>

      <Link href={`/match/${card.fixture_id}`} className="block px-4 py-3 hover:bg-muted/10">
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
          <span className="truncate text-sm font-bold">{card.home_team}</span>
          <span className="font-mono text-[11px] text-muted-foreground">v</span>
          <span className="truncate text-right text-sm font-bold">{card.away_team}</span>
        </div>
      </Link>

      <div className="grid grid-cols-3 gap-2 px-4 pb-3">
        <OddsCell label="1" value={card.odds_home} emphasised={tip.selection === "1"} />
        <OddsCell label="X" value={card.odds_draw} emphasised={tip.selection === "X"} />
        <OddsCell label="2" value={card.odds_away} emphasised={tip.selection === "2"} />
      </div>

      <div className="border-t border-border/40 bg-background/60 px-4 py-3">
        <div className="mb-2 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Tip</span>
            <Badge variant="outline" className="rounded-sm border-primary/40 font-mono text-xs text-primary">
              {tip.selection}
            </Badge>
            {tip.source === "derived" && (
              <Tooltip>
                <TooltipTrigger>
                  <Info className="h-3 w-3 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent className="max-w-64 text-xs">
                  Derived from the expected-goals estimate rather than a separately
                  trained model.
                </TooltipContent>
              </Tooltip>
            )}
          </div>
          <span className="font-mono text-sm font-bold tabular-nums">@ {tip.odds.toFixed(2)}</span>
        </div>

        <p className="mb-3 text-xs leading-relaxed text-muted-foreground">{tip.rationale}</p>

        <div className="flex items-center justify-between border-t border-border/30 pt-2">
          <div className="flex flex-col">
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Model probability
            </span>
            <span className={cn("font-mono text-sm font-bold", probabilityTone(tip.probability))}>
              {pct(tip.probability)}
            </span>
          </div>
          {hasValue && (
            <div className="flex flex-col items-end">
              <span className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-muted-foreground">
                <TrendingUp className="h-3 w-3" />
                Edge vs market
              </span>
              <span className="font-mono text-sm font-bold text-emerald-400">
                +{Math.round(tip.value * 100)} pts
              </span>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
