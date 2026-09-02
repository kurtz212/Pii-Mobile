import React, { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from "react-native";
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

const CATEGORIES = ["Conseil", "Artisanat", "Éducation", "Beauté & bien-être", "Technologie", "Autre"];

export function CreateEntrepreneurScreen() {
  const navigation = useNavigation<Nav>();
  const [name, setName] = useState("");
  const [category, setCategory] = useState<string | null>(null);
  const [bio, setBio] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [snapchat, setSnapchat] = useState("");
  const [linkedin, setLinkedin] = useState("");
  const [tiktok, setTiktok] = useState("");
  const [lienPortfolio, setLienPortfolio] = useState("");
  const [location, setLocation] = useState("");
  const [accepterReservations, setAccepterReservations] = useState(true);
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
    name.trim().length > 0 && category !== null && affiliationCode.trim().length > 0 && !loading;

  async function handleCreate() {
    if (!canSubmit) return;
    setError(null);
    setLoading(true);
    try {
      await createEspace({
        type: "entrepreneur" as any,
        name: name.trim(),
        description: bio.trim() || undefined,
        location: location.trim() || undefined,
        details: {
          category,
          whatsapp: whatsapp.trim() || null,
          snapchat: snapchat.trim() || null,
          linkedin: linkedin.trim() || null,
          tiktok: tiktok.trim() || null,
          lienPortfolio: lienPortfolio.trim() || null,
          accepterReservations,
        },
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
        <Text style={styles.headerTitle}>Nouvel espace entrepreneur</Text>
        <View style={{ width: 20 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.logoBox}>
          <Ionicons name="camera-outline" size={24} color={colors.textSecondary} />
          <Text style={styles.logoText}>Ajouter une photo</Text>
        </View>

        <Text style={styles.label}>Nom de l'activité</Text>
        <TextInput
          style={styles.input}
          placeholder="Ex. Fatou Conseil RH"
          placeholderTextColor={colors.textMuted}
          value={name}
          onChangeText={setName}
        />

        <Text style={styles.label}>Catégorie de service</Text>
        <View style={styles.categoryWrap}>
          {CATEGORIES.map((cat) => {
            const active = category === cat;
            return (
              <Pressable
                key={cat}
                style={[styles.categoryChip, active && styles.categoryChipActive]}
                onPress={() => setCategory(cat)}
              >
                <Text style={[styles.categoryChipText, active && styles.categoryChipTextActive]}>
                  {cat}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={styles.label}>Bio</Text>
        <TextInput
          style={[styles.input, styles.textarea]}
          placeholder="Présente ton activité et ton expérience..."
          placeholderTextColor={colors.textMuted}
          value={bio}
          onChangeText={setBio}
          multiline
        />

        <Text style={styles.sectionLabel}>Réseaux sociaux (optionnel)</Text>

        <View style={styles.socialRow}>
          <Ionicons name="logo-whatsapp" size={18} color="#25D366" />
          <TextInput
            style={styles.socialInput}
            placeholder="Lien WhatsApp"
            placeholderTextColor={colors.textMuted}
            value={whatsapp}
            onChangeText={setWhatsapp}
            autoCapitalize="none"
          />
        </View>
        <View style={styles.socialRow}>
          <Ionicons name="logo-snapchat" size={18} color="#FFFC00" />
          <TextInput
            style={styles.socialInput}
            placeholder="Lien Snapchat"
            placeholderTextColor={colors.textMuted}
            value={snapchat}
            onChangeText={setSnapchat}
            autoCapitalize="none"
          />
        </View>
        <View style={styles.socialRow}>
          <Ionicons name="logo-linkedin" size={18} color="#0A66C2" />
          <TextInput
            style={styles.socialInput}
            placeholder="Lien LinkedIn"
            placeholderTextColor={colors.textMuted}
            value={linkedin}
            onChangeText={setLinkedin}
            autoCapitalize="none"
          />
        </View>
        <View style={styles.socialRow}>
          <Ionicons name="logo-tiktok" size={18} color={colors.textPrimary} />
          <TextInput
            style={styles.socialInput}
            placeholder="Lien TikTok"
            placeholderTextColor={colors.textMuted}
            value={tiktok}
            onChangeText={setTiktok}
            autoCapitalize="none"
          />
        </View>

        <Text style={styles.label}>Lien portfolio (optionnel)</Text>
        <TextInput
          style={styles.input}
          placeholder="https://..."
          placeholderTextColor={colors.textMuted}
          value={lienPortfolio}
          onChangeText={setLienPortfolio}
          autoCapitalize="none"
        />

        <Text style={styles.label}>Localisation (optionnel)</Text>
        <TextInput
          style={styles.input}
          placeholder="Laisse vide si service uniquement à distance"
          placeholderTextColor={colors.textMuted}
          value={location}
          onChangeText={setLocation}
        />

        <View style={styles.optionRow}>
          <View style={styles.optionLeft}>
            <Ionicons name="calendar-outline" size={18} color={colors.textSecondary} />
            <View>
              <Text style={styles.optionTitle}>Accepter les réservations dans l'app</Text>
              <Text style={styles.optionSubtitle}>
                Sinon, les clients te contactent uniquement par messagerie
              </Text>
            </View>
          </View>
          <Switch value={accepterReservations} onValueChange={setAccepterReservations} />
        </View>

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

        <View style={styles.subscriptionNote}>
          <Ionicons name="information-circle-outline" size={16} color={colors.textSecondary} />
          <Text style={styles.subscriptionText}>
            La création d'un espace entrepreneur active un abonnement compte pro. Le détail des
            paliers sera présenté à l'étape suivante.
          </Text>
        </View>

        <Pressable
          style={[styles.submitButton, !canSubmit && styles.submitButtonDisabled]}
          onPress={handleCreate}
          disabled={!canSubmit}
        >
          <Text style={styles.submitButtonText}>
            {loading ? "Création..." : "Créer mon espace entrepreneur"}
          </Text>
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
  sectionLabel: { fontSize: 12, fontWeight: "700", color: colors.textPrimary, marginBottom: spacing.sm, marginTop: spacing.sm },
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
  socialRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  socialInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 9,
    fontSize: 13,
    color: colors.textPrimary,
    backgroundColor: colors.surface,
  },
  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.surface,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  optionLeft: { flexDirection: "row", alignItems: "center", gap: spacing.sm, flex: 1, paddingRight: spacing.sm },
  optionTitle: { fontSize: 13, color: colors.textPrimary },
  optionSubtitle: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
  errorText: { fontSize: 12, color: colors.danger, marginBottom: spacing.md },
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