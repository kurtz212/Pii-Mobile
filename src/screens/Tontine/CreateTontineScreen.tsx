import React, { useState } from "react";
import { Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { colors, radius, spacing } from "@/theme/colors";
import { RootStackParamList } from "@/navigation/types";
import * as ImagePicker from "expo-image-picker";
import { createTontine } from "../../services/tontine.service";
import { ApiRequestError, uploadImage, getImageUrl } from "../../services/api";

type Nav = NativeStackNavigationProp<RootStackParamList>;

export function CreateTontineScreen() {
  const navigation = useNavigation<Nav>();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [articleName, setArticleName] = useState("");
  const [articlePrice, setArticlePrice] = useState("");
   const [confidentialityPolicy, setConfidentialityPolicy] = useState("");
  const [articleImageUri, setArticleImageUri] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [contributionAmount, setContributionAmount] = useState("");
  const [maxParticipants, setMaxParticipants] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const amountNumber = Number(contributionAmount.replace(/\s/g, ""));
  const participantsNumber = Number(maxParticipants);
  const articlePriceNumber = Number(articlePrice.replace(/\s/g, ""));
  const canSubmit =
    name.trim().length > 0 && amountNumber > 0 && participantsNumber >= 2 && !loading;
  async function handlePickArticleImage() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setError("Autorise l'accès à ta galerie pour continuer.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
      allowsEditing: true,
      aspect: [4, 3],
    });
    if (!result.canceled && result.assets[0]) {
      setArticleImageUri(result.assets[0].uri);
    }
  }
   async function handleCreate() {
    if (!canSubmit) return;
    setError(null);
    setLoading(true);
    try {
      let uploadedImageUrl: string | undefined;
      if (articleImageUri) {
        setUploadingImage(true);
        uploadedImageUrl = await uploadImage(articleImageUri);
        setUploadingImage(false);
      }

      const tontine = await createTontine({
        name: name.trim(),
        description: description.trim() || undefined,
        articleName: articleName.trim() || undefined,
        articlePrice: articlePriceNumber > 0 ? articlePriceNumber : undefined,
        articleImageUrl: uploadedImageUrl,
        confidentialityPolicy: confidentialityPolicy.trim() || undefined,
        contributionAmount: amountNumber,
        maxParticipants: participantsNumber,
      });
      navigation.replace("TontineDetail", { tontineId: tontine.id });
    } catch (err: unknown) {
      setError(err instanceof ApiRequestError ? err.message : "Impossible de creer la tontine.");
    } finally {
      setLoading(false);
      setUploadingImage(false);
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
          placeholder="Ex. Tontine des couturieres"
          placeholderTextColor={colors.textMuted}
          value={name}
          onChangeText={setName}
        />

        <Text style={styles.label}>Description (optionnel)</Text>
        <TextInput
          style={[styles.input, styles.textarea]}
          placeholder="Objectif du groupe, contexte..."
          placeholderTextColor={colors.textMuted}
          value={description}
          onChangeText={setDescription}
          multiline
        />

        <Text style={styles.sectionLabel}>Article vise (optionnel)</Text>
                <Text style={styles.label}>Nom de l'article</Text>
        <TextInput
          style={styles.input}
          placeholder="Ex. Television"
          placeholderTextColor={colors.textMuted}
          value={articleName}
          onChangeText={setArticleName}
        />

        <Text style={styles.label}>Photo de l'article</Text>
        <Pressable style={styles.imagePickerBox} onPress={handlePickArticleImage}>
          {articleImageUri ? (
            <Image source={{ uri: articleImageUri }} style={styles.articleImage} />
          ) : (
            <View style={styles.imagePickerPlaceholder}>
              <Ionicons name="camera-outline" size={22} color={colors.textSecondary} />
              <Text style={styles.imagePickerText}>Ajouter une photo</Text>
            </View>
          )}
        </Pressable>

        <Text style={styles.label}>Prix de l'article (F CFA)</Text>
        <TextInput
          style={styles.input}
          placeholder="Ex. 75000"
          placeholderTextColor={colors.textMuted}
          value={articlePrice}
          onChangeText={setArticlePrice}
          keyboardType="numeric"
        />

        <Text style={styles.label}>Politique de confidentialite (optionnel)</Text>
        <TextInput
          style={[styles.input, styles.textarea]}
          placeholder="Regles du groupe, engagement, consequences en cas de defaut..."
          placeholderTextColor={colors.textMuted}
          value={confidentialityPolicy}
          onChangeText={setConfidentialityPolicy}
          multiline
        />

        <Text style={styles.label}>Cotisation par participant (F CFA)</Text>
        <TextInput
          style={styles.input}
          placeholder="Ex. 15000"
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

        <Pressable
          style={[styles.submitButton, !canSubmit && styles.submitButtonDisabled]}
          onPress={handleCreate}
          disabled={!canSubmit}
        >
          <Text style={styles.submitButtonText}>
            {uploadingImage ? "Envoi de la photo..." : loading ? "Creation..." : "Creer la tontine"}
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
  label: { fontSize: 12, color: colors.textSecondary, marginBottom: 6, marginTop: spacing.sm },
  sectionLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.textPrimary,
    marginTop: spacing.lg,
    marginBottom: spacing.xs,
  },
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
  imagePickerBox: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    marginBottom: spacing.md,
    overflow: "hidden",
  },
  articleImage: { width: "100%", height: 160 },
  imagePickerPlaceholder: {
    height: 100,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    backgroundColor: colors.surface,
  },
  imagePickerText: { fontSize: 12, color: colors.textSecondary },
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
});
