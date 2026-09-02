import React, { useCallback, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { colors, radius, spacing } from "@/theme/colors";
import { RootStackParamList } from "@/navigation/types";
import { ApiQuoteRequest, getMyQuoteRequests } from "../../services/quote.service";
import { ApiRequestError } from "../../services/api";

type Nav = NativeStackNavigationProp<RootStackParamList>;

const statusLabel: Record<string, string> = {
  open: "En attente de réponses",
  accepted: "Devis accepté",
  cancelled: "Annulée",
  completed: "Terminé",
};

const statusColor: Record<string, { bg: string; fg: string }> = {
  open: { bg: colors.secondaryBg, fg: colors.secondary },
  accepted: { bg: colors.accentBg, fg: colors.accent },
  cancelled: { bg: colors.dangerBg, fg: colors.danger },
  completed: { bg: colors.surface, fg: colors.textSecondary },
};

function detailsSummary(request: ApiQuoteRequest): string {
  if (request.targetType === "agence_cargo") {
    const d = request.details as { originCountry?: string; destinationCountry?: string };
    return `${d.originCountry ?? "?"} → ${d.destinationCountry ?? "?"}`;
  }
  const d = request.details as { containerSize?: string; destinationZone?: string };
  return `${d.containerSize ?? "?"} vers ${d.destinationZone ?? "?"}`;
}

export function MyQuotesScreen() {
  const navigation = useNavigation<Nav>();
  const [requests, setRequests] = useState<ApiQuoteRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      async function load() {
        setLoading(true);
        setError(null);
        try {
          const data = await getMyQuoteRequests();
          if (!cancelled) setRequests(data);
        } catch (err: unknown) {
          if (!cancelled) setError(err instanceof ApiRequestError ? err.message : "Erreur de chargement");
        } finally {
          if (!cancelled) setLoading(false);
        }
      }
      load();
      return () => {
        cancelled = true;
      };
    }, []),
  );

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.headerRow}>
        <Ionicons name="arrow-back" size={20} color={colors.textSecondary} onPress={() => navigation.goBack()} />
        <Text style={styles.headerTitle}>Mes demandes de devis</Text>
        <View style={{ width: 20 }} />
      </View>

      {loading && (
        <View style={styles.centerBox}>
          <ActivityIndicator color={colors.accent} />
        </View>
      )}

      {!loading && error && (
        <View style={styles.centerBox}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {!loading && !error && (
        <FlatList
          data={requests}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.centerBox}>
              <Text style={styles.emptyText}>Aucune demande de devis pour l'instant.</Text>
            </View>
          }
          renderItem={({ item }) => {
            const colorSet = statusColor[item.status];
            return (
              <Pressable
                style={styles.card}
                onPress={() => navigation.navigate("QuoteRequestDetail", { requestId: item.id })}
              >
                <View style={styles.cardTop}>
                  <Text style={styles.cardType}>
                    {item.targetType === "agence_cargo" ? "Agence cargo" : "Transitaire"}
                  </Text>
                  <View style={[styles.statusBadge, { backgroundColor: colorSet.bg }]}>
                    <Text style={[styles.statusBadgeText, { color: colorSet.fg }]}>
                      {statusLabel[item.status]}
                    </Text>
                  </View>
                </View>
                <Text style={styles.cardSummary}>{detailsSummary(item)}</Text>
                <Text style={styles.cardScope}>
                  {item.targetEspaceIds === null
                    ? "Diffusé à toutes les agences"
                    : `${item.targetEspaceIds.length} agence(s) ciblée(s)`}
                </Text>
              </Pressable>
            );
          }}
        />
      )}
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
  centerBox: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: spacing.xl },
  errorText: { fontSize: 13, color: colors.danger },
  emptyText: { fontSize: 13, color: colors.textMuted, textAlign: "center" },
  list: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm },
  card: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  cardTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  cardType: { fontSize: 13, fontWeight: "600", color: colors.textPrimary },
  statusBadge: { paddingHorizontal: spacing.sm, paddingVertical: 3, borderRadius: radius.sm },
  statusBadgeText: { fontSize: 10, fontWeight: "600" },
  cardSummary: { fontSize: 13, color: colors.textPrimary, marginTop: 6, fontWeight: "600" },
  cardScope: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
});