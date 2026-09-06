import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useNavigation, useRoute } from "@react-navigation/native";
import { NativeStackNavigationProp, NativeStackScreenProps } from "@react-navigation/native-stack";
import { colors, radius, spacing } from "@/theme/colors";
import { RootStackParamList } from "@/navigation/types";
import {
  ApiQuoteRequest,
  ApiQuoteTrackingStep,
  completeQuoteRequest,
  getReceivedQuoteRequests,
  submitQuote,
} from "../../services/quote.service";
import { ApiRequestError } from "../../services/api";

type Props = NativeStackScreenProps<RootStackParamList, "DevisRecus">;
type Nav = NativeStackNavigationProp<RootStackParamList>;

const statusLabel: Record<string, string> = {
  open: "En attente de ta réponse",
  accepted: "Accepté par le client",
  cancelled: "Annulé par le client",
  completed: "Terminé",
};

const statusColor: Record<string, { bg: string; fg: string }> = {
  open: { bg: colors.secondaryBg, fg: colors.secondary },
  accepted: { bg: colors.accentBg, fg: colors.accent },
  cancelled: { bg: colors.dangerBg, fg: colors.danger },
  completed: { bg: colors.surface, fg: colors.textSecondary },
};

export function ReceivedQuotesScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Props["route"]>();
  const { espaceId } = route.params;

  const [requests, setRequests] = useState<ApiQuoteRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [quoteModalRequest, setQuoteModalRequest] = useState<ApiQuoteRequest | null>(null);
  const [price, setPrice] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getReceivedQuoteRequests(espaceId);
      setRequests(data);
    } catch (err: unknown) {
      setError(err instanceof ApiRequestError ? err.message : "Erreur de chargement");
    } finally {
      setLoading(false);
    }
  }, [espaceId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  function openQuoteModal(request: ApiQuoteRequest) {
    setPrice("");
    setNotes("");
    setQuoteModalRequest(request);
  }

  async function handleSubmitQuote() {
    if (!quoteModalRequest) return;
    const priceNumber = Number(price.replace(/\s/g, ""));
    if (!priceNumber || priceNumber <= 0) return;
    setSubmitting(true);
    try {
      await submitQuote(quoteModalRequest.id, espaceId, priceNumber, notes.trim() || undefined);
      setQuoteModalRequest(null);
      await load();
    } catch {
      // en cas d'échec, la modale reste ouverte
    } finally {
      setSubmitting(false);
    }
  }

  async function handleComplete(requestId: string) {
    try {
      await completeQuoteRequest(requestId);
      await load();
    } catch {
      // en cas d'échec on ne change rien
    }
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.headerRow}>
        <Ionicons name="arrow-back" size={20} color={colors.textSecondary} onPress={() => navigation.goBack()} />
        <Text style={styles.headerTitle}>Demandes de devis</Text>
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
              <Text style={styles.emptyText}>Aucune demande de devis reçue pour l'instant.</Text>
            </View>
          }
          renderItem={({ item }) => {
            const colorSet = statusColor[item.status] ?? statusColor.open;
            const details = item.details;
            const originCountry = String(details.originCountry ?? "Pays non précisé");
            const description = String(details.merchandiseDescription ?? "Description non précisée");
            return (
              <View style={styles.card}>
                <View style={styles.cardTop}>
                  <Text style={styles.cardCountry}>Pays d'achat : {originCountry}</Text>
                  <View style={[styles.statusBadge, { backgroundColor: colorSet.bg }]}>
                    <Text style={[styles.statusBadgeText, { color: colorSet.fg }]}>
                      {statusLabel[item.status]}
                    </Text>
                  </View>
                </View>
                <Text style={styles.cardDescription}>{description}</Text>

                {item.status === "open" && (
                  <Pressable style={styles.actionButton} onPress={() => openQuoteModal(item)}>
                    <Text style={styles.actionButtonText}>Proposer un prix</Text>
                  </Pressable>
                )}
                {item.status === "accepted" && (
                  <>
                    <QuoteTrackingButtons request={item} onUpdated={load} />
                    <Pressable style={styles.actionButton} onPress={() => handleComplete(item.id)}>
                      <Text style={styles.actionButtonText}>Marquer comme terminé</Text>
                    </Pressable>
                  </>
                )}
              </View>
            );
          }}
        />
      )}

      <Modal visible={quoteModalRequest !== null} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Proposer un devis</Text>
            <TextInput
              style={styles.input}
              placeholder="Prix (F CFA)"
              placeholderTextColor={colors.textMuted}
              value={price}
              onChangeText={setPrice}
              keyboardType="numeric"
            />
            <TextInput
              style={[styles.input, styles.textarea]}
              placeholder="Notes (délai, conditions...)"
              placeholderTextColor={colors.textMuted}
              value={notes}
              onChangeText={setNotes}
              multiline
            />
            <View style={styles.modalActions}>
              <Pressable style={styles.modalCancelButton} onPress={() => setQuoteModalRequest(null)}>
                <Text style={styles.modalCancelText}>Annuler</Text>
              </Pressable>
              <Pressable style={styles.modalSubmitButton} onPress={handleSubmitQuote} disabled={submitting}>
                <Text style={styles.modalSubmitText}>{submitting ? "..." : "Envoyer"}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
function QuoteTrackingButtons({
  request,
  onUpdated,
}: {
  request: ApiQuoteRequest;
  onUpdated: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const steps = request.trackingSteps ?? [];
  const doneSteps = new Set(steps.map((s) => s.step));

  const order: Array<ApiQuoteTrackingStep["step"]> = ["picked_up", "in_transit", "customs", "delivered"];
  const nextStep = order.find((s) => !doneSteps.has(s));

  const nextLabel: Record<string, string> = {
    picked_up: "Marquer comme récupéré",
    in_transit: "Marquer en transit",
    customs: "Marquer en dédouanement",
    delivered: "Marquer comme livré",
  };

  if (!nextStep) return null;

  async function handlePress() {
    setBusy(true);
    try {
      const { addQuoteTrackingStep } = await import("../../services/quote.service");
      await addQuoteTrackingStep(request.id, nextStep!);
      onUpdated();
    } catch {
      // en cas d'échec, l'utilisateur peut réessayer
    } finally {
      setBusy(false);
    }
  }

  return (
    <Pressable style={styles.trackingButton} onPress={handlePress} disabled={busy}>
      <Text style={styles.trackingButtonText}>{busy ? "..." : nextLabel[nextStep]}</Text>
    </Pressable>
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
  cardCountry: { fontSize: 13, fontWeight: "600", color: colors.textPrimary, flex: 1 },
  statusBadge: { paddingHorizontal: spacing.sm, paddingVertical: 3, borderRadius: radius.sm },
  statusBadgeText: { fontSize: 10, fontWeight: "600" },
  cardDescription: { fontSize: 12, color: colors.textSecondary, marginTop: 6 },
  actionButton: {
    backgroundColor: colors.accent,
    borderRadius: radius.sm,
    paddingVertical: 9,
    alignItems: "center",
    marginTop: spacing.sm,
  },
  actionButtonText: { fontSize: 12, fontWeight: "600", color: colors.onAccent },
  actionButtonSecondary: {
    borderWidth: 1,
    borderColor: colors.accent,
    borderRadius: radius.sm,
    paddingVertical: 9,
    alignItems: "center",
    marginTop: spacing.sm,
  },
    trackingButton: {
    backgroundColor: colors.accent,
    borderRadius: radius.sm,
    paddingVertical: 9,
    alignItems: "center",
    marginTop: spacing.sm,
  },
  trackingButtonText: { fontSize: 12, fontWeight: "600", color: colors.onAccent },
  actionButtonSecondaryText: { fontSize: 12, fontWeight: "600", color: colors.accent },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", alignItems: "center", justifyContent: "center", padding: spacing.lg },
  modalBox: { width: "100%", backgroundColor: colors.background, borderRadius: radius.md, padding: spacing.lg },
  modalTitle: { fontSize: 15, fontWeight: "600", color: colors.textPrimary, marginBottom: spacing.md },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    fontSize: 13,
    color: colors.textPrimary,
    backgroundColor: colors.surface,
    marginBottom: spacing.sm,
  },
  textarea: { height: 70, textAlignVertical: "top" },
  modalActions: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.sm },
  modalCancelButton: { flex: 1, borderWidth: 1, borderColor: colors.borderStrong, borderRadius: radius.sm, paddingVertical: 10, alignItems: "center" },
  modalCancelText: { fontSize: 13, fontWeight: "600", color: colors.textPrimary },
  modalSubmitButton: { flex: 1, backgroundColor: colors.accent, borderRadius: radius.sm, paddingVertical: 10, alignItems: "center" },
  modalSubmitText: { fontSize: 13, fontWeight: "600", color: colors.onAccent },
});

