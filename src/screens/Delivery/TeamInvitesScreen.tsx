import React, { useCallback, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { colors, radius, spacing } from "@/theme/colors";
import { RootStackParamList } from "@/navigation/types";
import { ApiTeamInvite, getMyTeamInvites, respondToTeamInvite } from "../../services/deliveryTeam.service";
import { ApiRequestError } from "../../services/api";

type Nav = NativeStackNavigationProp<RootStackParamList>;

export function TeamInvitesScreen() {
  const navigation = useNavigation<Nav>();
  const [invites, setInvites] = useState<ApiTeamInvite[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [respondingId, setRespondingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getMyTeamInvites();
      setInvites(data);
    } catch (err: unknown) {
      setError(err instanceof ApiRequestError ? err.message : "Erreur de chargement");
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  async function handleRespond(id: string, accept: boolean) {
    setRespondingId(id);
    try {
      await respondToTeamInvite(id, accept);
      await load();
    } catch {
      // en cas d'échec, l'invitation reste visible pour réessayer
    } finally {
      setRespondingId(null);
    }
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.headerRow}>
        <Ionicons name="arrow-back" size={20} color={colors.textSecondary} onPress={() => navigation.goBack()} />
        <Text style={styles.headerTitle}>Invitations d'équipe</Text>
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
          data={invites}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.centerBox}>
              <Text style={styles.emptyText}>Aucune invitation en attente.</Text>
            </View>
          }
          renderItem={({ item }) => {
            const policy = (item.espace.details?.workPolicy as string) ?? null;
            return (
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <Ionicons name="car-outline" size={18} color={colors.accent} />
                  <Text style={styles.agencyName}>{item.espace.name}</Text>
                </View>
                {policy && (
                  <View style={styles.policyBox}>
                    <Text style={styles.policyLabel}>Politique de travail</Text>
                    <Text style={styles.policyText}>{policy}</Text>
                  </View>
                )}
                <View style={styles.actionsRow}>
                  <Pressable
                    style={styles.acceptButton}
                    onPress={() => handleRespond(item.id, true)}
                    disabled={respondingId === item.id}
                  >
                    <Text style={styles.acceptButtonText}>
                      {respondingId === item.id ? "..." : "Accepter"}
                    </Text>
                  </Pressable>
                  <Pressable
                    style={styles.declineButton}
                    onPress={() => handleRespond(item.id, false)}
                    disabled={respondingId === item.id}
                  >
                    <Text style={styles.declineButtonText}>Refuser</Text>
                  </Pressable>
                </View>
              </View>
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
    marginBottom: spacing.md,
  },
  cardHeader: { flexDirection: "row", alignItems: "center", gap: spacing.sm, marginBottom: spacing.sm },
  agencyName: { fontSize: 15, fontWeight: "600", color: colors.textPrimary },
  policyBox: { backgroundColor: colors.surface, borderRadius: radius.sm, padding: spacing.sm, marginBottom: spacing.md },
  policyLabel: { fontSize: 10, color: colors.textMuted, fontWeight: "600", marginBottom: 2 },
  policyText: { fontSize: 12, color: colors.textPrimary, lineHeight: 17 },
  actionsRow: { flexDirection: "row", gap: spacing.sm },
  acceptButton: {
    flex: 1,
    backgroundColor: colors.accent,
    borderRadius: radius.sm,
    paddingVertical: 10,
    alignItems: "center",
  },
  acceptButtonText: { fontSize: 13, fontWeight: "600", color: colors.onAccent },
  declineButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.danger,
    borderRadius: radius.sm,
    paddingVertical: 10,
    alignItems: "center",
  },
  declineButtonText: { fontSize: 13, fontWeight: "600", color: colors.danger },
});