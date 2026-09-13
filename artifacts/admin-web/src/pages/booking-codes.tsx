import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import api from "@/lib/api";

type Leg = { fixture_id: number; home_team: string; away_team: string; label: string; kickoff: string };
type Slip = {
  id: number;
  label: string;
  leg_count: number;
  total_odds: number;
  odds_are_estimates: boolean;
  booking_code: string | null;
  has_code: boolean;
  legs: Leg[];
};

const today = () => new Date().toISOString().slice(0, 10);

function SlipRow({ slip, date }: { slip: Slip; date: string }) {
  const queryClient = useQueryClient();
  const [code, setCode] = useState(slip.booking_code ?? "");
  const [error, setError] = useState<string | null>(null);

  const refresh = () => queryClient.invalidateQueries({ queryKey: ["admin-slips", date] });

  const save = useMutation({
    mutationFn: async () =>
      (await api.post(`/admin/slips/${slip.id}/code`, { booking_code: code.trim() })).data,
    onSuccess: () => { setError(null); refresh(); },
    onError: (e: any) => {
      const detail = e?.response?.data?.detail;
      setError(Array.isArray(detail) ? "Codes are 4-40 letters, digits or hyphens." : detail ?? "Could not save.");
    },
  });

  const clear = useMutation({
    mutationFn: async () => (await api.delete(`/admin/slips/${slip.id}/code`)).data,
    onSuccess: () => { setCode(""); refresh(); },
  });

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="text-base">{slip.label}</CardTitle>
            <p className="text-xs text-muted-foreground">
              {slip.leg_count} selection{slip.leg_count === 1 ? "" : "s"} · {slip.total_odds.toFixed(2)}
              {slip.odds_are_estimates ? " (estimated)" : ""}
            </p>
          </div>
          <span className={slip.has_code
            ? "rounded bg-emerald-500/15 px-2 py-0.5 text-[11px] text-emerald-400"
            : "rounded bg-amber-500/15 px-2 py-0.5 text-[11px] text-amber-400"}>
            {slip.has_code ? "Published" : "Needs code"}
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <ol className="space-y-1 text-xs">
          {slip.legs.map((leg, i) => (
            <li key={`${leg.fixture_id}-${i}`} className="flex justify-between gap-2">
              <span className="truncate">{leg.home_team} v {leg.away_team}</span>
              <span className="shrink-0 font-medium">{leg.label}</span>
            </li>
          ))}
        </ol>

        <p className="rounded border border-amber-500/20 bg-amber-500/5 p-2 text-[11px] leading-snug text-muted-foreground">
          Build exactly these selections on SportyBet, then paste the code it gives you. The code is
          not checked against SportyBet — a code for the wrong slip publishes the wrong bet.
        </p>

        <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); save.mutate(); }}>
          <Input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())}
                 placeholder="Paste SportyBet booking code" className="font-mono" />
          <Button type="submit" disabled={!code.trim() || save.isPending}>
            {save.isPending ? "Saving…" : "Save"}
          </Button>
          {slip.has_code && (
            <Button type="button" variant="outline" onClick={() => clear.mutate()} disabled={clear.isPending}>
              Remove
            </Button>
          )}
        </form>
        {error && <p className="text-xs text-destructive">{error}</p>}
      </CardContent>
    </Card>
  );
}

export default function BookingCodesPage() {
  const [date, setDate] = useState(today());

  const { data, isLoading, isError } = useQuery({
    queryKey: ["admin-slips", date],
    queryFn: async () => {
      // Requesting the public list first builds the day's slips if none exist yet.
      await api.get(`/slips`, { params: { date } });
      return (await api.get(`/admin/slips`, { params: { date } })).data as {
        slips: Slip[]; awaiting_code: number[];
      };
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Booking codes</h1>
          <p className="text-sm text-muted-foreground">
            Codes are shown only to subscribers with an active plan.
          </p>
        </div>
        <label className="text-sm">
          <span className="mb-1 block text-xs text-muted-foreground">Date</span>
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-44" />
        </label>
      </div>

      {isLoading && <p className="text-muted-foreground">Loading slips…</p>}
      {isError && <p className="text-destructive">Failed to load slips.</p>}
      {data && (
        <>
          <p className="text-sm text-muted-foreground">
            {data.slips.length - data.awaiting_code.length} of {data.slips.length} slips published
          </p>
          {data.slips.length === 0 ? (
            <p className="text-muted-foreground">No slips could be built for this date.</p>
          ) : (
            <div className="grid gap-4 lg:grid-cols-2">
              {data.slips.map((slip) => <SlipRow key={slip.id} slip={slip} date={date} />)}
            </div>
          )}
        </>
      )}
    </div>
  );
}
