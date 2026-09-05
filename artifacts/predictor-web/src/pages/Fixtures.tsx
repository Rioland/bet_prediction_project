import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { CalendarDays } from "lucide-react";
import { Layout } from "@/components/Layout";
import { DateStrip } from "@/components/DateStrip";
import { FixtureRow } from "@/components/FixtureRow";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { api, type FixtureListing } from "@/lib/api";

function groupByLeague(fixtures: FixtureListing[]): [string, FixtureListing[]][] {
  const groups = new Map<string, FixtureListing[]>();
  for (const fixture of fixtures) {
    const key = fixture.league_country
      ? `${fixture.league_country}: ${fixture.league_name}`
      : fixture.league_name;
    groups.set(key, [...(groups.get(key) ?? []), fixture]);
  }
  return [...groups.entries()].sort(([a], [b]) => a.localeCompare(b));
}

export default function Fixtures() {
  const [date, setDate] = useState(new Date());
  const isoDate = format(date, "yyyy-MM-dd");

  const { data, isLoading } = useQuery({
    queryKey: ["fixtures", isoDate],
    queryFn: () => api.fixtures({ date: isoDate }),
  });

  const groups = data ? groupByLeague(data.fixtures) : [];

  return (
    <Layout>
      <section className="mb-6">
        <h1 className="mb-2 flex items-center gap-2 text-3xl font-bold uppercase tracking-tight">
          <CalendarDays className="h-6 w-6 text-primary" />
          All fixtures
        </h1>
        <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
          Every match on the card. Fixtures the model cannot speak to are listed too, with
          the reason — an incomplete list would look like missing games rather than a model
          declining to guess.
        </p>
      </section>

      <div className="mb-6">
        <DateStrip selected={date} onSelect={setDate} />
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-lg" />
          ))}
        </div>
      ) : !data?.fixtures.length ? (
        <Card className="border-dashed border-border/50 bg-card/20 p-10 text-center">
          <h3 className="mb-1 font-bold">No fixtures on this date</h3>
          <p className="font-mono text-xs text-muted-foreground">Try another day.</p>
        </Card>
      ) : (
        <>
          <p className="mb-4 font-mono text-xs text-muted-foreground">
            {data.total} fixtures · {data.analysable} with enough history to analyse
          </p>
          <div className="space-y-5">
            {groups.map(([league, fixtures]) => (
              <section key={league}>
                <h2 className="mb-2 font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
                  {league}
                </h2>
                <div className="divide-y divide-border/30 overflow-hidden rounded-lg border border-border/40">
                  {fixtures.map((fixture) => (
                    <FixtureRow key={fixture.fixture_id} fixture={fixture} />
                  ))}
                </div>
              </section>
            ))}
          </div>
        </>
      )}
    </Layout>
  );
}
