import React, { useState } from "react";
import { ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, radius, spacing } from "@/theme/colors";
import { mockShipment } from "@/data/mockData";
import { Avatar } from "@/components/Avatar";

export function TrackingScreen() {
  const [code, setCode] = useState(mockShipment.trackingCode);
  // TODO: remplacer par un appel API qui cherche l'envoi correspondant
  // au code saisi. Pour l'instant on affiche toujours la donnée de démo.
  const shipment = mockShipment;

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.headerRow}>
        <Ionicons name="arrow-back" size={20} color={colors.textSecondary} />
        <Text style={styles.headerTitle}>Suivi de colis</Text>
        <View style={{ width: 20 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.searchBar}>
          <Ionicons name="qr-code-outline" size={18} color={colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Code de suivi"
            placeholderTextColor={colors.textMuted}
            value={code}
            onChangeText={setCode}
            autoCapitalize="characters"
          />
        </View>

        <View style={styles.agenceRow}>
          <Avatar initials={shipment.agence.initials} colorKey={shipment.agence.colorKey} size={40} />
          <View style={{ flex: 1 }}>
            <Text style={styles.agenceName}>{shipment.agence.name}</Text>
            <Text style={styles.agenceMeta}>{shipment.nbColis} colis · code {shipment.trackingCode}</Text>
          </View>
        </View>

        <View style={styles.routeRow}>
          <View style={styles.routePoint}>
            <Text style={styles.routeLabel}>Origine</Text>
            <Text style={styles.routeValue}>{shipment.origine}</Text>
          </View>
          <Ionicons name="arrow-forward" size={16} color={colors.textMuted} />
          <View style={styles.routePoint}>
            <Text style={styles.routeLabel}>Destination</Text>
            <Text style={styles.routeValue}>{shipment.destination}</Text>
          </View>
        </View>

        <Text style={styles.timelineTitle}>Statut de l'envoi</Text>

        <View style={styles.timeline}>
          {shipment.steps.map((step, index) => {
            const isLast = index === shipment.steps.length - 1;
            return (
              <View key={step.status} style={styles.timelineRow}>
                <View style={styles.timelineIndicator}>
                  <View style={[styles.timelineDot, step.done && styles.timelineDotDone]}>
                    {step.done && <Ionicons name="checkmark" size={12} color={colors.onAccent} />}
                  </View>
                  {!isLast && (
                    <View style={[styles.timelineLine, step.done && styles.timelineLineDone]} />
                  )}
                </View>
                <View style={{ flex: 1, paddingBottom: isLast ? 0 : spacing.lg }}>
                  <Text
                    style={[styles.timelineLabel, step.done && styles.timelineLabelDone]}
                  >
                    {step.label}
                  </Text>
                  <Text style={styles.timelineDate}>{step.date}</Text>
                </View>
              </View>
            );
          })}
        </View>

        <View style={styles.notifNote}>
          <Ionicons name="mail-outline" size={16} color={colors.textSecondary} />
          <Text style={styles.notifText}>
            Tu recevras un email dès que ce colis arrivera à destination.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  headerTitle: { fontSize: 16, fontWeight: "600", color: colors.textPrimary },
  content: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xl },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    backgroundColor: colors.surface,
    marginBottom: spacing.lg,
  },
  searchInput: { flex: 1, fontSize: 14, color: colors.textPrimary, padding: 0 },
  agenceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  agenceName: { fontSize: 14, fontWeight: "600", color: colors.textPrimary },
  agenceMeta: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  routeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  routePoint: { flex: 1 },
  routeLabel: { fontSize: 11, color: colors.textMuted },
  routeValue: { fontSize: 14, fontWeight: "600", color: colors.textPrimary, marginTop: 2 },
  timelineTitle: { fontSize: 13, fontWeight: "600", color: colors.textPrimary, marginBottom: spacing.md },
  timeline: { marginBottom: spacing.lg },
  timelineRow: { flexDirection: "row" },
  timelineIndicator: { alignItems: "center", marginRight: spacing.md },
  timelineDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: colors.borderStrong,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
  },
  timelineDotDone: { backgroundColor: colors.accent, borderColor: colors.accent },
  timelineLine: { width: 2, flex: 1, backgroundColor: colors.border, marginVertical: 4 },
  timelineLineDone: { backgroundColor: colors.accent },
  timelineLabel: { fontSize: 14, color: colors.textMuted },
  timelineLabelDone: { color: colors.textPrimary, fontWeight: "600" },
  timelineDate: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  notifNote: {
    flexDirection: "row",
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.sm,
    padding: spacing.md,
  },
  notifText: { flex: 1, fontSize: 12, color: colors.textSecondary, lineHeight: 17 },
});