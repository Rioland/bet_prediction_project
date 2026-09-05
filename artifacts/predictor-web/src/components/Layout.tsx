import { Link, useLocation } from "wouter";
import { Activity } from "lucide-react";
import { cn } from "@/lib/utils";

// Short labels keep all four items on screen at 375px without a cut-off.
const NAV = [
  { href: "/", label: "Predictions", short: "Tips" },
  { href: "/results", label: "Results", short: "Results" },
  { href: "/vip", label: "VIP", short: "VIP" },
  { href: "/news", label: "Analysis", short: "News" },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background text-foreground dark">
      <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 items-center justify-between gap-3 px-4">
          <Link
            href="/"
            className="flex shrink-0 items-center gap-2 text-primary transition-opacity hover:opacity-80"
          >
            <Activity className="h-5 w-5 shrink-0" />
            <span className="whitespace-nowrap text-base font-bold uppercase tracking-tight sm:text-lg">
              Football AI
              {/* The suffix is the first thing to go when space is tight. */}
              <span className="hidden text-foreground sm:inline">/Predictor</span>
            </span>
          </Link>
          <nav className="-mx-1 flex items-center gap-0.5 overflow-x-auto px-1 sm:gap-3">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "shrink-0 whitespace-nowrap rounded-sm px-1.5 py-1 font-mono text-[11px] uppercase tracking-wider transition-colors sm:px-2 sm:text-sm",
                  location === item.href
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <span className="sm:hidden">{item.short}</span>
                <span className="hidden sm:inline">{item.label}</span>
              </Link>
            ))}
          </nav>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-8">
        {children}
      </main>

      <footer className="border-t border-border/50 bg-muted/20 py-8 mt-auto">
        <div className="container mx-auto px-4 text-center sm:text-left flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs text-muted-foreground font-mono space-y-1">
            <p>FOOTBALL AI PREDICTOR // DATA-DRIVEN SPORTS FORECASTING</p>
            <p className="opacity-70 max-w-2xl">
              18+. Predictions are calibrated statistical estimates, not guaranteed
              outcomes: a pick rated 70% is expected to lose about three times in ten.
              Betting loses money for most people who do it. Never stake more than you
              can afford to lose. Gambling support: begambleaware.org
            </p>
          </div>
          <div className="text-xs text-muted-foreground font-mono">
            v1.0.0
          </div>
        </div>
      </footer>
    </div>
  );
}
