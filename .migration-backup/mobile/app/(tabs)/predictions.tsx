import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { ActivityIndicator, FlatList, Pressable, Text, View } from "react-native";

import api from "@/api/client";
import { BrandHeader } from "@/components/BrandHeader";
import { PredictionCard } from "@/components/PredictionCard";
import { Screen } from "@/components/Screen";
import { API_URL } from "@/lib/api-url";
import { colors } from "@/theme";
import type { PredictionCard as PredictionCardType } from "@/types/api";

export default function PredictionsScreen() {
  const router = useRouter();
  const { data, isLoading, isError, refetch, isRefetching } = useQuery({
    queryKey: ["predictions", "cards", "today"],
    queryFn: async () => (await api.get<PredictionCardType[]>("/predictions/cards/today")).data,
  });

  return (
    <Screen>
      <BrandHeader title="AI Predictions" subtitle="Powered by machine learning" />
      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={colors.brand} />
          <Text className="mt-3 text-slate-500">Loading predictions…</Text>
        </View>
      ) : isError ? (
        <View className="flex-1 items-center justify-center p-6">
          <Ionicons name="cloud-offline-outline" size={48} color={colors.muted} />
          <Text className="mt-4 text-center text-lg font-semibold text-ink dark:text-white">
            Could not load predictions
          </Text>
          <Text className="mt-1 text-center text-xs text-slate-500">{API_URL}</Text>
          <Pressable className="mt-6 rounded-xl bg-brand px-6 py-3" onPress={() => void refetch()}>
            <Text className="font-semibold text-white">Retry</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 24 }}
          data={data ?? []}
          keyExtractor={(item) => String(item.match.id)}
          onRefresh={() => void refetch()}
          refreshing={isRefetching}
          ListEmptyComponent={
            <View className="mt-16 items-center">
              <Ionicons name="sparkles-outline" size={48} color={colors.muted} />
              <Text className="mt-3 text-slate-500">No predictions for today yet.</Text>
            </View>
          }
          renderItem={({ item }) => (
            <Pressable onPress={() => router.push(`/match/${item.match.id}`)}>
              <PredictionCard card={item} />
            </Pressable>
          )}
        />
      )}
    </Screen>
  );
}
