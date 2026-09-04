import React, { useCallback, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { colors, radius, spacing } from "@/theme/colors";
import { RootStackParamList } from "@/navigation/types";
import { ApiOrder, getMyOrders } from "../../services/order.service";
import { createGroupedDelivery } from "../../services/delivery.service";
import { ApiRequestError } from "../../services/api";

type Nav = NativeStackNavigationProp<RootStackParamList>;

export function GroupedDeliveryScreen() {
  const navigation = useNavigation<Nav>();
  const [orders, setOrders] = useState<ApiOrder[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [destination, setDestination] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getMyOrders();
      // Seules les commandes confirmées ou en attente ont du sens à
      // regrouper — pas les annulées.
      setOrders(data.filter((o) => o.status !== "cancelled"));
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

  function toggleOrder(orderId: string) {
    setSelectedIds((prev) =>
      prev.includes(orderId) ? prev.filter((id) => id !== orderId) : [...prev, orderId],
    );
  }

  const canSubmit = selectedIds.length >= 2 && destination.trim().length > 0 && !submitting;

  async function handleSubmit() {
    if (!canSubmit) return;
    setError(null);
    setSubmitting(true);
    try {
      await createGroupedDelivery({
        orderIds: selectedIds,
        destination: destination.trim(),
      });
      setSuccess(true);
    } catch (err: unknown) {
      setError(err instanceof ApiRequestError ? err.message : "Erreur lors de la demande");
    } finally {
      setSubmitting(false);
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

  if (success) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.successBox}>
          <View style={styles.successIcon}>
            <Ionicons name="checkmark" size={32} color={colors.onAccent} />
          </View>
          <Text style={styles.successTitle}>Demande envoyée !</Text>
          <Text style={styles.successText}>
            Les agences de livraison vont pouvoir proposer un prix pour récupérer tes {selectedIds.length} commandes.
          </Text>
          <Pressable
            style={styles.successButton}
            onPress={() => navigation.navigate("Tabs", { screen: "Livraison" } as never)}
          >
            <Text style={styles.successButtonText}>Voir mes livraisons</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.headerRow}>
        <Ionicons name="arrow-back" size={20} color={colors.textSecondary} onPress={() => navigation.goBack()} />
        <Text style={styles.headerTitle}>Livraison groupée</Text>
        <View style={{ width: 20 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.hint}>
          Choisis au moins 2 commandes de boutiques différentes — un seul livreur passera les récupérer toutes avant de tout t'apporter.
        </Text>

        {orders.length < 2 ? (
          <View style={styles.emptyBox}>
            <Ionicons name="cube-outline" size={24} color={colors.textMuted} />
            <Text style={styles.emptyText}>
              Il te faut au moins 2 commandes actives pour créer une livraison groupée.
            </Text>
          </View>
        ) : (
          orders.map((order) => {
            const checked = selectedIds.includes(order.id);
            return (
              <Pressable
                key={order.id}
                style={[styles.orderRow, checked && styles.orderRowChecked]}
                onPress={() => toggleOrder(order.id)}
              >
                <Ionicons
                  name={checked ? "checkbox" : "square-outline"}
                  size={20}
                  color={checked ? colors.accent : colors.textMuted}
                />
                <View style={{ flex: 1 }}>
                  <Text style={styles.orderTitle}>{order.title}</Text>
                  <Text style={styles.orderPrice}>{Number(order.price).toLocaleString("fr-FR")} F</Text>
                </View>
              </Pressable>
            );
          })
        )}

        {selectedIds.length > 0 && (
          <>
            <Text style={styles.label}>Adresse de livraison finale</Text>
            <TextInput
              style={styles.input}
              placeholder="Ton quartier, ou colle un lien Maps"
              placeholderTextColor={colors.textMuted}
              value={destination}
              onChangeText={setDestination}
            />
          </>
        )}

        {error && <Text style={styles.errorText}>{error}</Text>}

        <Pressable
          style={[styles.submitButton, !canSubmit && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={!canSubmit}
        >
          <Text style={styles.submitButtonText}>
            {submitting
              ? "Envoi..."
              : `Demander la livraison (${selectedIds.length} commande${selectedIds.length > 1 ? "s" : ""})`}
          </Text>
        </Pressable>
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
  headerTitle: { fontSize: 16, fontWeight: "600", color: colors.textPrimary },
  content: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xl },
  hint: { fontSize: 13, color: colors.textSecondary, lineHeight: 19, marginBottom: spacing.lg },
  emptyBox: {
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.lg,
  },
  emptyText: { fontSize: 12, color: colors.textMuted, textAlign: "center" },
  orderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  orderRowChecked: { borderColor: colors.accent, backgroundColor: colors.accentBg },
  orderTitle: { fontSize: 13, fontWeight: "600", color: colors.textPrimary },
  orderPrice: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  label: { fontSize: 12, color: colors.textSecondary, marginBottom: 6, marginTop: spacing.md },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.textPrimary,
    backgroundColor: colors.surface,
    marginBottom: spacing.md,
  },
  errorText: { fontSize: 12, color: colors.danger, marginBottom: spacing.md },
  submitButton: {
    backgroundColor: colors.accent,
    borderRadius: radius.sm,
    paddingVertical: 13,
    alignItems: "center",
    marginTop: spacing.sm,
  },
  submitButtonDisabled: { backgroundColor: colors.borderStrong },
  submitButtonText: { fontSize: 14, fontWeight: "600", color: colors.onAccent },
  successBox: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: spacing.xl },
  successIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.lg,
  },
  successTitle: { fontSize: 18, fontWeight: "700", color: colors.textPrimary, marginBottom: spacing.sm },
  successText: { fontSize: 13, color: colors.textSecondary, textAlign: "center", lineHeight: 19, marginBottom: spacing.xl },
  successButton: { backgroundColor: colors.accent, borderRadius: radius.sm, paddingVertical: 12, paddingHorizontal: spacing.xl },
  successButtonText: { fontSize: 14, fontWeight: "600", color: colors.onAccent },
});