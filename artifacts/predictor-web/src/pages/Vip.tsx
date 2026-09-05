import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Check, Lock } from "lucide-react";
import { Layout } from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TipCard } from "@/components/TipCard";
import { Skeleton } from "@/components/ui/skeleton";
import { api, ApiError, signed } from "@/lib/api";

const INCLUDED = [
  "Every pick the model rates above the market price",
  "Full probability breakdown per fixture, not just the selection",
  "Accumulator builder with the true combined probability shown",
  "Every pick tracked against the real result — including the losers",
];

export default function Vip() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["vip-tips"],
    queryFn: () => api.vipTips({}),
    retry: false,
  });
  const { data: performance } = useQuery({
    queryKey: ["performance", 30],
    queryFn: () => api.performance(30),
  });

  const locked = error instanceof ApiError && (error.status === 401 || error.status === 402);
  const roi = performance?.overall.roi_percent;

  return (
    <Layout>
      <section className="mb-8">
        <h1 className="mb-2 text-3xl font-bold uppercase tracking-tight">VIP access</h1>
        <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
          The picks where our model most disagrees with the bookmaker's price. That
          disagreement is the whole product — not a promise that they win.
        </p>
      </section>

      {locked ? (
        <>
          <Card className="mb-8 border-border/40 bg-card/50 p-6">
            <div className="mb-4 flex items-center gap-2">
              <Lock className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-bold">What you get</h2>
            </div>
            <ul className="mb-6 space-y-2">
              {INCLUDED.map((item) => (
                <li key={item} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  {item}
                </li>
              ))}
            </ul>
            <Button asChild className="font-mono text-xs uppercase tracking-wider">
              <Link href="/subscribe">Subscribe</Link>
            </Button>
          </Card>

          <Card className="border-border/40 bg-card/30 p-5">
            <h3 className="mb-2 font-mono text-xs uppercase tracking-wider text-muted-foreground">
              Before you subscribe
            </h3>
            <p className="mb-3 text-sm leading-relaxed text-muted-foreground">
              Our tracked return over the last 30 days is{" "}
              <span className="font-mono font-bold text-foreground">
                {roi === null || roi === undefined ? "not yet established" : `${signed(roi)}%`}
              </span>
              . We publish that figure whether it is positive or negative, and you can
              check it yourself on the{" "}
              <Link href="/results" className="text-primary underline underline-offset-4">
                results page
              </Link>{" "}
              before paying anything.
            </p>
            <p className="text-xs leading-relaxed text-muted-foreground">
              We do not promise winning bets, and no model can. Sports betting loses money
              for most people who do it. Subscribe only if you find the analysis useful in
              its own right.
            </p>
          </Card>
        </>
      ) : isLoading ? (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-64 rounded-lg" />
          ))}
        </div>
      ) : !data?.matches.length ? (
        <Card className="border-dashed border-border/50 bg-card/20 p-10 text-center">
          <h3 className="mb-1 font-bold">No VIP picks today</h3>
          <p className="font-mono text-xs text-muted-foreground">
            Nothing on today's card showed an edge worth publishing. That is a normal
            outcome, not an empty page.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {data.matches.map((card) => (
            <TipCard key={`${card.fixture_id}-${card.tip?.selection}`} card={card} />
          ))}
        </div>
      )}
    </Layout>
  );
}
