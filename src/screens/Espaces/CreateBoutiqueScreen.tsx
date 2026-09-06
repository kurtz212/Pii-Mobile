import React, { useEffect, useState } from "react";
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { colors, radius, spacing } from "@/theme/colors";
import { RootStackParamList } from "@/navigation/types";
import * as ImagePicker from "expo-image-picker";
import { createEspace } from "../../services/espaces.service";
import { ApiRequestError, uploadImage } from "../../services/api";
import { getMyAffiliation } from "../../services/affiliation.service";

type Nav = NativeStackNavigationProp<RootStackParamList>;

const CATEGORIES = ["Mode", "Électronique", "Alimentation", "Beauté", "Maison"];

export function CreateBoutiqueScreen() {
  const navigation = useNavigation<Nav>();
  const [name, setName] = useState("");
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [category, setCategory] = useState<string | null>(null);
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
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
        // en cas d'échec, le champ reste vide et modifiable — l'utilisateur
        // pourra quand même saisir un code manuellement
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
    category !== null &&
    location.trim().length > 0 &&
    affiliationCode.trim().length > 0 &&
    !loading;
  async function handlePickPhoto() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setError("Autorise l'accès à ta galerie pour continuer.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
      allowsEditing: true,
      aspect: [1, 1],
    });
    if (!result.canceled && result.assets[0]) {
      setPhotoUri(result.assets[0].uri);
    }
  }
  async function handleCreate() {
    if (!canSubmit) return;
    setError(null);
    setLoading(true);
    try {
      let uploadedPhotoUrl: string | undefined;
      if (photoUri) {
        setUploadingPhoto(true);
        uploadedPhotoUrl = await uploadImage(photoUri);
        setUploadingPhoto(false);
      }

      await createEspace({
        type: "boutique" as any,
        name: name.trim(),
        description: description.trim() || undefined,
        location: location.trim(),
        photoUrl: uploadedPhotoUrl,
        details: { category },
        affiliationCode: affiliationCode.trim(),
      } as any);
      navigation.navigate("Tabs");
    } catch (err: unknown) {
      setError(err instanceof ApiRequestError ? err.message : "Impossible de se connecter au serveur. Vérifie ta connexion.");
    } finally {
      setLoading(false);
      setUploadingPhoto(false);
    }
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.headerRow}>
        <Ionicons name="close" size={20} color={colors.textSecondary} onPress={() => navigation.goBack()} />
        <Text style={styles.headerTitle}>Nouvelle boutique</Text>
        <View style={{ width: 20 }} />
      </View>
           <ScrollView contentContainerStyle={styles.content}>
        <Pressable style={styles.logoBox} onPress={handlePickPhoto}>
          
          {photoUri ? (
            <Image source={{ uri: photoUri }} style={styles.logoImage} />
          ) : (
            <>
              <Ionicons name="camera-outline" size={24} color={colors.textSecondary} />
              <Text style={styles.logoText}>Ajouter un logo</Text>
            </>
          )}
        </Pressable>

        <Text style={styles.label}>Nom de la boutique</Text>
        <TextInput
          style={styles.input}
          placeholder="Ex. Aïcha Mode"
          placeholderTextColor={colors.textMuted}
          value={name}
          onChangeText={setName}
        />

        <Text style={styles.label}>Catégorie principale</Text>
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

        <Text style={styles.label}>Description</Text>
        <TextInput
          style={[styles.input, styles.textarea]}
          placeholder="Présente ta boutique en quelques mots..."
          placeholderTextColor={colors.textMuted}
          value={description}
          onChangeText={setDescription}
          multiline
        />

        <Text style={styles.label}>Localisation</Text>
        <TextInput
          style={styles.input}
          placeholder="Ex. Ouagadougou, secteur 15"
          placeholderTextColor={colors.textMuted}
          value={location}
          onChangeText={setLocation}
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

        <View style={styles.subscriptionNote}>
          <Ionicons name="information-circle-outline" size={16} color={colors.textSecondary} />
          <Text style={styles.subscriptionText}>
            La création d'une boutique active un abonnement compte pro. Le détail des paliers
            sera présenté à l'étape suivante.
          </Text>
        </View>

        <Pressable
          style={[styles.submitButton, !canSubmit && styles.submitButtonDisabled]}
          onPress={handleCreate}
          disabled={!canSubmit}
        >
                  <Text style={styles.submitButtonText}>
            {uploadingPhoto ? "Envoi de la photo..." : loading ? "Création..." : "Créer ma boutique"}
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
    logoImage: { width: "100%", height: "100%", borderRadius: 44 },
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