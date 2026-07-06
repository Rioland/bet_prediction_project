import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { ActivityIndicator, FlatList, Pressable, Text, View } from "react-native";

import api from "@/api/client";
import { BrandHeader } from "@/components/BrandHeader";
import { MatchHeader } from "@/components/MatchHeader";
import { Screen } from "@/components/Screen";
import { API_URL } from "@/lib/api-url";
import { colors } from "@/theme";
import type { Match } from "@/types/api";

function ApiError({ onRetry }: { onRetry: () => void }) {
  return (
    <View className="flex-1 items-center justify-center p-6">
      <Ionicons name="cloud-offline-outline" size={48} color={colors.muted} />
      <Text className="mt-4 text-center text-lg font-semibold text-ink dark:text-white">
        Could not reach the server
      </Text>
      <Text className="mt-1 text-center text-xs text-slate-500">{API_URL}</Text>
      <Text className="mt-2 text-center text-slate-500">
        Free hosting can take up to a minute to wake up.
      </Text>
      <Pressable className="mt-6 rounded-xl bg-brand px-6 py-3" onPress={onRetry}>
        <Text className="font-semibold text-white">Retry</Text>
      </Pressable>
    </View>
  );
}

export default function HomeScreen() {
  const router = useRouter();
  const today = useQuery({
    queryKey: ["matches", "today"],
    queryFn: async () => (await api.get<Match[]>("/matches/today")).data,
  });
  const live = useQuery({
    queryKey: ["matches", "live"],
    queryFn: async () => (await api.get<Match[]>("/matches/live")).data,
  });

  const loading = today.isLoading || live.isLoading;
  const error = today.isError || live.isError;

  const sections = [
    { title: "Live Now", icon: "radio" as const, data: live.data ?? [] },
    { title: "Today's Matches", icon: "calendar" as const, data: today.data ?? [] },
  ].filter((s) => s.data.length > 0);

  return (
    <Screen>
      <BrandHeader title="Football AI" subtitle="Live scores & AI predictions" />
      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={colors.brand} />
          <Text className="mt-3 text-slate-500">Loading matches…</Text>
        </View>
      ) : error ? (
        <ApiError
          onRetry={() => {
            void today.refetch();
            void live.refetch();
          }}
        />
      ) : (
        <FlatList
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 24 }}
          data={sections}
          keyExtractor={(item) => item.title}
          onRefresh={() => {
            void today.refetch();
            void live.refetch();
          }}
          refreshing={today.isRefetching || live.isRefetching}
          ListEmptyComponent={
            <View className="mt-16 items-center">
              <Ionicons name="football-outline" size={48} color={colors.muted} />
              <Text className="mt-3 text-slate-500">No matches available yet.</Text>
            </View>
          }
          renderItem={({ item: section }) => (
            <View className="mb-5">
              <View className="mb-2 flex-row items-center">
                <Ionicons name={section.icon} size={16} color={colors.brand} />
                <Text className="ml-2 text-lg font-bold text-ink dark:text-white">
                  {section.title}
                </Text>
              </View>
              {section.data.map((match) => (
                <Pressable
                  key={match.id}
                  className="mb-2 rounded-2xl border border-slate-200 bg-white p-4 dark:border-ink-700 dark:bg-ink-800"
                  onPress={() => router.push(`/match/${match.id}`)}
                >
                  <MatchHeader match={match} />
                </Pressable>
              ))}
            </View>
          )}
        />
      )}
    </Screen>
  );
}
