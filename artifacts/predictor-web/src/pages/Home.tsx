import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { Activity, ServerCrash } from "lucide-react";
import { Layout } from "@/components/Layout";
import { DateStrip } from "@/components/DateStrip";
import { MarketTabs } from "@/components/MarketTabs";
import { TipCard } from "@/components/TipCard";
import { AccumulatorCard } from "@/components/AccumulatorCard";
import { VipLockCard } from "@/components/VipLockCard";
import { DailyPickHero } from "@/components/DailyPickHero";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
import { api, ApiError, MARKET_LABELS, type Market } from "@/lib/api";

function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-lg border border-dashed border-border/50 bg-card/20 py-16 text-center">
      <Activity className="mx-auto mb-4 h-10 w-10 text-muted-foreground/40" />
      <h3 className="mb-1 text-lg font-bold">{title}</h3>
      <p className="mx-auto max-w-md font-mono text-sm text-muted-foreground">{body}</p>
    </div>
  );
}

export default function Home() {
  const [date, setDate] = useState(new Date());
  const [market, setMarket] = useState<Market>("popular");
  const isoDate = format(date, "yyyy-MM-dd");

  const { data, isLoading, error } = useQuery({
    queryKey: ["tips", isoDate, market],
    queryFn: () => api.tips({ date: isoDate, market }),
    refetchInterval: 1000 * 60 * 5,
  });

  const modelsMissing = error instanceof ApiError && error.status === 503;

  return (
    <Layout>
      <section className="mb-8">
        <h1 className="mb-2 text-3xl font-bold uppercase tracking-tight">
          Football predictions
        </h1>
        <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
          Calibrated probabilities from a model trained on historical results — not
          guaranteed outcomes. Every published pick is scored against the real result on
          the{" "}
          <a href="/results" className="text-primary underline underline-offset-4">
            results page
          </a>
          .
        </p>
      </section>

      <DailyPickHero />

      <div className="mb-4">
        <DateStrip selected={date} onSelect={setDate} />
      </div>
      <div className="mb-6">
        <MarketTabs selected={market} onSelect={setMarket} />
      </div>

      {modelsMissing ? (
        <Card className="flex flex-col items-center border-amber-500/30 bg-amber-500/5 p-8 text-center">
          <ServerCrash className="mb-3 h-8 w-8 text-amber-400" />
          <h3 className="mb-1 font-bold">No model trained yet</h3>
          <p className="max-w-md font-mono text-xs leading-relaxed text-muted-foreground">
            Ingest historical fixtures and run the training script before predictions can
            be served. See PIPELINE.md.
          </p>
        </Card>
      ) : isLoading ? (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-64 w-full rounded-lg border border-border/20 bg-card" />
          ))}
        </div>
      ) : error ? (
        <EmptyState title="Could not load predictions" body={(error as Error).message} />
      ) : !data?.matches.length ? (
        <EmptyState
          title={`No ${MARKET_LABELS[market]} picks for this date`}
          body="Either there are no fixtures, or none cleared the model's confidence floor. Try another date or market."
        />
      ) : (
        <>
          {data.accumulator && (
            <div className="mb-6 max-w-xl">
              <AccumulatorCard accumulator={data.accumulator} />
            </div>
          )}

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
            {data.matches.map((card) => (
              <TipCard key={`${card.fixture_id}-${card.tip?.selection}`} card={card} />
            ))}
            {data.vip_locked && <VipLockCard count={data.vip_count} />}
          </div>
        </>
      )}

      <p className="mt-10 border-t border-border/40 pt-6 text-xs leading-relaxed text-muted-foreground">
        18+. Predictions are statistical estimates, not certainties — a 70% pick loses
        roughly three times in ten. Never stake more than you can afford to lose.
      </p>
    </Layout>
  );
}
