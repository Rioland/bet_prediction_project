import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { Link } from "wouter";
import { Check, Copy, Info, Lock, Ticket } from "lucide-react";
import { Layout } from "@/components/Layout";
import { DateStrip } from "@/components/DateStrip";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { api, pct, type BettingSlipData } from "@/lib/api";
import { cn } from "@/lib/utils";

function CopyCode({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard is unavailable over plain HTTP and in some browsers; the code
      // stays selectable on screen either way.
      setCopied(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <code className="select-all rounded-sm border border-primary/40 bg-primary/10 px-2 py-1 font-mono text-sm font-bold tracking-widest text-primary">
        {code}
      </code>
      <Button size="sm" variant="outline" onClick={copy} className="h-7 gap-1 font-mono text-[10px]">
        {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
        {copied ? "Copied" : "Copy"}
      </Button>
    </div>
  );
}

function SlipCard({ slip }: { slip: BettingSlipData }) {
  return (
    <Card className="border-border/40 bg-card/50 p-4">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wide">{slip.label}</h3>
          <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            {slip.leg_count} {slip.leg_count === 1 ? "selection" : "selections"}
          </p>
        </div>
        <div className="shrink-0 text-right">
          <p className="font-mono text-lg font-bold tabular-nums text-primary">
            {slip.total_odds.toFixed(2)}
          </p>
          <p className="font-mono text-[10px] text-muted-foreground">
            {slip.odds_are_estimates ? "est. odds" : "total odds"}
          </p>
        </div>
      </div>

      <ul className="mb-3 divide-y divide-border/30">
        {slip.legs.map((leg) => (
          <li key={`${leg.fixture_id}-${leg.selection}`} className="flex items-center gap-2 py-2">
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold">
                {leg.home_team} <span className="text-muted-foreground">v</span> {leg.away_team}
              </p>
              <p className="truncate font-mono text-[10px] text-muted-foreground">
                {leg.league_name} · {format(new Date(leg.kickoff), "HH:mm")}
              </p>
            </div>
            <div className="shrink-0 text-right">
              <p className="font-mono text-[11px] font-bold text-primary">{leg.label}</p>
              <p className="font-mono text-[10px] text-muted-foreground">{pct(leg.probability)}</p>
            </div>
          </li>
        ))}
      </ul>

      <div className="flex items-center justify-between gap-2 border-t border-border/30 pt-3">
        {slip.has_code && slip.booking_code ? (
          <CopyCode code={slip.booking_code} />
        ) : slip.code_locked ? (
          <Link
            href="/account"
            className="flex items-center gap-1.5 rounded-sm border border-primary/30 bg-primary/5 px-2 py-1 font-mono text-[11px] text-primary hover:bg-primary/10"
          >
            <Lock className="h-3 w-3" />
            Booking code for subscribers
          </Link>
        ) : (
          <p className="text-[11px] leading-relaxed text-muted-foreground">
            No booking code for this slip — add the selections above to your betslip.
          </p>
        )}
        <span className="shrink-0 font-mono text-[10px] text-muted-foreground">
          {pct(slip.combined_probability)} all land
        </span>
      </div>
    </Card>
  );
}

export default function Slips() {
  const [date, setDate] = useState(new Date());
  const isoDate = format(date, "yyyy-MM-dd");

  const { data, isLoading } = useQuery({
    queryKey: ["slips", isoDate],
    queryFn: () => api.slips({ date: isoDate }),
  });

  const estimated = data?.slips.some((s) => s.odds_are_estimates);

  return (
    <Layout>
      <section className="mb-6">
        <h1 className="mb-2 flex items-center gap-2 text-3xl font-bold uppercase tracking-tight">
          <Ticket className="h-6 w-6 text-primary" />
          Betting slips
        </h1>
        <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
          Ten slips built from the day's selections. Where a booking code is shown, that code
          was created on the bookmaker and can be loaded directly. Where none is shown, the
          selections are listed instead.
        </p>
      </section>

      <div className="mb-6">
        <DateStrip selected={date} onSelect={setDate} />
      </div>

      {data && data.with_codes > 0 && !data.codes_unlocked && (
        <Card className="mb-5 flex flex-wrap items-center justify-between gap-3 border-primary/30 bg-primary/5 p-4">
          <p className="text-sm">
            <span className="font-semibold">{data.with_codes} booking {data.with_codes === 1 ? "code" : "codes"}</span>{" "}
            available for this date — load a slip straight into your betslip.
          </p>
          <Button asChild size="sm">
            <Link href="/account">Subscribe to unlock</Link>
          </Button>
        </Card>
      )}

      {data && data.with_codes === 0 && data.count > 0 && (
        <Card className="mb-5 flex items-start gap-2 border-border/40 bg-card/30 p-3">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
          <p className="text-xs leading-relaxed text-muted-foreground">
            No booking codes have been added for this date yet. A code can only come from
            creating the slip on the bookmaker, so none is invented here — build the
            selections yourself in the meantime.
          </p>
        </Card>
      )}

      {estimated && (
        <Card className="mb-5 flex items-start gap-2 border-amber-500/25 bg-amber-500/5 p-3">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
          <p className="text-xs leading-relaxed text-muted-foreground">
            <span className="font-semibold text-amber-400">Odds shown are estimates.</span> No
            bookmaker price was available for some selections, so these are fair prices derived
            from the model and carry no margin. What you are offered will be lower.
          </p>
        </Card>
      )}

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-56 rounded-lg" />
          ))}
        </div>
      ) : !data?.slips.length ? (
        <Card className="border-dashed border-border/50 bg-card/20 p-10 text-center">
          <h3 className="mb-1 font-bold">No slips for this date</h3>
          <p className="font-mono text-xs text-muted-foreground">
            Slips are built from the day's selections; there were none to build from.
          </p>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {data.slips.map((slip) => (
            <SlipCard key={slip.id} slip={slip} />
          ))}
        </div>
      )}

      <p className="mt-8 border-t border-border/40 pt-6 text-xs leading-relaxed text-muted-foreground">
        18+. Accumulators multiply risk as fast as returns — a slip needs every selection to
        land. The percentage on each card is the model's estimate that all of them do.
      </p>
    </Layout>
  );
}
