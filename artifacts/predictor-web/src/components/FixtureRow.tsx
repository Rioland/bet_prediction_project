import { Link } from "wouter";
import { format } from "date-fns";
import { ChevronRight } from "lucide-react";
import { pct, type FixtureListing } from "@/lib/api";
import { cn } from "@/lib/utils";

/** One line in the full day's card. Fixtures without a tip still appear. */
export function FixtureRow({ fixture }: { fixture: FixtureListing }) {
  const played = fixture.home_score !== null && fixture.away_score !== null;

  return (
    <Link
      href={fixture.analysis_available ? `/match/${fixture.fixture_id}` : "#"}
      className={cn(
        "flex items-center gap-3 px-4 py-3 transition-colors",
        fixture.analysis_available ? "hover:bg-muted/20" : "cursor-default opacity-70",
      )}
    >
      <div className="w-12 shrink-0 font-mono text-xs text-muted-foreground">
        {played ? "FT" : format(new Date(fixture.kickoff), "HH:mm")}
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold">
          {fixture.home_team} <span className="text-muted-foreground">v</span> {fixture.away_team}
        </p>
        <p className="truncate font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
          {fixture.league_name}
        </p>
      </div>

      {played && (
        <span className="shrink-0 font-mono text-sm font-bold tabular-nums">
          {fixture.home_score}-{fixture.away_score}
        </span>
      )}

      {fixture.tip ? (
        <div className="shrink-0 text-right">
          <p className="font-mono text-xs font-bold text-primary">{fixture.tip.selection}</p>
          <p className="font-mono text-[10px] text-muted-foreground">
            {pct(fixture.tip.probability)} @ {fixture.tip.odds.toFixed(2)}
          </p>
        </div>
      ) : (
        <p
          className="max-w-[10rem] shrink-0 text-right font-mono text-[10px] leading-tight text-muted-foreground"
          title={fixture.unavailable_reason ?? undefined}
        >
          {fixture.analysis_available ? "No strong call" : "Not enough history"}
        </p>
      )}

      {fixture.analysis_available && (
        <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
      )}
    </Link>
  );
}
