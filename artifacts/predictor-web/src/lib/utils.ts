import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPercent(value: number | undefined | null): string {
  if (value === undefined || value === null) return "0%";
  return `${Math.round(value * 100)}%`;
}

export function formatOdds(probability: number | undefined | null): string {
  if (!probability || probability <= 0) return "-";
  return (1 / probability).toFixed(2);
}

export function getConfidenceColor(confidence: number | undefined | null): string {
  if (!confidence) return "text-muted-foreground";
  if (confidence >= 0.7) return "text-emerald-400";
  if (confidence >= 0.5) return "text-amber-400";
  return "text-rose-400";
}

export function getConfidenceBg(confidence: number | undefined | null): string {
  if (!confidence) return "bg-muted text-muted-foreground";
  if (confidence >= 0.7) return "bg-emerald-400/10 text-emerald-400 border-emerald-400/20";
  if (confidence >= 0.5) return "bg-amber-400/10 text-amber-400 border-amber-400/20";
  return "bg-rose-400/10 text-rose-400 border-rose-400/20";
}
