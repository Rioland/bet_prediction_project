import { Image, Text, View } from "react-native";

import { kickoffTime, type Match, teamName } from "@/types/api";

function TeamBadge({ name, logo }: { name: string; logo?: string | null }) {
  return (
    <View className="flex-1 items-center">
      {logo ? (
        <Image source={{ uri: logo }} className="h-10 w-10" resizeMode="contain" />
      ) : (
        <View className="h-10 w-10 items-center justify-center rounded-full bg-slate-200 dark:bg-ink-700">
          <Text className="font-bold text-slate-600 dark:text-slate-300">{name.slice(0, 1)}</Text>
        </View>
      )}
      <Text
        numberOfLines={1}
        className="mt-1 text-center text-xs font-medium text-ink dark:text-white"
      >
        {name}
      </Text>
    </View>
  );
}

export function MatchHeader({ match }: { match: Match }) {
  const isLive = match.status === "live";
  const hasScore = match.home_score != null && match.away_score != null;

  return (
    <View>
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center">
          {match.league_logo ? (
            <Image source={{ uri: match.league_logo }} className="h-4 w-4" resizeMode="contain" />
          ) : null}
          <Text className="ml-1 text-xs uppercase text-slate-500">{match.league_name ?? "League"}</Text>
        </View>
        {isLive ? (
          <View className="flex-row items-center">
            <View className="mr-1 h-2 w-2 rounded-full bg-red-500" />
            <Text className="text-xs font-semibold text-red-500">
              LIVE{match.elapsed != null ? ` ${match.elapsed}'` : ""}
            </Text>
          </View>
        ) : (
          <Text className="text-xs text-slate-500">{kickoffTime(match.kickoff_time)}</Text>
        )}
      </View>

      <View className="mt-3 flex-row items-center">
        <TeamBadge name={teamName(match, "home")} logo={match.home_team_logo} />
        <View className="px-2">
          {hasScore ? (
            <Text className="text-xl font-extrabold text-ink dark:text-white">
              {match.home_score} - {match.away_score}
            </Text>
          ) : (
            <Text className="text-sm font-semibold text-slate-400">vs</Text>
          )}
        </View>
        <TeamBadge name={teamName(match, "away")} logo={match.away_team_logo} />
      </View>
    </View>
  );
}
