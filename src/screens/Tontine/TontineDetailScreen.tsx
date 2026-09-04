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
  finalizeCalendar,
  getContributions,
  getTontine,
  getTontineParticipants,
  joinTontine,
  proposeCalendar,
  respondToProposal,
  updateContribution,
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
  const [selectedRound, setSelectedRound] = useState(1);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  // Brouillon local des positions proposees par le createur, avant
  // envoi. Cle = userId, valeur = position saisie.
  const [draftAssignments, setDraftAssignments] = useState<Record<string, string>>({});
  const [amendOrderInput, setAmendOrderInput] = useState("");

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

      const draft: Record<string, string> = {};
      p.forEach((participant) => {
        draft[participant.userId] = participant.proposedOrder ? String(participant.proposedOrder) : "";
      });
      setDraftAssignments(draft);

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
  const myMembership = participants.find((p) => p.userId === myUserId);
  const hasProposal = participants.some((p) => p.proposedOrder !== null);
  const allValidated = isFull && participants.every((p) => p.responseStatus === "validated");

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
      // l'utilisateur a annule le partage, rien a faire
    }
  }

  function updateDraft(userId: string, value: string) {
    setDraftAssignments((prev) => ({ ...prev, [userId]: value }));
  }

  async function handleSendProposal() {
    if (!tontine) return;
    const assignments = participants.map((p) => ({
      userId: p.userId,
      order: Number(draftAssignments[p.userId]),
    }));
    const invalid = assignments.some((a) => !a.order || a.order < 1 || a.order > participants.length);
    if (invalid) {
      setError("Attribue une position valide (1 a " + participants.length + ") a chaque participant, sans doublon.");
      return;
    }
    const orders = assignments.map((a) => a.order);
    if (new Set(orders).size !== orders.length) {
      setError("Chaque position doit etre unique.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await proposeCalendar(tontineId, assignments);
      await load();
    } catch (err: unknown) {
      setError(err instanceof ApiRequestError ? err.message : "Impossible d'envoyer la proposition.");
    } finally {
      setBusy(false);
    }
  }

  async function handleValidateProposal() {
    setBusy(true);
    try {
      await respondToProposal(tontineId, true);
      await load();
    } catch (err: unknown) {
      setError(err instanceof ApiRequestError ? err.message : "Erreur lors de la validation.");
    } finally {
      setBusy(false);
    }
  }

  async function handleAmendProposal() {
    const value = Number(amendOrderInput);
    if (!value || value < 1) return;
    setBusy(true);
    try {
      await respondToProposal(tontineId, false, value);
      setAmendOrderInput("");
      await load();
    } catch (err: unknown) {
      setError(err instanceof ApiRequestError ? err.message : "Erreur lors de l'envoi de ta demande.");
    } finally {
      setBusy(false);
    }
  }

  async function handleFinalize() {
    setBusy(true);
    try {
      await finalizeCalendar(tontineId);
      await load();
    } catch (err: unknown) {
      setError(err instanceof ApiRequestError ? err.message : "Impossible de finaliser le calendrier.");
    } finally {
      setBusy(false);
    }
  }

  async function handleMarkPaid(contributionId: string) {
    try {
      await updateContribution(tontineId, contributionId, "paid");
      await load();
    } catch {
      // en cas d'echec on ne change rien
    }
  }

  async function handleMarkMissed(contributionId: string) {
    try {
      await updateContribution(tontineId, contributionId, "missed");
      await load();
    } catch {
      // en cas d'echec on ne change rien
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
          {tontine.articleName && (
            <View style={styles.articleRow}>
              <Ionicons name="pricetag-outline" size={14} color={colors.accent} />
              <Text style={styles.articleText}>
                {tontine.articleName}
                {tontine.articlePrice ? ` - ${Number(tontine.articlePrice).toLocaleString("fr-FR")} F` : ""}
              </Text>
            </View>
          )}
          <Text style={styles.summaryAmount}>
            {Number(tontine.contributionAmount).toLocaleString("fr-FR")} F
          </Text>
          <Text style={styles.summarySub}>par tour - {tontine.maxParticipants} participants</Text>
          {tontine.description && <Text style={styles.summaryDesc}>{tontine.description}</Text>}
          {tontine.confidentialityPolicy && (
            <View style={styles.policyBox}>
              <Text style={styles.policyLabel}>Politique de confidentialite</Text>
              <Text style={styles.policyText}>{tontine.confidentialityPolicy}</Text>
            </View>
          )}
        </View>

        {isCreator && isDraft && (
          <View style={styles.shareCard}>
            <View style={{ flex: 1 }}>
              <Text style={styles.shareTitle}>Code a partager</Text>
              <Pressable onPress={handleCopyCode}>
                <Text style={styles.shareCode}>{tontineId}</Text>
              </Pressable>
              <Text style={styles.shareHint}>
                {copied ? "Copie !" : "Appuie sur le code pour le copier."}
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

            {!isFull && (
              <Text style={styles.hintText}>
                En attente de participants avant de pouvoir proposer un calendrier.
              </Text>
            )}

            {isFull && isCreator && !hasProposal && (
              <>
                <Text style={styles.hintText}>
                  Attribue une position (1 a {participants.length}) a chaque participant, puis envoie ta proposition.
                </Text>
                {participants.map((p) => (
                  <View key={p.id} style={styles.assignRow}>
                    <Text style={styles.participantName}>{p.user.fullName}</Text>
                    <TextInput
                      style={styles.assignInput}
                      placeholder="Tour"
                      placeholderTextColor={colors.textMuted}
                      keyboardType="numeric"
                      value={draftAssignments[p.userId] ?? ""}
                      onChangeText={(text) => updateDraft(p.userId, text)}
                    />
                  </View>
                ))}
                <Pressable style={styles.primaryButton} onPress={handleSendProposal} disabled={busy}>
                  <Text style={styles.primaryButtonText}>{busy ? "..." : "Envoyer la proposition"}</Text>
                </Pressable>
              </>
            )}

            {isFull && hasProposal && (
              <>
                {participants.map((p) => (
                  <View key={p.id} style={styles.participantRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.participantName}>{p.user.fullName}</Text>
                      <Text style={styles.participantOrder}>
                        Propose : tour {p.proposedOrder}
                        {p.requestedOrder ? ` -> demande : tour ${p.requestedOrder}` : ""}
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.responseBadge,
                        p.responseStatus === "validated" && styles.responseBadgeValidated,
                        p.responseStatus === "amended" && styles.responseBadgeAmended,
                      ]}
                    >
                      <Text style={styles.responseBadgeText}>
                        {p.responseStatus === "validated"
                          ? "Valide"
                          : p.responseStatus === "amended"
                            ? "Modification demandee"
                            : "En attente"}
                      </Text>
                    </View>
                  </View>
                ))}

                {isMember && myMembership?.responseStatus === "pending" && (
                  <View style={styles.responseActions}>
                    <Text style={styles.hintText}>
                      Le createur te propose le tour {myMembership.proposedOrder}. Tu es d'accord ?
                    </Text>
                    <Pressable style={styles.primaryButton} onPress={handleValidateProposal} disabled={busy}>
                      <Text style={styles.primaryButtonText}>{busy ? "..." : "Valider cette position"}</Text>
                    </Pressable>
                    <View style={styles.orderRow}>
                      <TextInput
                        style={styles.orderInput}
                        placeholder="Ou demande un autre tour (ex. 1)"
                        placeholderTextColor={colors.textMuted}
                        value={amendOrderInput}
                        onChangeText={setAmendOrderInput}
                        keyboardType="numeric"
                      />
                      <Pressable style={styles.orderButton} onPress={handleAmendProposal} disabled={busy}>
                        <Text style={styles.orderButtonText}>Demander</Text>
                      </Pressable>
                    </View>
                  </View>
                )}

                {isCreator && (
                  <>
                    <Text style={styles.sectionTitle}>Ajuster la proposition</Text>
                    {participants.map((p) => (
                      <View key={p.id} style={styles.assignRow}>
                        <Text style={styles.participantName}>{p.user.fullName}</Text>
                        <TextInput
                          style={styles.assignInput}
                          placeholder="Tour"
                          placeholderTextColor={colors.textMuted}
                          keyboardType="numeric"
                          value={draftAssignments[p.userId] ?? ""}
                          onChangeText={(text) => updateDraft(p.userId, text)}
                        />
                      </View>
                    ))}
                    <Pressable style={styles.secondaryButton} onPress={handleSendProposal} disabled={busy}>
                      <Text style={styles.secondaryButtonText}>
                        {busy ? "..." : "Renvoyer une nouvelle proposition"}
                      </Text>
                    </Pressable>

                    <Pressable
                      style={[styles.primaryButton, !allValidated && styles.primaryButtonSoft]}
                      onPress={handleFinalize}
                      disabled={busy}
                    >
                      <Text style={styles.primaryButtonText}>
                        {busy
                          ? "..."
                          : allValidated
                            ? "Finaliser et demarrer la tontine"
                            : "Finaliser quand meme et demarrer"}
                      </Text>
                    </Pressable>
                  </>
                )}
              </>
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
                      <Text style={styles.paidButtonText}>Paye</Text>
                    </Pressable>
                    <Pressable style={styles.missedButton} onPress={() => handleMarkMissed(c.id)}>
                      <Text style={styles.missedButtonText}>Impaye</Text>
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
                      {c.status === "paid" ? "Paye" : c.status === "missed" ? "Impaye" : "En attente"}
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
  errorText: { fontSize: 12, color: colors.danger, marginBottom: spacing.md },
  hintText: { fontSize: 12, color: colors.textMuted, marginBottom: spacing.sm },
  summaryCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  articleRow: { flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 6 },
  articleText: { fontSize: 12, color: colors.accent, fontWeight: "600" },
  summaryAmount: { fontSize: 22, fontWeight: "700", color: colors.textPrimary },
  summarySub: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  summaryDesc: { fontSize: 12, color: colors.textSecondary, marginTop: spacing.sm, lineHeight: 17 },
  policyBox: { backgroundColor: colors.background, borderRadius: radius.sm, padding: spacing.sm, marginTop: spacing.sm },
  policyLabel: { fontSize: 10, color: colors.textMuted, fontWeight: "600", marginBottom: 2 },
  policyText: { fontSize: 12, color: colors.textPrimary, lineHeight: 17 },
  shareCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.accentBg,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  shareTitle: { fontSize: 11, color: colors.textSecondary, fontWeight: "600" },
  shareCode: { fontSize: 14, fontWeight: "700", color: colors.accent, marginTop: 2 },
  shareHint: { fontSize: 10, color: colors.textMuted, marginTop: 2 },
  shareActions: { flexDirection: "row", gap: spacing.sm },
  shareIconButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
  },
  sectionTitle: { fontSize: 13, fontWeight: "700", color: colors.textPrimary, marginTop: spacing.md, marginBottom: spacing.sm },
  primaryButton: {
    backgroundColor: colors.accent,
    borderRadius: radius.sm,
    paddingVertical: 12,
    alignItems: "center",
    marginTop: spacing.sm,
  },
  primaryButtonSoft: { backgroundColor: colors.borderStrong },
  primaryButtonDisabled: { backgroundColor: colors.borderStrong },
  primaryButtonText: { fontSize: 13, fontWeight: "600", color: colors.onAccent },
  secondaryButton: {
    borderWidth: 1,
    borderColor: colors.accent,
    borderRadius: radius.sm,
    paddingVertical: 11,
    alignItems: "center",
    marginTop: spacing.sm,
  },
  secondaryButtonText: { fontSize: 13, fontWeight: "600", color: colors.accent },
  participantRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.surface,
    borderRadius: radius.sm,
    padding: spacing.md,
    marginBottom: 6,
  },
  participantName: { fontSize: 13, color: colors.textPrimary, fontWeight: "600" },
  participantOrder: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
  responseBadge: { paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: radius.sm, backgroundColor: colors.secondaryBg },
  responseBadgeValidated: { backgroundColor: colors.accentBg },
  responseBadgeAmended: { backgroundColor: colors.dangerBg },
  responseBadgeText: { fontSize: 10, fontWeight: "600", color: colors.textSecondary },
  assignRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.surface,
    borderRadius: radius.sm,
    padding: spacing.md,
    marginBottom: 6,
  },
  assignInput: {
    width: 70,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 8,
    fontSize: 13,
    color: colors.textPrimary,
    backgroundColor: colors.background,
    textAlign: "center",
  },
  responseActions: { backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.md, marginTop: spacing.sm },
  orderRow: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.sm },
  orderInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    fontSize: 13,
    color: colors.textPrimary,
    backgroundColor: colors.background,
  },
  orderButton: {
    backgroundColor: colors.accent,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    justifyContent: "center",
  },
  orderButtonText: { fontSize: 12, fontWeight: "600", color: colors.onAccent },
  roundTabs: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginBottom: spacing.sm },
  roundTab: { paddingHorizontal: spacing.md, paddingVertical: 6, borderRadius: radius.pill, backgroundColor: colors.surface },
  roundTabActive: { backgroundColor: colors.accent },
  roundTabText: { fontSize: 11, color: colors.textSecondary, fontWeight: "600" },
  roundTabTextActive: { color: colors.onAccent },
  contributionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.surface,
    borderRadius: radius.sm,
    padding: spacing.md,
    marginBottom: 6,
  },
  paidButton: { backgroundColor: colors.accent, borderRadius: radius.sm, paddingHorizontal: spacing.sm, paddingVertical: 6 },
  paidButtonText: { fontSize: 11, fontWeight: "600", color: colors.onAccent },
  missedButton: { borderWidth: 1, borderColor: colors.danger, borderRadius: radius.sm, paddingHorizontal: spacing.sm, paddingVertical: 6 },
  missedButtonText: { fontSize: 11, fontWeight: "600", color: colors.danger },
  contribStatusBadge: { paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: radius.sm, backgroundColor: colors.secondaryBg },
  contribStatusPaid: { backgroundColor: colors.accentBg },
  contribStatusMissed: { backgroundColor: colors.dangerBg },
  contribStatusText: { fontSize: 10, fontWeight: "600", color: colors.textSecondary },
});
