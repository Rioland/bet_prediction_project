import { addDays, format, isSameDay, startOfDay } from "date-fns";
import { cn } from "@/lib/utils";

interface DateStripProps {
  selected: Date;
  onSelect: (date: Date) => void;
  /** Days shown either side of today. */
  back?: number;
  forward?: number;
}

function labelFor(date: Date, today: Date): string {
  const diff = Math.round((startOfDay(date).getTime() - startOfDay(today).getTime()) / 86400000);
  if (diff === 0) return "Today";
  if (diff === -1) return "Yesterday";
  if (diff === 1) return "Tomorrow";
  return format(date, "EEE");
}

export function DateStrip({ selected, onSelect, back = 3, forward = 3 }: DateStripProps) {
  const today = new Date();
  const days = Array.from({ length: back + forward + 1 }, (_, i) => addDays(today, i - back));

  return (
    <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 md:mx-0 md:px-0">
      {days.map((day) => {
        const active = isSameDay(day, selected);
        return (
          <button
            key={day.toISOString()}
            onClick={() => onSelect(day)}
            aria-current={active ? "date" : undefined}
            className={cn(
              "flex flex-col items-center shrink-0 min-w-[4.5rem] rounded-md border px-3 py-2 transition-colors",
              "font-mono text-xs uppercase tracking-wide",
              active
                ? "border-primary/60 bg-primary/10 text-primary"
                : "border-border/50 bg-card/40 text-muted-foreground hover:border-border hover:text-foreground",
            )}
          >
            <span className="font-semibold">{labelFor(day, today)}</span>
            <span className="text-[11px] opacity-80">{format(day, "d MMM")}</span>
          </button>
        );
      })}
    </div>
  );
}
