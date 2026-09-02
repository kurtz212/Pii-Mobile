import React, { useCallback, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { colors, radius, spacing } from "@/theme/colors";
import { RootStackParamList } from "@/navigation/types";
import { ApiTontine, getMyTontines, joinTontine } from "../../services/tontine.service";
import { ApiRequestError } from "../../services/api";

type Nav = NativeStackNavigationProp<RootStackParamList>;

const statusLabel: Record<string, string> = {
  draft: "En attente de participants",
  active: "En cours",
  completed: "Terminée",
  cancelled: "Annulée",
};

const statusColor: Record<string, { bg: string; fg: string }> = {
  draft: { bg: colors.secondaryBg, fg: colors.secondary },
  active: { bg: colors.accentBg, fg: colors.accent },
  completed: { bg: colors.surface, fg: colors.textSecondary },
  cancelled: { bg: colors.dangerBg, fg: colors.danger },
};

export function TontineListScreen() {
  const navigation = useNavigation<Nav>();
  const [tontines, setTontines] = useState<ApiTontine[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [joinCode, setJoinCode] = useState("");
  const [joining, setJoining] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      async function load() {
        setLoading(true);
        setError(null);
        try {
          const data = await getMyTontines();
          if (!cancelled) setTontines(data);
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

  async function handleJoinByCode() {
    if (!joinCode.trim() || joining) return;
    setJoining(true);
    setError(null);
    try {
      await joinTontine(joinCode.trim());
      setJoinCode("");
      navigation.navigate("TontineDetail", { tontineId: joinCode.trim() });
    } catch (err: unknown) {
      setError(err instanceof ApiRequestError ? err.message : "Code invalide ou tontine introuvable.");
    } finally {
      setJoining(false);
    }
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.headerRow}>
        <Ionicons name="arrow-back" size={20} color={colors.textSecondary} onPress={() => navigation.goBack()} />
        <Text style={styles.headerTitle}>Mes tontines</Text>
        <Ionicons
          name="add-circle-outline"
          size={22}
          color={colors.accent}
          onPress={() => navigation.navigate("CreerTontine")}
        />
      </View>

      <View style={styles.joinRow}>
        <TextInput
          style={styles.joinInput}
          placeholder="Coller un code de tontine reçu"
          placeholderTextColor={colors.textMuted}
          value={joinCode}
          onChangeText={setJoinCode}
          autoCapitalize="none"
        />
        <Pressable style={styles.joinButton} onPress={handleJoinByCode} disabled={joining}>
          <Text style={styles.joinButtonText}>{joining ? "..." : "Rejoindre"}</Text>
        </Pressable>
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
          data={tontines}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.centerBox}>
              <Text style={styles.emptyText}>
                Tu n'as encore aucune tontine. Crée-en une, ou rejoins-en une avec un code.
              </Text>
            </View>
          }
          renderItem={({ item }) => {
            const colorSet = statusColor[item.status];
            return (
              <Pressable
                style={styles.card}
                onPress={() => navigation.navigate("TontineDetail", { tontineId: item.id })}
              >
                <View style={styles.iconBox}>
                  <Ionicons name="cash-outline" size={18} color={colors.accent} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardName}>{item.name}</Text>
                  <Text style={styles.cardAmount}>
                    {Number(item.contributionAmount).toLocaleString("fr-FR")} F / tour ·{" "}
                    {item.maxParticipants} participants
                  </Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: colorSet.bg }]}>
                  <Text style={[styles.statusBadgeText, { color: colorSet.fg }]}>
                    {statusLabel[item.status]}
                  </Text>
                </View>
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
  joinRow: {
    flexDirection: "row",
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
  },
  joinInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    fontSize: 12,
    color: colors.textPrimary,
    backgroundColor: colors.surface,
  },
  joinButton: {
    backgroundColor: colors.accent,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    justifyContent: "center",
  },
  joinButtonText: { fontSize: 12, fontWeight: "600", color: colors.onAccent },
  centerBox: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: spacing.xl },
  errorText: { fontSize: 13, color: colors.danger },
  emptyText: { fontSize: 13, color: colors.textMuted, textAlign: "center", lineHeight: 19 },
  list: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: colors.accentBg,
    alignItems: "center",
    justifyContent: "center",
  },
  cardName: { fontSize: 14, fontWeight: "600", color: colors.textPrimary },
  cardAmount: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
  statusBadge: { paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: radius.sm },
  statusBadgeText: { fontSize: 10, fontWeight: "600" },
});