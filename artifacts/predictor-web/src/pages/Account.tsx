import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { format } from "date-fns";
import { CheckCircle2, Clock, CreditCard, Loader2, LogOut, ShieldAlert, Ticket } from "lucide-react";
import { Layout } from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { api, ApiError } from "@/lib/api";
import { useAccount } from "@/hooks/use-account";

const PENDING_REFERENCE_KEY = "pending_payment_reference";

const naira = (amount: number) =>
  new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 })
    .format(amount);

function readPendingReference(): string | null {
  try {
    return localStorage.getItem(PENDING_REFERENCE_KEY);
  } catch {
    return null;
  }
}

export default function Account() {
  const [location, navigate] = useLocation();
  const queryClient = useQueryClient();
  const { user, isLoading, signOut } = useAccount();
  const [paying, setPaying] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [notice, setNotice] = useState<{ tone: "good" | "bad" | "info"; text: string } | null>(null);

  const { data: plan } = useQuery({ queryKey: ["plan"], queryFn: api.plan });
  const { data: payments } = useQuery({
    queryKey: ["payments"],
    queryFn: api.payments,
    enabled: Boolean(user),
  });

  useEffect(() => {
    if (!isLoading && !user) navigate("/login");
  }, [isLoading, user, navigate]);

  // Returning from OPay. The redirect proves nothing - anyone can load this URL -
  // so the payment is confirmed by asking the server, which asks OPay.
  useEffect(() => {
    if (!user) return;
    const params = new URLSearchParams(window.location.search);
    const outcome = params.get("payment");
    if (!outcome) return;

    const reference = readPendingReference();
    window.history.replaceState({}, "", "/account");

    if (outcome === "cancelled") {
      setNotice({ tone: "info", text: "Payment cancelled. You have not been charged." });
      return;
    }
    if (!reference) return;

    setVerifying(true);
    api
      .verifyPayment(reference)
      .then((result) => {
        if (result.status === "success") {
          try { localStorage.removeItem(PENDING_REFERENCE_KEY); } catch { /* ignore */ }
          setNotice({ tone: "good", text: "Payment confirmed — your subscription is active." });
        } else if (result.status === "amount_mismatch") {
          setNotice({ tone: "bad", text: "The amount paid did not match. Contact support with your reference." });
        } else if (result.status === "fail" || result.status === "close") {
          setNotice({ tone: "bad", text: "The payment did not go through. You have not been charged." });
        } else {
          setNotice({ tone: "info", text: "Payment is still processing. Refresh in a minute." });
        }
        queryClient.invalidateQueries();
      })
      .catch((error: Error) => setNotice({ tone: "bad", text: error.message }))
      .finally(() => setVerifying(false));
  }, [user, location, queryClient]);

  const subscribe = async () => {
    setPaying(true);
    setNotice(null);
    try {
      const { reference, checkout_url } = await api.checkout();
      try { localStorage.setItem(PENDING_REFERENCE_KEY, reference); } catch { /* ignore */ }
      window.location.assign(checkout_url);
    } catch (error) {
      const message = error instanceof ApiError && error.status === 503
        ? "Payments are not available yet. Please check back soon."
        : (error as Error).message;
      setNotice({ tone: "bad", text: message });
      setPaying(false);
    }
  };

  if (isLoading || !user) {
    return (
      <Layout>
        <Skeleton className="h-64 w-full max-w-2xl rounded-lg" />
      </Layout>
    );
  }

  const sub = user.subscription;

  return (
    <Layout>
      <div className="mx-auto max-w-2xl space-y-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Hi, {user.name.split(" ")[0]}</h1>
            <p className="text-sm text-muted-foreground">{user.email}</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => { signOut(); navigate("/"); }}>
            <LogOut className="mr-1.5 h-3.5 w-3.5" />
            Sign out
          </Button>
        </div>

        {verifying && (
          <Card className="flex items-center gap-2 border-border/40 bg-card/40 p-4 text-sm">
            <Loader2 className="h-4 w-4 animate-spin" />
            Confirming your payment with OPay…
          </Card>
        )}

        {notice && (
          <Card className={
            notice.tone === "good" ? "border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-300"
              : notice.tone === "bad" ? "border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive"
              : "border-border/40 bg-card/40 p-4 text-sm text-muted-foreground"
          }>
            {notice.text}
          </Card>
        )}

        <Card className="border-border/40 bg-card/50 p-6">
          {sub.active ? (
            <>
              <div className="mb-3 flex items-center gap-2 text-emerald-400">
                <CheckCircle2 className="h-5 w-5" />
                <h2 className="font-bold">{sub.staff ? "Staff access" : "Subscription active"}</h2>
              </div>
              {!sub.staff && sub.expires_at && (
                <p className="mb-4 text-sm text-muted-foreground">
                  Renews manually · access until{" "}
                  <span className="font-semibold text-foreground">
                    {format(new Date(sub.expires_at), "d MMMM yyyy")}
                  </span>{" "}
                  ({sub.days_left} {sub.days_left === 1 ? "day" : "days"} left)
                </p>
              )}
              <div className="flex flex-wrap gap-2">
                <Button asChild>
                  <Link href="/slips"><Ticket className="mr-1.5 h-4 w-4" />See today's codes</Link>
                </Button>
                {!sub.staff && (
                  <Button variant="outline" onClick={subscribe} disabled={paying || !plan?.payments_enabled}>
                    {paying ? "Opening OPay…" : `Extend 30 days · ${naira(sub.price_naira)}`}
                  </Button>
                )}
              </div>
              {!sub.staff && (
                <p className="mt-3 text-[11px] text-muted-foreground">
                  Extending early adds 30 days on top of the time you already have.
                </p>
              )}
            </>
          ) : (
            <>
              <div className="mb-2 flex items-center gap-2">
                <Clock className="h-5 w-5 text-muted-foreground" />
                <h2 className="font-bold">No active subscription</h2>
              </div>
              <p className="mb-5 text-sm text-muted-foreground">
                Subscribe to see the booking codes for each day's slips, and load them straight
                into your betslip.
              </p>
              <div className="mb-4 flex items-baseline gap-2">
                <span className="text-3xl font-bold">{plan ? naira(plan.price_naira) : "—"}</span>
                <span className="text-sm text-muted-foreground">/ {plan?.period_days ?? 30} days</span>
              </div>
              <Button onClick={subscribe} disabled={paying || !plan?.payments_enabled} className="w-full sm:w-auto">
                <CreditCard className="mr-1.5 h-4 w-4" />
                {paying ? "Opening OPay…" : "Pay with OPay"}
              </Button>
              {plan && !plan.payments_enabled && (
                <p className="mt-3 flex items-center gap-1.5 text-xs text-amber-400">
                  <ShieldAlert className="h-3.5 w-3.5" />
                  Payments are not available yet.
                </p>
              )}
              <p className="mt-4 text-[11px] leading-relaxed text-muted-foreground">
                One-off payment for 30 days — it does not renew automatically. Codes are the
                operator's own selections, not guaranteed winners.
              </p>
            </>
          )}
        </Card>

        {payments && payments.length > 0 && (
          <Card className="border-border/40 bg-card/50 p-5">
            <h3 className="mb-3 font-mono text-xs uppercase tracking-wider text-muted-foreground">
              Payment history
            </h3>
            <ul className="divide-y divide-border/30 text-sm">
              {payments.map((payment) => (
                <li key={payment.reference} className="flex items-center justify-between gap-3 py-2">
                  <div className="min-w-0">
                    <p className="font-mono text-xs">{payment.reference}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {format(new Date(payment.created_at), "d MMM yyyy, HH:mm")}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="font-semibold">{naira(payment.amount_naira)}</p>
                    <p className={payment.status === "success" ? "text-[11px] text-emerald-400" : "text-[11px] text-muted-foreground"}>
                      {payment.status}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </Card>
        )}
      </div>
    </Layout>
  );
}
