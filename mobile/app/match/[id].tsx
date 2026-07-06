import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";

import api from "@/api/client";
import { MatchHeader } from "@/components/MatchHeader";
import { Screen } from "@/components/Screen";
import { colors } from "@/theme";
import { type Match, type MatchPrediction, winnerText } from "@/types/api";

function ProbBar({ label, value }: { label: string; value: number }) {
  return (
    <View className="mb-3">
      <View className="flex-row justify-between">
        <Text className="text-sm text-ink dark:text-white">{label}</Text>
        <Text className="text-sm font-semibold text-ink dark:text-white">
          {Math.round(value * 100)}%
        </Text>
      </View>
      <View className="mt-1 h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-ink-700">
        <View
          className="h-2 rounded-full bg-brand"
          style={{ width: `${Math.max(Math.round(value * 100), 2)}%` }}
        />
      </View>
    </View>
  );
}

function StatBox({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-1 rounded-2xl border border-slate-200 p-4 dark:border-ink-700">
      <Text className="text-xs uppercase text-slate-500">{label}</Text>
      <Text className="mt-1 text-lg font-bold text-ink dark:text-white">{value}</Text>
    </View>
  );
}

export default function MatchDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const matchQuery = useQuery({
    queryKey: ["match", id],
    queryFn: async () => (await api.get<Match>(`/matches/${id}`)).data,
    enabled: Boolean(id),
  });
  const predQuery = useQuery({
    queryKey: ["match-prediction", id],
    queryFn: async () => (await api.get<MatchPrediction>(`/predictions/match/${id}`)).data,
    enabled: Boolean(id),
  });

  const match = matchQuery.data;
  const pred = predQuery.data;

  return (
    <Screen edges={["top", "bottom"]}>
      <Pressable className="mb-2 flex-row items-center" onPress={() => router.back()}>
        <Ionicons name="chevron-back" size={22} color={colors.brand} />
        <Text className="text-base font-semibold text-brand">Back</Text>
      </Pressable>

      {matchQuery.isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={colors.brand} />
        </View>
      ) : matchQuery.isError || !match ? (
        <View className="flex-1 items-center justify-center">
          <Text className="text-red-600">Match not found.</Text>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
          <View className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-ink-700 dark:bg-ink-800">
            <MatchHeader match={match} />
          </View>

          {pred ? (
            <>
              <View className="mt-4 rounded-2xl bg-brand p-4">
                <Text className="text-xs uppercase text-white/80">Predicted Result</Text>
                <Text className="mt-1 text-2xl font-extrabold text-white">
                  {winnerText(pred.winner.label)}
                </Text>
                <Text className="text-white/90">
                  Confidence {Math.round(pred.winner.confidence)}%
                </Text>
              </View>

              <View className="mt-4 rounded-2xl border border-slate-200 p-4 dark:border-ink-700">
                <Text className="mb-3 font-bold text-ink dark:text-white">Win Probability</Text>
                <ProbBar label="Home Win" value={pred.winner.probabilities.home_win ?? 0} />
                <ProbBar label="Draw" value={pred.winner.probabilities.draw ?? 0} />
                <ProbBar label="Away Win" value={pred.winner.probabilities.away_win ?? 0} />
              </View>

              <View className="mt-4 flex-row gap-3">
                <StatBox
                  label="Over/Under 2.5"
                  value={pred.over_under_2_5.over >= pred.over_under_2_5.under ? "Over" : "Under"}
                />
                <StatBox label="BTTS" value={pred.btts.yes >= pred.btts.no ? "Yes" : "No"} />
              </View>
              <View className="mt-3 flex-row gap-3">
                <StatBox label="Correct Score" value={pred.correct_score.score} />
                <StatBox label="Expected Goals" value={`${pred.home_xg} : ${pred.away_xg}`} />
              </View>
            </>
          ) : predQuery.isLoading ? (
            <ActivityIndicator className="mt-6" color={colors.brand} />
          ) : (
            <Text className="mt-6 text-center text-slate-500">
              Prediction unavailable for this match.
            </Text>
          )}
        </ScrollView>
      )}
    </Screen>
  );
}
