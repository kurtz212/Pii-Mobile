import React, { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { colors, radius, spacing } from "@/theme/colors";
import { RootStackParamList } from "@/navigation/types";
import { createTontine } from "../../services/tontine.service";
import { ApiRequestError } from "../../services/api";

type Nav = NativeStackNavigationProp<RootStackParamList>;

export function CreateTontineScreen() {
  const navigation = useNavigation<Nav>();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [contributionAmount, setContributionAmount] = useState("");
  const [maxParticipants, setMaxParticipants] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const amountNumber = Number(contributionAmount.replace(/\s/g, ""));
  const participantsNumber = Number(maxParticipants);
  const canSubmit =
    name.trim().length > 0 && amountNumber > 0 && participantsNumber >= 2 && !loading;

  async function handleCreate() {
    if (!canSubmit) return;
    setError(null);
    setLoading(true);
    try {
      const tontine = await createTontine({
        name: name.trim(),
        description: description.trim() || undefined,
        contributionAmount: amountNumber,
        maxParticipants: participantsNumber,
      });
      navigation.replace("TontineDetail", { tontineId: tontine.id });
    } catch (err: unknown) {
      setError(err instanceof ApiRequestError ? err.message : "Impossible de créer la tontine.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.headerRow}>
        <Ionicons name="close" size={20} color={colors.textSecondary} onPress={() => navigation.goBack()} />
        <Text style={styles.headerTitle}>Nouvelle tontine</Text>
        <View style={{ width: 20 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.label}>Nom de la tontine</Text>
        <TextInput
          style={styles.input}
          placeholder="Ex. Tontine des couturières"
          placeholderTextColor={colors.textMuted}
          value={name}
          onChangeText={setName}
        />

        <Text style={styles.label}>Description (optionnel)</Text>
        <TextInput
          style={[styles.input, styles.textarea]}
          placeholder="Présente l'objectif de cette tontine..."
          placeholderTextColor={colors.textMuted}
          value={description}
          onChangeText={setDescription}
          multiline
        />

        <Text style={styles.label}>Montant de la cotisation par tour (F CFA)</Text>
        <TextInput
          style={styles.input}
          placeholder="10000"
          placeholderTextColor={colors.textMuted}
          value={contributionAmount}
          onChangeText={setContributionAmount}
          keyboardType="numeric"
        />

        <Text style={styles.label}>Nombre de participants</Text>
        <TextInput
          style={styles.input}
          placeholder="Ex. 5"
          placeholderTextColor={colors.textMuted}
          value={maxParticipants}
          onChangeText={setMaxParticipants}
          keyboardType="numeric"
        />

        {error && <Text style={styles.errorText}>{error}</Text>}

        <View style={styles.infoNote}>
          <Ionicons name="information-circle-outline" size={16} color={colors.textSecondary} />
          <Text style={styles.infoText}>
            Une fois le nombre de participants atteint, tu pourras valider le calendrier et
            démarrer la tontine.
          </Text>
        </View>

        <Pressable
          style={[styles.submitButton, !canSubmit && styles.submitButtonDisabled]}
          onPress={handleCreate}
          disabled={!canSubmit}
        >
          <Text style={styles.submitButtonText}>{loading ? "Création..." : "Créer la tontine"}</Text>
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
  textarea: { height: 70, textAlignVertical: "top" },
  errorText: { fontSize: 12, color: colors.danger, marginBottom: spacing.md },
  infoNote: {
    flexDirection: "row",
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.sm,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  infoText: { flex: 1, fontSize: 12, color: colors.textSecondary, lineHeight: 17 },
  submitButton: {
    backgroundColor: colors.accent,
    borderRadius: radius.sm,
    paddingVertical: 13,
    alignItems: "center",
  },
  submitButtonDisabled: { backgroundColor: colors.borderStrong },
  submitButtonText: { fontSize: 14, fontWeight: "600", color: colors.onAccent },
});