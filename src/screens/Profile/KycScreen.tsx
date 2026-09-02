import React, { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { colors, radius, spacing } from "@/theme/colors";
import { RootStackParamList } from "@/navigation/types";
import { ApiUserProfile, getMyProfile, submitKyc } from "../../services/affiliation.service";
import { ApiRequestError } from "../../services/api";

type Nav = NativeStackNavigationProp<RootStackParamList>;

const DOCUMENT_TYPES = [
  { value: "cni", label: "Carte d'identité (CNI)" },
  { value: "passeport", label: "Passeport" },
  { value: "permis_conduire", label: "Permis de conduire" },
];

export function KycScreen() {
  const navigation = useNavigation<Nav>();
  const [profile, setProfile] = useState<ApiUserProfile | null>(null);
  const [docType, setDocType] = useState<string | null>(null);
  const [docNumber, setDocNumber] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const data = await getMyProfile();
        if (!cancelled) {
          setProfile(data);
          setDocType(data.idDocumentType);
          setDocNumber(data.idDocumentNumber ?? "");
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

  const canSubmit = docType !== null && docNumber.trim().length > 0 && !saving;
  const alreadySubmitted = profile?.kycStatus === "submitted" || profile?.kycStatus === "verified";

  async function handleSubmit() {
    if (!docType || !canSubmit) return;
    setSaving(true);
    setError(null);
    setSuccess(false);
    try {
      const updated = await submitKyc(docType, docNumber.trim());
      setProfile(updated);
      setSuccess(true);
    } catch (err: unknown) {
      setError(err instanceof ApiRequestError ? err.message : "Erreur lors de l'envoi");
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
        <Text style={styles.headerTitle}>Vérification d'identité</Text>
        <View style={{ width: 20 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {alreadySubmitted && (
          <View style={styles.statusCard}>
            <Ionicons name="checkmark-circle" size={18} color={colors.accent} />
            <Text style={styles.statusText}>
              Tes informations ont été soumises. La vérification complète arrivera avec le
              partenariat KYC à venir.
            </Text>
          </View>
        )}

        <Text style={styles.label}>Type de document</Text>
        <View style={styles.typeWrap}>
          {DOCUMENT_TYPES.map((type) => {
            const active = docType === type.value;
            return (
              <Pressable
                key={type.value}
                style={[styles.typeChip, active && styles.typeChipActive]}
                onPress={() => setDocType(type.value)}
              >
                <Text style={[styles.typeChipText, active && styles.typeChipTextActive]}>
                  {type.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={styles.label}>Numéro du document</Text>
        <TextInput
          style={styles.input}
          placeholder="Ex. B123456"
          placeholderTextColor={colors.textMuted}
          value={docNumber}
          onChangeText={setDocNumber}
          autoCapitalize="characters"
        />

        {error && <Text style={styles.errorText}>{error}</Text>}
        {success && <Text style={styles.successText}>Informations enregistrées avec succès.</Text>}

        <Pressable
          style={[styles.submitButton, !canSubmit && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={!canSubmit}
        >
          <Text style={styles.submitButtonText}>
            {saving ? "Envoi..." : alreadySubmitted ? "Mettre à jour" : "Soumettre"}
          </Text>
        </Pressable>

        <View style={styles.infoNote}>
          <Ionicons name="information-circle-outline" size={16} color={colors.textSecondary} />
          <Text style={styles.infoText}>
            Ces informations sont déclaratives pour l'instant — une vraie vérification sera mise
            en place une fois le partenaire KYC intégré.
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
  statusCard: {
    flexDirection: "row",
    gap: spacing.sm,
    backgroundColor: colors.accentBg,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  statusText: { flex: 1, fontSize: 12, color: colors.textPrimary, lineHeight: 17 },
  label: { fontSize: 12, color: colors.textSecondary, marginBottom: 6, marginTop: spacing.sm },
  typeWrap: { gap: spacing.sm, marginBottom: spacing.md },
  typeChip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
  },
  typeChipActive: { borderColor: colors.accent, backgroundColor: colors.accentBg },
  typeChipText: { fontSize: 13, color: colors.textSecondary },
  typeChipTextActive: { color: colors.accent, fontWeight: "600" },
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
    paddingVertical: 13,
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