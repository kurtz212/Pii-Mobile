import React, { useCallback, useState } from "react";
import { ActivityIndicator, FlatList, Modal, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { colors, radius, spacing } from "@/theme/colors";
import { RootStackParamList } from "@/navigation/types";
import { ApiOrder, getMyOrders, OrderStatus } from "../../services/order.service";
import { createReview } from "../../services/review.service";
import { ApiRequestError } from "../../services/api";

type Nav = NativeStackNavigationProp<RootStackParamList>;

const statusLabel: Record<OrderStatus, string> = {
  pending: "Nouvelle",
  confirmed: "Confirmée",
  delivered: "Livrée",
  cancelled: "Annulée",
};

const statusColor: Record<OrderStatus, { bg: string; fg: string }> = {
  pending: { bg: colors.secondaryBg, fg: colors.secondary },
  confirmed: { bg: colors.accentBg, fg: colors.accent },
  delivered: { bg: colors.surface, fg: colors.textSecondary },
  cancelled: { bg: colors.dangerBg, fg: colors.danger },
};

export function MyOrdersScreen() {
  const navigation = useNavigation<Nav>();
  const [orders, setOrders] = useState<ApiOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reviewedOrderIds, setReviewedOrderIds] = useState<Set<string>>(new Set());
  const [reviewModalOrder, setReviewModalOrder] = useState<ApiOrder | null>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      async function load() {
        setLoading(true);
        setError(null);
        try {
          const data = await getMyOrders();
          if (!cancelled) setOrders(data);
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

  function openReviewModal(order: ApiOrder) {
    setRating(5);
    setComment("");
    setReviewModalOrder(order);
  }

  async function handleSubmitReview() {
    if (!reviewModalOrder) return;
    setSubmitting(true);
    try {
      await createReview(reviewModalOrder.id, rating, comment.trim() || undefined);
      setReviewedOrderIds((prev) => new Set(prev).add(reviewModalOrder.id));
      setReviewModalOrder(null);
    } catch {
      // en cas d'échec on laisse la modale ouverte pour réessayer
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.headerRow}>
        <Ionicons name="arrow-back" size={20} color={colors.textSecondary} onPress={() => navigation.goBack()} />
        <Text style={styles.headerTitle}>Mes commandes</Text>
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
          data={orders}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.centerBox}>
              <Text style={styles.emptyText}>Tu n'as pas encore passé de commande.</Text>
            </View>
          }
          renderItem={({ item }) => {
            const colorSet = statusColor[item.status];
            const alreadyReviewed = reviewedOrderIds.has(item.id);
            return (
              <View style={styles.card}>
                <View style={styles.cardTop}>
                  <Text style={styles.cardTitle}>{item.title}</Text>
                  <View style={[styles.statusBadge, { backgroundColor: colorSet.bg }]}>
                    <Text style={[styles.statusBadgeText, { color: colorSet.fg }]}>
                      {statusLabel[item.status]}
                    </Text>
                  </View>
                </View>
                <Text style={styles.cardPrice}>{Number(item.price).toLocaleString("fr-FR")} F</Text>
                {item.status === "delivered" && !alreadyReviewed && (
                  <Pressable style={styles.reviewButton} onPress={() => openReviewModal(item)}>
                    <Ionicons name="star-outline" size={14} color={colors.accent} />
                    <Text style={styles.reviewButtonText}>Laisser un avis</Text>
                  </Pressable>
                )}
                {alreadyReviewed && (
                  <View style={styles.reviewedNote}>
                    <Ionicons name="checkmark-circle" size={14} color={colors.accent} />
                    <Text style={styles.reviewedText}>Avis envoyé, merci !</Text>
                  </View>
                )}
              </View>
            );
          }}
        />
      )}

      <Modal visible={reviewModalOrder !== null} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Ton avis sur "{reviewModalOrder?.title}"</Text>

            <View style={styles.starsRow}>
              {[1, 2, 3, 4, 5].map((n) => (
                <Pressable key={n} onPress={() => setRating(n)}>
                  <Ionicons
                    name={n <= rating ? "star" : "star-outline"}
                    size={30}
                    color="#EAB308"
                  />
                </Pressable>
              ))}
            </View>

            <TextInput
              style={styles.commentInput}
              placeholder="Un commentaire (optionnel)..."
              placeholderTextColor={colors.textMuted}
              value={comment}
              onChangeText={setComment}
              multiline
            />

            <View style={styles.modalActions}>
              <Pressable style={styles.modalCancelButton} onPress={() => setReviewModalOrder(null)}>
                <Text style={styles.modalCancelText}>Annuler</Text>
              </Pressable>
              <Pressable
                style={styles.modalSubmitButton}
                onPress={handleSubmitReview}
                disabled={submitting}
              >
                <Text style={styles.modalSubmitText}>{submitting ? "..." : "Envoyer"}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
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
  cardTitle: { fontSize: 14, fontWeight: "600", color: colors.textPrimary, flex: 1 },
  statusBadge: { paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: radius.sm },
  statusBadgeText: { fontSize: 10, fontWeight: "600" },
  cardPrice: { fontSize: 16, fontWeight: "700", color: colors.textPrimary, marginTop: 4 },
  reviewButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    alignSelf: "flex-start",
    marginTop: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.sm,
    backgroundColor: colors.accentBg,
  },
  reviewButtonText: { fontSize: 12, fontWeight: "600", color: colors.accent },
  reviewedNote: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: spacing.sm },
  reviewedText: { fontSize: 12, color: colors.accent },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.lg,
  },
  modalBox: {
    width: "100%",
    backgroundColor: colors.background,
    borderRadius: radius.md,
    padding: spacing.lg,
  },
  modalTitle: { fontSize: 15, fontWeight: "600", color: colors.textPrimary, marginBottom: spacing.md },
  starsRow: { flexDirection: "row", justifyContent: "center", gap: spacing.sm, marginBottom: spacing.md },
  commentInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    fontSize: 13,
    color: colors.textPrimary,
    backgroundColor: colors.surface,
    height: 70,
    textAlignVertical: "top",
    marginBottom: spacing.md,
  },
  modalActions: { flexDirection: "row", gap: spacing.sm },
  modalCancelButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: radius.sm,
    paddingVertical: 11,
    alignItems: "center",
  },
  modalCancelText: { fontSize: 13, fontWeight: "600", color: colors.textPrimary },
  modalSubmitButton: {
    flex: 1,
    backgroundColor: colors.accent,
    borderRadius: radius.sm,
    paddingVertical: 11,
    alignItems: "center",
  },
  modalSubmitText: { fontSize: 13, fontWeight: "600", color: colors.onAccent },
});