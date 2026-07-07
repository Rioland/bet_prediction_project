import { Ionicons } from "@expo/vector-icons";
import { ScrollView, Text, View } from "react-native";

import { BrandHeader } from "@/components/BrandHeader";
import { Screen } from "@/components/Screen";
import { colors } from "@/theme";

type Row = { icon: keyof typeof Ionicons.glyphMap; label: string; value: string };

const rows: Row[] = [
  { icon: "star", label: "Plan", value: "Free" },
  { icon: "trophy", label: "Access", value: "All leagues & predictions" },
  { icon: "notifications", label: "Alerts", value: "Match & goal updates" },
  { icon: "shield-checkmark", label: "Account", value: "No sign-in required" },
];

const features = [
  "Today's & live matches across world competitions",
  "AI match-winner, Over/Under, BTTS & correct score",
  "Win probability and expected goals (xG)",
];

export default function ProfileScreen() {
  return (
    <Screen>
      <BrandHeader title="Profile" subtitle="Football AI Predictor" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
        <View className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-ink-700 dark:bg-ink-800">
          {rows.map((row, idx) => (
            <View
              key={row.label}
              className={`flex-row items-center py-3 ${
                idx < rows.length - 1 ? "border-b border-slate-100 dark:border-ink-700" : ""
              }`}
            >
              <View className="h-9 w-9 items-center justify-center rounded-full bg-brand-50 dark:bg-ink-700">
                <Ionicons name={row.icon} size={18} color={colors.brand} />
              </View>
              <Text className="ml-3 flex-1 text-slate-500">{row.label}</Text>
              <Text className="font-semibold text-ink dark:text-white">{row.value}</Text>
            </View>
          ))}
        </View>

        <View className="mt-4 rounded-2xl bg-brand-50 p-4 dark:bg-ink-800">
          <Text className="mb-2 text-xs font-bold uppercase text-brand-700 dark:text-brand-400">
            What you get
          </Text>
          {features.map((f) => (
            <View key={f} className="mb-2 flex-row items-start">
              <Ionicons name="checkmark-circle" size={18} color={colors.brand} />
              <Text className="ml-2 flex-1 text-ink dark:text-slate-200">{f}</Text>
            </View>
          ))}
        </View>

        <Text className="mt-6 text-center text-xs text-slate-400">Version 1.0.0</Text>
      </ScrollView>
    </Screen>
  );
}
