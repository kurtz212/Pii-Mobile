import React, { useCallback, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Share, StyleSheet, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Clipboard from "expo-clipboard";
import { useFocusEffect, useNavigation, useRoute } from "@react-navigation/native";
import { NativeStackNavigationProp, NativeStackScreenProps } from "@react-navigation/native-stack";
import { colors, radius, spacing } from "@/theme/colors";
import { RootStackParamList } from "@/navigation/types";
import {
  ApiTontine,
  ApiTontineContribution,
  ApiTontineParticipant,
  getContributions,
  getTontine,
  getTontineParticipants,
  joinTontine,
  proposeOrder,
  updateContribution,
  validateCalendar,
} from "../../services/tontine.service";
import { getUserId } from "../../services/api";
import { ApiRequestError } from "../../services/api";

type Props = NativeStackScreenProps<RootStackParamList, "TontineDetail">;
type Nav = NativeStackNavigationProp<RootStackParamList>;

export function TontineDetailScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Props["route"]>();
  const { tontineId } = route.params;

  const [tontine, setTontine] = useState<ApiTontine | null>(null);
  const [participants, setParticipants] = useState<ApiTontineParticipant[]>([]);
  const [contributions, setContributions] = useState<ApiTontineContribution[]>([]);
  const [myUserId, setMyUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [orderInput, setOrderInput] = useState("");
  const [selectedRound, setSelectedRound] = useState(1);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const uid = await getUserId();
      const t = await getTontine(tontineId);
      const p = await getTontineParticipants(tontineId);
      setMyUserId(uid);
      setTontine(t);
      setParticipants(p);
      if (t.status === "active") {
        const c = await getContributions(tontineId);
        setContributions(c);
      }
    } catch (err: unknown) {
      setError(err instanceof ApiRequestError ? err.message : "Erreur de chargement");
    } finally {
      setLoading(false);
    }
  }, [tontineId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const isCreator = tontine?.creatorId === myUserId;
  const isMember = participants.some((p) => p.userId === myUserId);
  const isDraft = tontine?.status === "draft";
  const isActive = tontine?.status === "active";
  const isFull = tontine ? participants.length >= tontine.maxParticipants : false;

  async function handleJoin() {
    setBusy(true);
    try {
      await joinTontine(tontineId);
      await load();
    } catch (err: unknown) {
      setError(err instanceof ApiRequestError ? err.message : "Impossible de rejoindre.");
    } finally {
      setBusy(false);
    }
  }

  async function handleCopyCode() {
    await Clipboard.setStringAsync(tontineId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleShareCode() {
    try {
      await Share.share({
        message: `Rejoins ma tontine "${tontine?.name}" sur Pii ! Colle ce code dans "Mes tontines" pour me rejoindre : ${tontineId}`,
      });
    } catch {
      // l'utilisateur a annulé le partage, rien à faire
    }
  }

  async function handleProposeOrder() {
    const value = Number(orderInput);
    if (!value || value < 1) return;
    setBusy(true);
    try {
      await proposeOrder(tontineId, value);
      setOrderInput("");
      await load();
    } catch (err: unknown) {
      setError(err instanceof ApiRequestError ? err.message : "Impossible d'enregistrer ta proposition.");
    } finally {
      setBusy(false);
    }
  }

  async function handleValidate() {
    setBusy(true);
    try {
      const sorted = [...participants].sort((a, b) => {
        if (a.proposedOrder === null && b.proposedOrder === null) return 0;
        if (a.proposedOrder === null) return 1;
        if (b.proposedOrder === null) return -1;
        return a.proposedOrder - b.proposedOrder;
      });
      await validateCalendar(tontineId, sorted.map((p) => p.userId));
      await load();
    } catch (err: unknown) {
      setError(err instanceof ApiRequestError ? err.message : "Impossible de valider le calendrier.");
    } finally {
      setBusy(false);
    }
  }

  async function handleMarkPaid(contributionId: string) {
    try {
      await updateContribution(tontineId, contributionId, "paid");
      await load();
    } catch {
      // en cas d'échec on ne change rien
    }
  }

  async function handleMarkMissed(contributionId: string) {
    try {
      await updateContribution(tontineId, contributionId, "missed");
      await load();
    } catch {
      // en cas d'échec on ne change rien
    }
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.centerBox}>
          <ActivityIndicator color={colors.accent} />
        </View>
      </SafeAreaView>
    );
  }

  if (!tontine) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.headerRow}>
          <Ionicons name="arrow-back" size={20} color={colors.textSecondary} onPress={() => navigation.goBack()} />
        </View>
        <View style={styles.centerBox}>
          <Text style={styles.errorText}>{error ?? "Tontine introuvable"}</Text>
        </View>
      </SafeAreaView>
    );
  }

  const roundContributions = contributions.filter((c) => c.roundNumber === selectedRound);
  const totalRounds = tontine.maxParticipants;

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.headerRow}>
        <Ionicons name="arrow-back" size={20} color={colors.textSecondary} onPress={() => navigation.goBack()} />
        <Text style={styles.headerTitle}>{tontine.name}</Text>
        <View style={{ width: 20 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryAmount}>
            {Number(tontine.contributionAmount).toLocaleString("fr-FR")} F
          </Text>
          <Text style={styles.summarySub}>par tour · {tontine.maxParticipants} participants</Text>
          {tontine.description && <Text style={styles.summaryDesc}>{tontine.description}</Text>}
        </View>

        {isCreator && isDraft && (
          <View style={styles.shareCard}>
            <View style={{ flex: 1 }}>
              <Text style={styles.shareTitle}>Code à partager</Text>
              <Pressable onPress={handleCopyCode}>
                <Text style={styles.shareCode}>{tontineId}</Text>
              </Pressable>
              <Text style={styles.shareHint}>
                {copied ? "Copié !" : "Appuie sur le code pour le copier."}
              </Text>
            </View>
            <View style={styles.shareActions}>
              <Pressable style={styles.shareIconButton} onPress={handleCopyCode}>
                <Ionicons name="copy-outline" size={18} color={colors.accent} />
              </Pressable>
              <Pressable style={styles.shareIconButton} onPress={handleShareCode}>
                <Ionicons name="share-social-outline" size={18} color={colors.accent} />
              </Pressable>
            </View>
          </View>
        )}

        {error && <Text style={styles.errorText}>{error}</Text>}

        {!isMember && isDraft && !isFull && (
          <Pressable style={styles.primaryButton} onPress={handleJoin} disabled={busy}>
            <Text style={styles.primaryButtonText}>{busy ? "..." : "Rejoindre cette tontine"}</Text>
          </Pressable>
        )}

        {isDraft && (
          <>
            <Text style={styles.sectionTitle}>
              Participants ({participants.length}/{tontine.maxParticipants})
            </Text>
            {participants.map((p) => (
              <View key={p.id} style={styles.participantRow}>
                <Text style={styles.participantName}>{p.user.fullName}</Text>
                <Text style={styles.participantOrder}>
                  {p.proposedOrder ? `Propose : tour ${p.proposedOrder}` : "Pas encore de proposition"}
                </Text>
              </View>
            ))}

            {isMember && (
              <View style={styles.orderRow}>
                <TextInput
                  style={styles.orderInput}
                  placeholder="Ton tour souhaité (ex. 1)"
                  placeholderTextColor={colors.textMuted}
                  value={orderInput}
                  onChangeText={setOrderInput}
                  keyboardType="numeric"
                />
                <Pressable style={styles.orderButton} onPress={handleProposeOrder} disabled={busy}>
                  <Text style={styles.orderButtonText}>Proposer</Text>
                </Pressable>
              </View>
            )}

            {isCreator && (
              <Pressable
                style={[styles.primaryButton, !isFull && styles.primaryButtonDisabled]}
                onPress={handleValidate}
                disabled={!isFull || busy}
              >
                <Text style={styles.primaryButtonText}>
                  {isFull ? (busy ? "..." : "Valider le calendrier et démarrer") : "En attente de participants"}
                </Text>
              </Pressable>
            )}
          </>
        )}

        {isActive && (
          <>
            <Text style={styles.sectionTitle}>Calendrier</Text>
            {participants
              .slice()
              .sort((a, b) => (a.confirmedOrder ?? 0) - (b.confirmedOrder ?? 0))
              .map((p) => (
                <View key={p.id} style={styles.participantRow}>
                  <Text style={styles.participantOrder}>Tour {p.confirmedOrder}</Text>
                  <Text style={styles.participantName}>{p.user.fullName}</Text>
                </View>
              ))}

            <Text style={styles.sectionTitle}>Cotisations</Text>
            <View style={styles.roundTabs}>
              {Array.from({ length: totalRounds }, (_, i) => i + 1).map((round) => (
                <Pressable
                  key={round}
                  style={[styles.roundTab, selectedRound === round && styles.roundTabActive]}
                  onPress={() => setSelectedRound(round)}
                >
                  <Text style={[styles.roundTabText, selectedRound === round && styles.roundTabTextActive]}>
                    Tour {round}
                  </Text>
                </Pressable>
              ))}
            </View>

            {roundContributions.map((c) => (
              <View key={c.id} style={styles.contributionRow}>
                <Text style={styles.participantName}>{c.participant.fullName}</Text>
                {isCreator && c.status === "pending" ? (
                  <View style={{ flexDirection: "row", gap: 6 }}>
                    <Pressable style={styles.paidButton} onPress={() => handleMarkPaid(c.id)}>
                      <Text style={styles.paidButtonText}>Payé</Text>
                    </Pressable>
                    <Pressable style={styles.missedButton} onPress={() => handleMarkMissed(c.id)}>
                      <Text style={styles.missedButtonText}>Impayé</Text>
                    </Pressable>
                  </View>
                ) : (
                  <View
                    style={[
                      styles.contribStatusBadge,
                      c.status === "paid" && styles.contribStatusPaid,
                      c.status === "missed" && styles.contribStatusMissed,
                    ]}
                  >
                    <Text style={styles.contribStatusText}>
                      {c.status === "paid" ? "Payé" : c.status === "missed" ? "Impayé" : "En attente"}
                    </Text>
                  </View>
                )}
              </View>
            ))}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  centerBox: { flex: 1, alignItems: "center", justifyContent: "center" },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  headerTitle: { fontSize: 16, fontWeight: "600", color: colors.textPrimary, flex: 1, textAlign: "center" },
  content: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xl },
  summaryCard: {
    backgroundColor: colors.accentBg,
    borderRadius: radius.md,
    padding: spacing.md,
    alignItems: "center",
    marginBottom: spacing.md,
  },
  summaryAmount: { fontSize: 22, fontWeight: "700", color: colors.accent },
  summarySub: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  summaryDesc: { fontSize: 12, color: colors.textPrimary, marginTop: spacing.sm, textAlign: "center" },
  shareCard: {
    flexDirection: "row",
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    alignItems: "center",
  },
  shareTitle: { fontSize: 12, fontWeight: "700", color: colors.textPrimary },
  shareCode: { fontSize: 12, color: colors.accent, marginTop: 2, fontFamily: "monospace" },
  shareHint: { fontSize: 11, color: colors.textMuted, marginTop: 4, lineHeight: 15 },
  shareActions: { flexDirection: "row", gap: 6 },
  shareIconButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: colors.accentBg,
    alignItems: "center",
    justifyContent: "center",
  },
  errorText: { fontSize: 12, color: colors.danger, marginBottom: spacing.md },
  sectionTitle: { fontSize: 13, fontWeight: "700", color: colors.textPrimary, marginTop: spacing.md, marginBottom: spacing.sm },
  participantRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    padding: spacing.sm,
    marginBottom: 6,
  },
  participantName: { fontSize: 13, color: colors.textPrimary },
  participantOrder: { fontSize: 12, color: colors.textMuted },
  orderRow: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.sm, marginBottom: spacing.md },
  orderInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    fontSize: 13,
    color: colors.textPrimary,
    backgroundColor: colors.surface,
  },
  orderButton: {
    backgroundColor: colors.accent,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    justifyContent: "center",
  },
  orderButtonText: { fontSize: 12, fontWeight: "600", color: colors.onAccent },
  primaryButton: {
    backgroundColor: colors.accent,
    borderRadius: radius.sm,
    paddingVertical: 12,
    alignItems: "center",
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
  },
  primaryButtonDisabled: { backgroundColor: colors.borderStrong },
  primaryButtonText: { fontSize: 14, fontWeight: "600", color: colors.onAccent },
  roundTabs: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginBottom: spacing.sm },
  roundTab: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
  },
  roundTabActive: { backgroundColor: colors.accent },
  roundTabText: { fontSize: 12, color: colors.textSecondary, fontWeight: "600" },
  roundTabTextActive: { color: colors.onAccent },
  contributionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    padding: spacing.sm,
    marginBottom: 6,
  },
  paidButton: { backgroundColor: colors.accentBg, borderRadius: radius.sm, paddingHorizontal: spacing.sm, paddingVertical: 6 },
  paidButtonText: { fontSize: 11, fontWeight: "600", color: colors.accent },
  missedButton: { backgroundColor: colors.dangerBg, borderRadius: radius.sm, paddingHorizontal: spacing.sm, paddingVertical: 6 },
  missedButtonText: { fontSize: 11, fontWeight: "600", color: colors.danger },
  contribStatusBadge: { backgroundColor: colors.secondaryBg, borderRadius: radius.sm, paddingHorizontal: spacing.sm, paddingVertical: 4 },
  contribStatusPaid: { backgroundColor: colors.accentBg },
  contribStatusMissed: { backgroundColor: colors.dangerBg },
  contribStatusText: { fontSize: 11, fontWeight: "600", color: colors.textPrimary },
});