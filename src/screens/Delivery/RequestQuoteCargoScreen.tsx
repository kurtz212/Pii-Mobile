import React, { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { colors, radius, spacing } from "@/theme/colors";
import { RootStackParamList } from "@/navigation/types";
import { createQuoteRequest } from "../../services/quote.service";
import { ApiRequestError } from "../../services/api";
import { AgencySelectorModal } from "./AgencySelectorModal";

type Nav = NativeStackNavigationProp<RootStackParamList>;

export function RequestQuoteCargoScreen() {
  const navigation = useNavigation<Nav>();
  const [originCountry, setOriginCountry] = useState("");
  const [destinationCountry, setDestinationCountry] = useState("");
  const [weightKg, setWeightKg] = useState("");
  const [merchandiseDescription, setMerchandiseDescription] = useState("");
  const [selectedAgencyIds, setSelectedAgencyIds] = useState<string[]>([]);
  const [showSelector, setShowSelector] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const canSubmit =
    originCountry.trim().length > 0 &&
    destinationCountry.trim().length > 0 &&
    weightKg.trim().length > 0 &&
    merchandiseDescription.trim().length > 0 &&
    !loading;

  async function handleSubmit() {
    if (!canSubmit) return;
    setError(null);
    setLoading(true);
    try {
      await createQuoteRequest({
        targetType: "agence_cargo",
        targetEspaceIds: selectedAgencyIds.length > 0 ? selectedAgencyIds : undefined,
        details: {
          originCountry: originCountry.trim(),
          destinationCountry: destinationCountry.trim(),
          weightKg: Number(weightKg),
          merchandiseDescription: merchandiseDescription.trim(),
        },
      });
      setSuccess(true);
    } catch (err: unknown) {
      setError(err instanceof ApiRequestError ? err.message : "Erreur lors de l'envoi");
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
          <Text style={styles.successTitle}>Demande envoyée !</Text>
          <Text style={styles.successText}>
            {selectedAgencyIds.length === 0
              ? "Toutes les agences cargo peuvent maintenant te répondre."
              : "Les agences choisies peuvent maintenant te répondre."}
          </Text>
          <Pressable style={styles.successButton} onPress={() => navigation.navigate("MesDevis")}>
            <Text style={styles.successButtonText}>Voir mes demandes</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.headerRow}>
        <Ionicons name="arrow-back" size={20} color={colors.textSecondary} onPress={() => navigation.goBack()} />
        <Text style={styles.headerTitle}>Devis cargo</Text>
        <View style={{ width: 20 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.label}>Pays de départ (achat)</Text>
        <TextInput
          style={styles.input}
          placeholder="Ex. Chine"
          placeholderTextColor={colors.textMuted}
          value={originCountry}
          onChangeText={setOriginCountry}
        />

        <Text style={styles.label}>Pays de destination</Text>
        <TextInput
          style={styles.input}
          placeholder="Ex. Burkina Faso"
          placeholderTextColor={colors.textMuted}
          value={destinationCountry}
          onChangeText={setDestinationCountry}
        />

        <Text style={styles.label}>Poids total (kg)</Text>
        <TextInput
          style={styles.input}
          placeholder="Ex. 250"
          placeholderTextColor={colors.textMuted}
          value={weightKg}
          onChangeText={setWeightKg}
          keyboardType="numeric"
        />

        <Text style={styles.label}>Description de la marchandise</Text>
        <TextInput
          style={[styles.input, styles.textarea]}
          placeholder="Nature, quantité, emballage, valeur approximative..."
          placeholderTextColor={colors.textMuted}
          value={merchandiseDescription}
          onChangeText={setMerchandiseDescription}
          multiline
        />

        <Text style={styles.label}>Destinataires de la demande</Text>
        <Pressable style={styles.agencySelectorButton} onPress={() => setShowSelector(true)}>
          <Ionicons name="business-outline" size={16} color={colors.accent} />
          <Text style={styles.agencySelectorText}>
            {selectedAgencyIds.length === 0
              ? "Toutes les agences cargo"
              : `${selectedAgencyIds.length} agence(s) sélectionnée(s)`}
          </Text>
          <Ionicons name="chevron-forward" size={14} color={colors.textMuted} style={{ marginLeft: "auto" }} />
        </Pressable>

        {error && <Text style={styles.errorText}>{error}</Text>}

        <Pressable
          style={[styles.submitButton, !canSubmit && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={!canSubmit}
        >
          <Text style={styles.submitButtonText}>{loading ? "Envoi..." : "Envoyer la demande"}</Text>
        </Pressable>
      </ScrollView>

      <AgencySelectorModal
        visible={showSelector}
        espaceType="agence_cargo"
        selectedIds={selectedAgencyIds}
        onChangeSelection={setSelectedAgencyIds}
        onClose={() => setShowSelector(false)}
      />
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
  },
  textarea: { height: 80, textAlignVertical: "top" },
  agencySelectorButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.sm,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  agencySelectorText: { fontSize: 13, color: colors.textPrimary },
  errorText: { fontSize: 12, color: colors.danger, marginBottom: spacing.md },
  submitButton: {
    backgroundColor: colors.accent,
    borderRadius: radius.sm,
    paddingVertical: 13,
    alignItems: "center",
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