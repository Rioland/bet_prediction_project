import { type ReactNode } from "react";
import { View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type ScreenProps = {
  children: ReactNode;
  /** Apply safe-area to bottom too (use on non-tab screens). */
  edges?: ("top" | "bottom" | "left" | "right")[];
};

export function Screen({ children, edges = ["top"] }: ScreenProps) {
  return (
    <SafeAreaView edges={edges} className="flex-1 bg-white dark:bg-ink">
      <View className="flex-1 px-4 pt-2">{children}</View>
    </SafeAreaView>
  );
}
