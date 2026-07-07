import { Text, View } from "react-native";

import { MatchHeader } from "@/components/MatchHeader";
import { type PredictionCard as PredictionCardType, winnerText } from "@/types/api";

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <View className="flex-1 items-center rounded-xl bg-slate-50 px-2 py-2 dark:bg-ink-700">
      <Text className="text-[10px] uppercase text-slate-500">{label}</Text>
      <Text
        className={`mt-1 text-sm font-semibold ${
          accent ? "text-brand-600" : "text-ink dark:text-white"
        }`}
      >
        {value}
      </Text>
    </View>
  );
}

export function PredictionCard({ card }: { card: PredictionCardType }) {
  const pct = (n: number) => `${Math.round(n * 100)}%`;
  const overUnder = card.over_under.over >= card.over_under.under
    ? `Over (${pct(card.over_under.over)})`
    : `Under (${pct(card.over_under.under)})`;
  const btts = card.btts.yes >= card.btts.no ? `Yes (${pct(card.btts.yes)})` : `No (${pct(card.btts.no)})`;

  return (
    <View className="my-2 rounded-2xl border border-slate-200 bg-white p-4 dark:border-ink-700 dark:bg-ink-800">
      <MatchHeader match={card.match} />

      <View className="mt-4 rounded-xl bg-brand p-3">
        <Text className="text-xs uppercase text-white/80">Prediction</Text>
        <View className="mt-1 flex-row items-center justify-between">
          <Text className="text-lg font-extrabold text-white">{winnerText(card.winner_label)}</Text>
          <Text className="text-lg font-extrabold text-white">
            {Math.round(card.winner_confidence)}%
          </Text>
        </View>
      </View>

      <View className="mt-3 flex-row gap-2">
        <Stat label="Over/Under 2.5" value={overUnder} />
        <Stat label="BTTS" value={btts} />
      </View>

      <View className="mt-2 flex-row gap-2">
        <Stat label="Correct Score" value={card.correct_score.score} />
        <Stat
          label="Expected Goals"
          value={`${card.home_xg ?? "-"} : ${card.away_xg ?? "-"}`}
          accent
        />
      </View>
    </View>
  );
}
