import React, { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { colors, radius, spacing } from "@/theme/colors";
import { RootStackParamList } from "@/navigation/types";
import { createEspace } from "../../services/espaces.service";
import { ApiRequestError } from "../../services/api";
import { getMyAffiliation } from "../../services/affiliation.service";

type Nav = NativeStackNavigationProp<RootStackParamList>;

const TYPES_MARCHANDISES = ["Marchandises générales", "Alimentaire", "Électronique", "Textile", "Matériaux BTP", "Véhicules"];

export function CreateAgenceCargoScreen() {
  const navigation = useNavigation<Nav>();
  const [name, setName] = useState("");
  const [typesMarchandises, setTypesMarchandises] = useState<string[]>([]);
  const [zonesDesservies, setZonesDesservies] = useState("");
  const [description, setDescription] = useState("");
  const [affiliationCode, setAffiliationCode] = useState("");
  const [codeLocked, setCodeLocked] = useState(false);
  const [loadingCode, setLoadingCode] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function loadAffiliation() {
      try {
        const info = await getMyAffiliation();
        if (!cancelled) {
          setAffiliationCode(info.affiliationCode);
          setCodeLocked(info.isCodeFieldLocked);
        }
      } catch {
        // champ laissé vide et modifiable si le chargement échoue
      } finally {
        if (!cancelled) setLoadingCode(false);
      }
    }
    loadAffiliation();
    return () => {
      cancelled = true;
    };
  }, []);

  const canSubmit =
    name.trim().length > 0 &&
    typesMarchandises.length > 0 &&
    zonesDesservies.trim().length > 0 &&
    affiliationCode.trim().length > 0 &&
    !loading;

  function toggleType(v: string) {
    setTypesMarchandises((prev) => (prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v]));
  }

  async function handleCreate() {
    if (!canSubmit) return;
    setError(null);
    setLoading(true);
    try {
      await createEspace({
        type: "agence_cargo" as any,
        name: name.trim(),
        description: description.trim() || undefined,
        location: zonesDesservies.trim(),
        details: { typesMarchandises, zonesDesservies: zonesDesservies.trim() },
        affiliationCode: affiliationCode.trim(),
      } as any);
      navigation.navigate("Tabs");
    } catch (err: unknown) {
      setError(err instanceof ApiRequestError ? err.message : "Impossible de se connecter au serveur. Vérifie ta connexion.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.headerRow}>
        <Ionicons name="close" size={20} color={colors.textSecondary} onPress={() => navigation.goBack()} />
        <Text style={styles.headerTitle}>Nouvelle agence cargo</Text>
        <View style={{ width: 20 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.logoBox}>
          <Ionicons name="camera-outline" size={24} color={colors.textSecondary} />
          <Text style={styles.logoText}>Ajouter un logo</Text>
        </View>

        <Text style={styles.label}>Nom de l'agence</Text>
        <TextInput
          style={styles.input}
          placeholder="Ex. Sahel Cargo Express"
          placeholderTextColor={colors.textMuted}
          value={name}
          onChangeText={setName}
        />

        <Text style={styles.label}>Types de marchandises transportées</Text>
        <View style={styles.categoryWrap}>
          {TYPES_MARCHANDISES.map((v) => {
            const active = typesMarchandises.includes(v);
            return (
              <Pressable
                key={v}
                style={[styles.categoryChip, active && styles.categoryChipActive]}
                onPress={() => toggleType(v)}
              >
                <Text style={[styles.categoryChipText, active && styles.categoryChipTextActive]}>
                  {v}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={styles.label}>Zones desservies</Text>
        <TextInput
          style={styles.input}
          placeholder="Ex. Ouagadougou, Bobo-Dioulasso, Abidjan"
          placeholderTextColor={colors.textMuted}
          value={zonesDesservies}
          onChangeText={setZonesDesservies}
        />

        <Text style={styles.label}>Description</Text>
        <TextInput
          style={[styles.input, styles.textarea]}
          placeholder="Présente ton agence, tes délais moyens d'acheminement..."
          placeholderTextColor={colors.textMuted}
          value={description}
          onChangeText={setDescription}
          multiline
        />

        <Text style={styles.label}>Code d'affiliation</Text>
        {loadingCode ? (
          <ActivityIndicator color={colors.accent} style={{ marginBottom: spacing.md }} />
        ) : (
          <>
            <TextInput
              style={[styles.input, codeLocked && styles.inputLocked]}
              placeholder="Code d'affiliation"
              placeholderTextColor={colors.textMuted}
              value={affiliationCode}
              onChangeText={setAffiliationCode}
              editable={!codeLocked}
              autoCapitalize="characters"
            />
            {codeLocked && (
              <View style={styles.lockedHint}>
                <Ionicons name="lock-closed-outline" size={12} color={colors.secondary} />
                <Text style={styles.lockedHintText}>
                  Champ verrouillé — tu as déjà été parrainé lors d'une précédente création.
                </Text>
              </View>
            )}
          </>
        )}

        {error && <Text style={styles.errorText}>{error}</Text>}

        <View style={styles.infoNote}>
          <Ionicons name="qr-code-outline" size={16} color={colors.textSecondary} />
          <Text style={styles.infoText}>
            Une fois l'agence créée, chaque marchandise enregistrée recevra automatiquement un
            code de suivi que le client pourra consulter.
          </Text>
        </View>

        <View style={styles.subscriptionNote}>
          <Ionicons name="information-circle-outline" size={16} color={colors.textSecondary} />
          <Text style={styles.subscriptionText}>
            La création d'une agence cargo active un abonnement compte pro. Le détail des paliers
            sera présenté à l'étape suivante.
          </Text>
        </View>

        <Pressable
          style={[styles.submitButton, !canSubmit && styles.submitButtonDisabled]}
          onPress={handleCreate}
          disabled={!canSubmit}
        >
          <Text style={styles.submitButtonText}>{loading ? "Création..." : "Créer mon agence cargo"}</Text>
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
  logoBox: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.borderStrong,
    borderStyle: "dashed",
    alignSelf: "center",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    marginBottom: spacing.lg,
  },
  logoText: { fontSize: 10, color: colors.textSecondary, textAlign: "center", width: 70 },
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
  inputLocked: { backgroundColor: colors.border, color: colors.textMuted },
  lockedHint: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: -8, marginBottom: spacing.md },
  lockedHintText: { fontSize: 11, color: colors.secondary, flex: 1 },
  textarea: { height: 80, textAlignVertical: "top" },
  categoryWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  categoryChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
  },
  categoryChipActive: { backgroundColor: colors.accentBg },
  categoryChipText: { fontSize: 12, color: colors.textSecondary },
  categoryChipTextActive: { color: colors.accent, fontWeight: "600" },
  errorText: { fontSize: 12, color: colors.danger, marginBottom: spacing.md },
  infoNote: {
    flexDirection: "row",
    gap: spacing.sm,
    backgroundColor: colors.accentBg,
    borderRadius: radius.sm,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  infoText: { flex: 1, fontSize: 12, color: colors.textPrimary, lineHeight: 17 },
  subscriptionNote: {
    flexDirection: "row",
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.sm,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  subscriptionText: { flex: 1, fontSize: 12, color: colors.textSecondary, lineHeight: 17 },
  submitButton: {
    backgroundColor: colors.accent,
    borderRadius: radius.sm,
    paddingVertical: 12,
    alignItems: "center",
  },
  submitButtonDisabled: { backgroundColor: colors.borderStrong },
  submitButtonText: { fontSize: 14, fontWeight: "600", color: colors.onAccent },
});