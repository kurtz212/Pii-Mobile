import React, { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute } from "@react-navigation/native";
import { NativeStackNavigationProp, NativeStackScreenProps } from "@react-navigation/native-stack";
import { colors, radius, spacing } from "@/theme/colors";
import { RootStackParamList } from "@/navigation/types";
import { createOrder, PaymentMethod, ReceptionMode } from "../../services/order.service";
import { ApiRequestError } from "../../services/api";

type Props = NativeStackScreenProps<RootStackParamList, "Commander">;
type Nav = NativeStackNavigationProp<RootStackParamList>;

export function OrderScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Props["route"]>();
  const { publicationId, title, price, tranchesActivees } = route.params;

   const [quantity, setQuantity] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");
  const [receptionMode, setReceptionMode] = useState<ReceptionMode>("livraison");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleConfirm() {
    setError(null);
    setLoading(true);
    try {
          await createOrder({
        publicationId,
        quantity,
        paymentMethod,
        receptionMode,
        notes: notes.trim() || undefined,
      });
      setSuccess(true);
    } catch (err: unknown) {
      setError(err instanceof ApiRequestError ? err.message : "Impossible de passer la commande.");
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.successBox}>
          <View style={styles.successIcon}>
            <Ionicons name="checkmark" size={32} color={colors.onAccent} />
          </View>
          <Text style={styles.successTitle}>Commande envoyée !</Text>
          <Text style={styles.successText}>
            Le vendeur va être notifié et te contactera pour la suite.
          </Text>
          <Pressable style={styles.successButton} onPress={() => navigation.navigate("Tabs")}>
            <Text style={styles.successButtonText}>Retour à l'accueil</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.headerRow}>
        <Ionicons name="close" size={20} color={colors.textSecondary} onPress={() => navigation.goBack()} />
        <Text style={styles.headerTitle}>Commander</Text>
        <View style={{ width: 20 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
              <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>{title}</Text>
          <Text style={styles.summaryPrice}>{(price * quantity).toLocaleString("fr-FR")} F</Text>
          {quantity > 1 && (
            <Text style={styles.summaryUnitPrice}>{price.toLocaleString("fr-FR")} F × {quantity}</Text>
          )}
        </View>

        <Text style={styles.sectionTitle}>Quantité</Text>
        <View style={styles.quantityRow}>
          <Pressable
            style={styles.quantityButton}
            onPress={() => setQuantity((q) => Math.max(1, q - 1))}
            disabled={quantity <= 1}
          >
            <Ionicons name="remove" size={18} color={quantity <= 1 ? colors.textMuted : colors.accent} />
          </Pressable>
          <Text style={styles.quantityValue}>{quantity}</Text>
          <Pressable style={styles.quantityButton} onPress={() => setQuantity((q) => q + 1)}>
            <Ionicons name="add" size={18} color={colors.accent} />
          </Pressable>
        </View>

        <Text style={styles.sectionTitle}>Mode de paiement</Text>
        <Pressable
          style={[styles.optionCard, paymentMethod === "cash" && styles.optionCardActive]}
          onPress={() => setPaymentMethod("cash")}
        >
          <Ionicons
            name="cash-outline"
            size={20}
            color={paymentMethod === "cash" ? colors.accent : colors.textSecondary}
          />
          <View style={{ flex: 1 }}>
            <Text style={[styles.optionTitle, paymentMethod === "cash" && styles.optionTitleActive]}>
              Paiement cash
            </Text>
            <Text style={styles.optionSubtitle}>Tu payes en totalité à la réception</Text>
          </View>
          {paymentMethod === "cash" && (
            <Ionicons name="checkmark-circle" size={20} color={colors.accent} />
          )}
        </Pressable>

        <Pressable
          style={[
            styles.optionCard,
            paymentMethod === "tranches" && styles.optionCardActive,
            !tranchesActivees && styles.optionCardDisabled,
          ]}
          onPress={() => tranchesActivees && setPaymentMethod("tranches")}
          disabled={!tranchesActivees}
        >
          <Ionicons
            name="card-outline"
            size={20}
            color={paymentMethod === "tranches" ? colors.accent : colors.textSecondary}
          />
          <View style={{ flex: 1 }}>
            <Text style={[styles.optionTitle, paymentMethod === "tranches" && styles.optionTitleActive]}>
              Paiement par tranches
            </Text>
            <Text style={styles.optionSubtitle}>
              {tranchesActivees
                ? "Molo Molo Paie — échéancier à convenir avec le vendeur"
                : "Non disponible pour cet article"}
            </Text>
          </View>
          {paymentMethod === "tranches" && (
            <Ionicons name="checkmark-circle" size={20} color={colors.accent} />
          )}
        </Pressable>

        <Text style={styles.sectionTitle}>Mode de réception</Text>
        <Pressable
          style={[styles.optionCard, receptionMode === "livraison" && styles.optionCardActive]}
          onPress={() => setReceptionMode("livraison")}
        >
          <Ionicons
            name="car-outline"
            size={20}
            color={receptionMode === "livraison" ? colors.accent : colors.textSecondary}
          />
          <View style={{ flex: 1 }}>
            <Text style={[styles.optionTitle, receptionMode === "livraison" && styles.optionTitleActive]}>
              Demander une livraison
            </Text>
            <Text style={styles.optionSubtitle}>Un livreur ou une agence te livrera l'article</Text>
          </View>
          {receptionMode === "livraison" && (
            <Ionicons name="checkmark-circle" size={20} color={colors.accent} />
          )}
        </Pressable>

        <Pressable
          style={[styles.optionCard, receptionMode === "rendez_vous" && styles.optionCardActive]}
          onPress={() => setReceptionMode("rendez_vous")}
        >
          <Ionicons
            name="calendar-outline"
            size={20}
            color={receptionMode === "rendez_vous" ? colors.accent : colors.textSecondary}
          />
          <View style={{ flex: 1 }}>
            <Text style={[styles.optionTitle, receptionMode === "rendez_vous" && styles.optionTitleActive]}>
              Demander un rendez-vous
            </Text>
            <Text style={styles.optionSubtitle}>
              Convenez ensemble du lieu et de l'heure via la messagerie
            </Text>
          </View>
          {receptionMode === "rendez_vous" && (
            <Ionicons name="checkmark-circle" size={20} color={colors.accent} />
          )}
        </Pressable>

        <Text style={styles.label}>Note pour le vendeur (optionnel)</Text>
        <TextInput
          style={styles.input}
          placeholder="Ex. Taille M, livraison après 18h..."
          placeholderTextColor={colors.textMuted}
          value={notes}
          onChangeText={setNotes}
          multiline
        />

        {error && <Text style={styles.errorText}>{error}</Text>}

        <Pressable
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={handleConfirm}
          disabled={loading}
        >
          <Text style={styles.submitButtonText}>{loading ? "Envoi..." : "Confirmer la commande"}</Text>
        </Pressable>
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
  summaryCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
    alignItems: "center",
  },
  summaryTitle: { fontSize: 15, fontWeight: "600", color: colors.textPrimary },
  summaryPrice: { fontSize: 22, fontWeight: "700", color: colors.accent, marginTop: 4 },
    summaryUnitPrice: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  quantityRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radius.sm,
    padding: spacing.md,
    marginBottom: spacing.md,
    alignSelf: "flex-start",
  },
  quantityButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
  },
  quantityValue: { fontSize: 16, fontWeight: "700", color: colors.textPrimary, minWidth: 24, textAlign: "center" },
  sectionTitle: { fontSize: 13, fontWeight: "700", color: colors.textPrimary, marginBottom: spacing.sm, marginTop: spacing.sm },
  optionCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  optionCardActive: { borderColor: colors.accent, backgroundColor: colors.accentBg },
  optionCardDisabled: { opacity: 0.5 },
  optionTitle: { fontSize: 14, fontWeight: "600", color: colors.textPrimary },
  optionTitleActive: { color: colors.accent },
  optionSubtitle: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
  label: { fontSize: 12, color: colors.textSecondary, marginBottom: 6, marginTop: spacing.sm },
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
    height: 70,
    textAlignVertical: "top",
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
  successButton: {
    backgroundColor: colors.accent,
    borderRadius: radius.sm,
    paddingVertical: 12,
    paddingHorizontal: spacing.xl,
  },
  successButtonText: { fontSize: 14, fontWeight: "600", color: colors.onAccent },
});