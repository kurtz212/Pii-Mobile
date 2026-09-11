import React, { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { colors, radius, spacing } from "@/theme/colors";
import { RootStackParamList } from "@/navigation/types";
import { AffiliationInfo, getMyAffiliation, updateMobileMoney, claimAffiliationCode } from "../../services/affiliation.service";
import { ApiRequestError } from "../../services/api";

type Nav = NativeStackNavigationProp<RootStackParamList>;

const OPERATEURS = [
  { value: "moov_money", label: "Moov Money" },
  { value: "orange_money", label: "Orange Money" },
  { value: "wave", label: "Wave" },
];

export function MobileMoneyScreen() {
  const navigation = useNavigation<Nav>();
  const [affiliation, setAffiliation] = useState<AffiliationInfo | null>(null);
  const [operator, setOperator] = useState<string | null>(null);
  const [number, setNumber] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [generatingCode, setGeneratingCode] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const data = await getMyAffiliation();
        if (!cancelled) {
          setAffiliation(data);
          setOperator(data.mobileMoneyOperator);
          setNumber(data.mobileMoneyNumber ?? "");
        }
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
  }, []);

  const canSubmit = operator !== null && number.trim().length > 0 && !saving;

   async function handleGenerateCode() {
    setGeneratingCode(true);
    setError(null);
    try {
      const result = await claimAffiliationCode();
      setAffiliation((prev) => (prev ? { ...prev, affiliationCode: result.affiliationCode } : prev));
    } catch (err: unknown) {
      setError(err instanceof ApiRequestError ? err.message : "Erreur lors de la génération du code");
    } finally {
      setGeneratingCode(false);
    }
  }

  async function handleSave() {
    if (!operator || !canSubmit) return;
    setSaving(true);
    setError(null);
    setSuccess(false);
    try {
      await updateMobileMoney(operator, number.trim());
      setSuccess(true);
    } catch (err: unknown) {
      setError(err instanceof ApiRequestError ? err.message : "Erreur lors de l'enregistrement");
    } finally {
      setSaving(false);
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

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.headerRow}>
        <Ionicons name="arrow-back" size={20} color={colors.textSecondary} onPress={() => navigation.goBack()} />
        <Text style={styles.headerTitle}>Mon affiliation</Text>
        <View style={{ width: 20 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
               {affiliation && (
          <View style={styles.codeCard}>
            <Text style={styles.codeLabel}>Ton code d'affiliation</Text>
            <Text style={styles.codeValue}>{affiliation.affiliationCode}</Text>

            {affiliation.affiliationCode === "0000" ? (
              <>
                <Text style={styles.codeHint}>
                  Tu n'as pas encore de code personnel. Renseigne ton compte mobile money
                  ci-dessous, puis génère ton code pour commencer à parrainer.
                </Text>
                <Pressable
                  style={[
                    styles.generateButton,
                    (!operator || !number.trim() || generatingCode) && styles.generateButtonDisabled,
                  ]}
                  onPress={handleGenerateCode}
                  disabled={!operator || !number.trim() || generatingCode}
                >
                  <Text style={styles.generateButtonText}>
                    {generatingCode ? "Génération..." : "Générer mon code"}
                  </Text>
                </Pressable>
              </>
            ) : (
              <Text style={styles.codeHint}>
                Partage ce code : chaque création d'espace d'un filleul te rapporte une commission,
                versée directement sur ton compte mobile money ci-dessous.
              </Text>
            )}

            {affiliation.isCodeFieldLocked && (
              <View style={styles.lockedNote}>
                <Ionicons name="lock-closed-outline" size={13} color={colors.secondary} />
                <Text style={styles.lockedNoteText}>
                  Tu as déjà été parrainé — ton propre champ code d'affiliation est verrouillé pour
                  tes prochains espaces.
                </Text>
              </View>
            )}
          </View>
        )}
        <Text style={styles.sectionTitle}>Compte de réception</Text>
        <Text style={styles.sectionSubtitle}>
          Choisis l'opérateur et le numéro sur lequel tes commissions seront versées.
        </Text>

        <View style={styles.operatorRow}>
          {OPERATEURS.map((op) => {
            const active = operator === op.value;
            return (
              <Pressable
                key={op.value}
                style={[styles.operatorChip, active && styles.operatorChipActive]}
                onPress={() => setOperator(op.value)}
              >
                <Text style={[styles.operatorChipText, active && styles.operatorChipTextActive]}>
                  {op.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={styles.label}>Numéro de compte</Text>
        <TextInput
          style={styles.input}
          placeholder="Ex. 70123456"
          placeholderTextColor={colors.textMuted}
          value={number}
          onChangeText={setNumber}
          keyboardType="phone-pad"
        />

        {error && <Text style={styles.errorText}>{error}</Text>}
        {success && <Text style={styles.successText}>Compte enregistré avec succès.</Text>}

        <Pressable
          style={[styles.submitButton, !canSubmit && styles.submitButtonDisabled]}
          onPress={handleSave}
          disabled={!canSubmit}
        >
          <Text style={styles.submitButtonText}>{saving ? "Enregistrement..." : "Enregistrer"}</Text>
        </Pressable>

        <View style={styles.infoNote}>
          <Ionicons name="information-circle-outline" size={16} color={colors.textSecondary} />
          <Text style={styles.infoText}>
            Les opérateurs sont provisoires en attendant l'intégration des vraies API de paiement
            mobile money.
          </Text>
        </View>
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
  codeCard: {
    backgroundColor: colors.accentBg,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  codeLabel: { fontSize: 11, color: colors.textSecondary },
  codeValue: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.accent,
    letterSpacing: 1,
    marginTop: 4,
    marginBottom: spacing.sm,
  },
  codeHint: { fontSize: 12, color: colors.textPrimary, lineHeight: 17 },
    generateButton: {
    backgroundColor: colors.accent,
    borderRadius: radius.sm,
    paddingVertical: 10,
    alignItems: "center",
    marginTop: spacing.sm,
  },
  generateButtonDisabled: { backgroundColor: colors.borderStrong },
  generateButtonText: { fontSize: 13, fontWeight: "600", color: colors.onAccent },
  lockedNote: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.06)",
  },
  lockedNoteText: { flex: 1, fontSize: 11, color: colors.secondary, lineHeight: 15 },
  sectionTitle: { fontSize: 14, fontWeight: "700", color: colors.textPrimary, marginBottom: 4 },
  sectionSubtitle: { fontSize: 12, color: colors.textSecondary, marginBottom: spacing.md, lineHeight: 17 },
  operatorRow: { flexDirection: "row", gap: spacing.sm, marginBottom: spacing.md },
  operatorChip: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 10,
    borderRadius: radius.sm,
    backgroundColor: colors.surface,
  },
  operatorChipActive: { backgroundColor: colors.accentBg },
  operatorChipText: { fontSize: 12, color: colors.textSecondary, fontWeight: "600" },
  operatorChipTextActive: { color: colors.accent },
  label: { fontSize: 12, color: colors.textSecondary, marginBottom: 6 },
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
  successText: { fontSize: 12, color: colors.accent, marginBottom: spacing.md },
  submitButton: {
    backgroundColor: colors.accent,
    borderRadius: radius.sm,
    paddingVertical: 12,
    alignItems: "center",
    marginBottom: spacing.md,
  },
  submitButtonDisabled: { backgroundColor: colors.borderStrong },
  submitButtonText: { fontSize: 14, fontWeight: "600", color: colors.onAccent },
  infoNote: {
    flexDirection: "row",
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.sm,
    padding: spacing.md,
  },
  infoText: { flex: 1, fontSize: 11, color: colors.textSecondary, lineHeight: 16 },
});