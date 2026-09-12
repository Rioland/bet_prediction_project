import { MARKET_LABELS, type Market } from "@/lib/api";
import { cn } from "@/lib/utils";

const ORDER: Market[] = [
  "popular", "banker", "2_odds", "home_win", "away_win", "draws",
  "double_chance", "either_half", "first_half", "first_half_goals", "handicap",
  "btts", "over_1_5", "over_2_5", "under_3_5", "acca",
];

export function MarketTabs({
  selected,
  onSelect,
}: {
  selected: Market;
  onSelect: (market: Market) => void;
}) {
  return (
    <div
      role="tablist"
      aria-label="Betting market"
      className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 md:mx-0 md:px-0"
    >
      {ORDER.map((market) => {
        const active = market === selected;
        return (
          <button
            key={market}
            role="tab"
            aria-selected={active}
            onClick={() => onSelect(market)}
            className={cn(
              "shrink-0 rounded-sm border px-3 py-1.5 font-mono text-xs uppercase tracking-wider transition-colors",
              active
                ? "border-primary/60 bg-primary/10 text-primary"
                : "border-border/50 bg-card/40 text-muted-foreground hover:border-border hover:text-foreground",
            )}
          >
            {MARKET_LABELS[market]}
          </button>
        );
      })}
    </div>
  );
}
