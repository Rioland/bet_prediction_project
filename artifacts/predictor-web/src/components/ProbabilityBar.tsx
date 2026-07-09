import { Progress } from "@/components/ui/progress";
import { formatPercent } from "@/lib/utils";

interface ProbabilityBarProps {
  label: string;
  probability: number;
  colorClass?: string;
  isWinner?: boolean;
}

export function ProbabilityBar({ label, probability, colorClass = "bg-primary", isWinner }: ProbabilityBarProps) {
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-xs font-mono">
        <span className="text-muted-foreground">{label}</span>
        <span className={`font-bold ${isWinner ? 'text-primary drop-shadow-[0_0_5px_rgba(0,255,150,0.5)]' : ''}`}>
          {formatPercent(probability)}
        </span>
      </div>
      <Progress 
        value={probability * 100} 
        className="h-2 bg-secondary/50" 
        indicatorClassName={colorClass} 
      />
    </div>
  );
}
