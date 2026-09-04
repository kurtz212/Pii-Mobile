import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, radius, spacing } from "@/theme/colors";
import { ApiTrackingStep } from "../../services/delivery.service";

const STEP_ORDER = ["picked_up", "in_transit", "delivered"] as const;
const STEP_LABELS: Record<string, string> = {
  picked_up: "Colis récupéré",
  in_transit: "En route",
  delivered: "Livré",
};
const STEP_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  picked_up: "cube-outline",
  in_transit: "bicycle-outline",
  delivered: "checkmark-circle-outline",
};

export function TrackingTimeline({ steps }: { steps: ApiTrackingStep[] }) {
  const doneSteps = new Set(steps.map((s) => s.step));

  return (
    <View style={styles.container}>
      {STEP_ORDER.map((step, index) => {
        const done = doneSteps.has(step);
        const record = steps.find((s) => s.step === step);
        const isLast = index === STEP_ORDER.length - 1;
        return (
          <View key={step} style={styles.row}>
            <View style={styles.iconColumn}>
              <View style={[styles.dot, done && styles.dotDone]}>
                <Ionicons
                  name={STEP_ICONS[step]}
                  size={14}
                  color={done ? colors.onAccent : colors.textMuted}
                />
              </View>
              {!isLast && <View style={[styles.line, done && styles.lineDone]} />}
            </View>
            <View style={styles.textColumn}>
              <Text style={[styles.label, done && styles.labelDone]}>{STEP_LABELS[step]}</Text>
              {record && (
                <Text style={styles.time}>
                  {new Date(record.at).toLocaleString("fr-FR", {
                    day: "2-digit",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </Text>
              )}
              {record?.note && <Text style={styles.note}>{record.note}</Text>}
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingVertical: spacing.sm },
  row: { flexDirection: "row" },
  iconColumn: { alignItems: "center", width: 32 },
  dot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  dotDone: { backgroundColor: colors.accent },
  line: { width: 2, flex: 1, minHeight: 24, backgroundColor: colors.border },
  lineDone: { backgroundColor: colors.accent },
  textColumn: { flex: 1, paddingBottom: spacing.md, paddingLeft: spacing.sm },
  label: { fontSize: 13, color: colors.textMuted, fontWeight: "600" },
  labelDone: { color: colors.textPrimary },
  time: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
  note: { fontSize: 11, color: colors.textSecondary, marginTop: 2, fontStyle: "italic" },
});