import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { colors, radius, spacing } from "@/theme/colors";
import { BadgeLevel } from "@/types";

const levelLabel: Record<BadgeLevel, string> = {
  bronze: "Bronze",
  argent: "Argent",
  or: "Or",
};

interface BadgeProps {
  level?: BadgeLevel;
  label?: string;
}

// Un seul badge à la fois : soit un niveau (Bronze/Argent/Or), soit un
// badge thématique (ex: "Livraison rapide"). Les deux peuvent être
// affichés côte à côte dans un écran, mais ce composant reste simple.
export function Badge({ level, label }: BadgeProps) {
  if (level) {
    return (
      <View style={[styles.pill, { backgroundColor: colors.warningBg }]}>
        <Text style={[styles.text, { color: colors.warning }]}>{levelLabel[level]}</Text>
      </View>
    );
  }
  if (label) {
    return (
      <View style={[styles.pill, { backgroundColor: colors.secondaryBg }]}>
        <Text style={[styles.text, { color: colors.secondary }]}>{label}</Text>
      </View>
    );
  }
  return null;
}

const styles = StyleSheet.create({
  pill: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  text: {
    fontSize: 10,
    fontWeight: "600",
  },
});
