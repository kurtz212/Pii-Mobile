import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { colors } from "@/theme/colors";

const colorMap: Record<string, { bg: string; fg: string }> = {
  teal: { bg: colors.tealBg, fg: colors.teal },
  coral: { bg: colors.coralBg, fg: colors.coral },
  purple: { bg: colors.purpleBg, fg: colors.purple },
  gray: { bg: colors.surface, fg: colors.textSecondary },
};

interface AvatarProps {
  initials: string;
  colorKey?: string;
  size?: number;
}

export function Avatar({ initials, colorKey = "gray", size = 44 }: AvatarProps) {
  const palette = colorMap[colorKey] ?? colorMap.gray;
  return (
    <View
      style={[
        styles.circle,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: palette.bg,
        },
      ]}
    >
      <Text style={[styles.text, { color: palette.fg, fontSize: size * 0.32 }]}>{initials}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  circle: {
    alignItems: "center",
    justifyContent: "center",
  },
  text: {
    fontWeight: "600",
  },
});
