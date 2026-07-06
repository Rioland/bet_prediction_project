import { Image, Text, View } from "react-native";

const LOGO = require("../../assets/icon.png");

type BrandHeaderProps = {
  title: string;
  subtitle?: string;
};

export function BrandHeader({ title, subtitle }: BrandHeaderProps) {
  return (
    <View className="mb-4 mt-2 flex-row items-center">
      <Image source={LOGO} className="h-11 w-11 rounded-xl" resizeMode="cover" />
      <View className="ml-3">
        <Text className="text-2xl font-extrabold text-ink dark:text-white">{title}</Text>
        {subtitle ? (
          <Text className="text-xs text-slate-500 dark:text-slate-400">{subtitle}</Text>
        ) : null}
      </View>
    </View>
  );
}
