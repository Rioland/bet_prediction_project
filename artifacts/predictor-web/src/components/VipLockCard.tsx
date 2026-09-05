import { Link } from "wouter";
import { Lock } from "lucide-react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";

/** Discloses that VIP picks exist and how many, without revealing them. */
export function VipLockCard({ count }: { count: number }) {
  if (count < 1) return null;

  return (
    <Card className="flex flex-col items-center justify-center border-dashed border-primary/30 bg-primary/5 p-6 text-center">
      <Lock className="mb-3 h-8 w-8 text-primary/70" />
      <h3 className="mb-1 text-sm font-bold uppercase tracking-wide">
        {count} VIP {count === 1 ? "pick" : "picks"} held back
      </h3>
      <p className="mb-4 max-w-xs text-xs leading-relaxed text-muted-foreground">
        These are the selections where the model disagrees most with the market.
        Every one is tracked against the real result.
      </p>
      <Button asChild size="sm" className="font-mono text-xs uppercase tracking-wider">
        <Link href="/vip">See VIP plans</Link>
      </Button>
    </Card>
  );
}
