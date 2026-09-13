import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import api from "@/lib/api";

type PriceInfo = { price_naira: number; period_days: number; min_naira: number; max_naira: number };
type PaymentRow = {
  reference: string; user_email: string | null; amount_naira: number;
  status: string; created_at: string; paid_at: string | null; failure_reason: string | null;
};

const naira = (n: number) =>
  new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 2 }).format(n);

export default function PricingPage() {
  const queryClient = useQueryClient();
  const [price, setPrice] = useState("");
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  const { data } = useQuery({
    queryKey: ["subscription-price"],
    queryFn: async () => (await api.get("/admin/subscription-price")).data as PriceInfo,
  });
  const { data: payments } = useQuery({
    queryKey: ["admin-payments"],
    queryFn: async () => (await api.get("/admin/payments")).data as PaymentRow[],
  });

  useEffect(() => { if (data) setPrice(String(data.price_naira)); }, [data]);

  const save = useMutation({
    mutationFn: async () => (await api.put("/admin/subscription-price", { price_naira: price })).data,
    onSuccess: (result: { price_naira: number }) => {
      setMessage({ ok: true, text: `Price set to ${naira(result.price_naira)}. New checkouts use it immediately.` });
      queryClient.invalidateQueries({ queryKey: ["subscription-price"] });
    },
    onError: (e: any) => setMessage({ ok: false, text: e?.response?.data?.detail ?? "Could not save." }),
  });

  const changed = data && Number(price) !== data.price_naira;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold tracking-tight">Pricing &amp; payments</h1>

      <Card className="max-w-lg">
        <CardHeader>
          <CardTitle className="text-base">Subscription price</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <form className="flex items-end gap-2" onSubmit={(e) => { e.preventDefault(); save.mutate(); }}>
            <label className="flex-1">
              <span className="mb-1 block text-xs text-muted-foreground">
                Naira per {data?.period_days ?? 30} days
              </span>
              <Input type="number" inputMode="decimal" min={data?.min_naira} max={data?.max_naira}
                     step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} />
            </label>
            <Button type="submit" disabled={!changed || save.isPending}>
              {save.isPending ? "Saving…" : "Update price"}
            </Button>
          </form>
          {message && (
            <p className={message.ok ? "text-xs text-emerald-400" : "text-xs text-destructive"}>{message.text}</p>
          )}
          <p className="text-[11px] leading-snug text-muted-foreground">
            Applies to checkouts started after you save. A customer already on the OPay page pays
            the price they were shown. Allowed range {data ? `${naira(data.min_naira)}–${naira(data.max_naira)}` : ""}.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent payments</CardTitle>
        </CardHeader>
        <CardContent>
          {!payments?.length ? (
            <p className="text-sm text-muted-foreground">No payments yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-xs text-muted-foreground">
                  <tr>
                    <th className="py-2 pr-3">Reference</th>
                    <th className="py-2 pr-3">Customer</th>
                    <th className="py-2 pr-3">Amount</th>
                    <th className="py-2 pr-3">Status</th>
                    <th className="py-2">Created</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {payments.map((p) => (
                    <tr key={p.reference}>
                      <td className="py-2 pr-3 font-mono text-xs">{p.reference}</td>
                      <td className="py-2 pr-3">{p.user_email ?? "—"}</td>
                      <td className="py-2 pr-3">{naira(p.amount_naira)}</td>
                      <td className="py-2 pr-3" title={p.failure_reason ?? undefined}>
                        <span className={p.status === "success" ? "text-emerald-400"
                          : p.status === "amount_mismatch" ? "text-destructive" : "text-muted-foreground"}>
                          {p.status}
                        </span>
                      </td>
                      <td className="py-2 text-xs text-muted-foreground">
                        {new Date(p.created_at).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
