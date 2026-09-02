import React, { useState } from "react";
import { Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { Video, ResizeMode } from "expo-av";
import * as ImagePicker from "expo-image-picker";
import { useNavigation, useRoute } from "@react-navigation/native";
import { NativeStackNavigationProp, NativeStackScreenProps } from "@react-navigation/native-stack";
import { colors, radius, spacing } from "@/theme/colors";
import { RootStackParamList } from "@/navigation/types";
import { createPublication, PublicationContentType } from "../../services/publication.service";
import { ApiRequestError, uploadImage, uploadVideo } from "../../services/api";

type Props = NativeStackScreenProps<RootStackParamList, "CreerPublication">;
type Nav = NativeStackNavigationProp<RootStackParamList>;

const CONTENT_TYPES: { value: PublicationContentType; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { value: "image", label: "Image", icon: "image-outline" },
  { value: "video", label: "Vidéo", icon: "videocam-outline" },
  { value: "text", label: "Texte", icon: "document-text-outline" },
];

export function CreatePublicationScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Props["route"]>();
  const { espaceId } = route.params;

  const [contentType, setContentType] = useState<PublicationContentType>("image");
  const [mediaUri, setMediaUri] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [tranchesActivees, setTranchesActivees] = useState(true);
  const [presenterEnLive, setPresenterEnLive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const priceNumber = Number(price.replace(/\s/g, ""));
  const needsMedia = contentType === "image" || contentType === "video";
  const canSubmit =
    title.trim().length > 0 && (!needsMedia || mediaUri !== null) && !loading;

  function handleChangeContentType(type: PublicationContentType) {
    setContentType(type);
    setMediaUri(null);
    setError(null);
  }

  async function handlePickMedia() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setError("Autorise l'accès à ta galerie pour continuer.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes:
        contentType === "video" ? ImagePicker.MediaTypeOptions.Videos : ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
      allowsEditing: contentType === "image",
      aspect: contentType === "image" ? [4, 3] : undefined,
    });
    if (!result.canceled && result.assets[0]) {
      setMediaUri(result.assets[0].uri);
    }
  }

  async function handlePublish() {
    if (!canSubmit) return;
    setError(null);
    setLoading(true);
    try {
      let uploadedImageUrl: string | undefined;
      let uploadedVideoUrl: string | undefined;

      if (contentType === "image" && mediaUri) {
        uploadedImageUrl = await uploadImage(mediaUri);
      } else if (contentType === "video" && mediaUri) {
        uploadedVideoUrl = await uploadVideo(mediaUri);
      }

      await createPublication({
        espaceId,
        contentType,
        title: title.trim(),
        description: description.trim() || undefined,
        price: priceNumber > 0 ? priceNumber : undefined,
        tranchesActivees: contentType === "image" ? tranchesActivees : undefined,
        presenterEnLive,
        imageUrl: uploadedImageUrl,
        videoUrl: uploadedVideoUrl,
      });
      navigation.goBack();
    } catch (err: unknown) {
      setError(err instanceof ApiRequestError ? err.message : "Impossible de publier pour le moment.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.headerRow}>
        <Ionicons name="close" size={20} color={colors.textSecondary} onPress={() => navigation.goBack()} />
        <Text style={styles.headerTitle}>Nouvelle publication</Text>
        <Pressable onPress={handlePublish} disabled={!canSubmit}>
          <Text style={[styles.publishText, !canSubmit && styles.publishTextDisabled]}>
            {loading ? "..." : "Publier"}
          </Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.typeRow}>
          {CONTENT_TYPES.map((type) => {
            const active = contentType === type.value;
            return (
              <Pressable
                key={type.value}
                style={[styles.typeChip, active && styles.typeChipActive]}
                onPress={() => handleChangeContentType(type.value)}
              >
                <Ionicons name={type.icon} size={15} color={active ? colors.onAccent : colors.textSecondary} />
                <Text style={[styles.typeChipText, active && styles.typeChipTextActive]}>{type.label}</Text>
              </Pressable>
            );
          })}
        </View>

        {needsMedia && (
          <Pressable style={styles.mediaBox} onPress={handlePickMedia}>
            {mediaUri ? (
              contentType === "image" ? (
                <Image source={{ uri: mediaUri }} style={styles.mediaPreview} />
              ) : (
                <Video
                  source={{ uri: mediaUri }}
                  style={styles.mediaPreview}
                  resizeMode={ResizeMode.COVER}
                  useNativeControls
                  isLooping
                />
              )
            ) : (
              <>
                <Ionicons
                  name={contentType === "video" ? "videocam-outline" : "camera-outline"}
                  size={24}
                  color={colors.textSecondary}
                />
                <Text style={styles.addMediaText}>
                  {contentType === "video" ? "Ajouter une vidéo" : "Ajouter une photo"}
                </Text>
              </>
            )}
          </Pressable>
        )}

        <Text style={styles.label}>Titre</Text>
        <TextInput
          style={styles.input}
          placeholder={contentType === "text" ? "Ex. Nouvelle collection bientôt disponible" : "Ex. Robe wax bleue"}
          placeholderTextColor={colors.textMuted}
          value={title}
          onChangeText={setTitle}
        />

        <Text style={styles.label}>Description</Text>
        <TextInput
          style={[styles.input, styles.textarea]}
          placeholder="Décris ton article, ton actualité ou ton service..."
          placeholderTextColor={colors.textMuted}
          value={description}
          onChangeText={setDescription}
          multiline
        />

        <Text style={styles.label}>
          Prix (F CFA) {contentType !== "image" && <Text style={styles.optionalTag}>— optionnel</Text>}
        </Text>
        <TextInput
          style={styles.input}
          placeholder={contentType === "image" ? "15000" : "Laisse vide si ce n'est pas à vendre"}
          placeholderTextColor={colors.textMuted}
          value={price}
          onChangeText={setPrice}
          keyboardType="numeric"
        />

        {error && <Text style={styles.errorText}>{error}</Text>}

        {contentType === "image" && (
          <View style={styles.optionRow}>
            <View style={styles.optionLeft}>
              <Ionicons name="card-outline" size={18} color={colors.textSecondary} />
              <View>
                <Text style={styles.optionTitle}>Paiement par tranches</Text>
                <Text style={styles.optionSubtitle}>Molo Molo Paie</Text>
              </View>
            </View>
            <Pressable
              style={[styles.toggle, tranchesActivees && styles.toggleActive]}
              onPress={() => setTranchesActivees((v) => !v)}
            >
              <View style={[styles.toggleDot, tranchesActivees && styles.toggleDotActive]} />
            </Pressable>
          </View>
        )}

        <View style={styles.optionRow}>
          <View style={styles.optionLeft}>
            <Ionicons name="radio-outline" size={18} color={colors.textSecondary} />
            <View>
              <Text style={styles.optionTitle}>Présenter en live</Text>
              <Text style={styles.optionSubtitle}>Démarrer un direct pour cette publication</Text>
            </View>
          </View>
          <Pressable
            style={[styles.toggle, presenterEnLive && styles.toggleActive]}
            onPress={() => setPresenterEnLive((v) => !v)}
          >
            <View style={[styles.toggleDot, presenterEnLive && styles.toggleDotActive]} />
          </Pressable>
        </View>
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
  publishText: { fontSize: 14, fontWeight: "600", color: colors.accent },
  publishTextDisabled: { color: colors.textMuted },
  content: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xl },
  typeRow: { flexDirection: "row", gap: spacing.sm, marginBottom: spacing.md },
  typeChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
  },
  typeChipActive: { backgroundColor: colors.accent },
  typeChipText: { fontSize: 12, color: colors.textSecondary, fontWeight: "600" },
  typeChipTextActive: { color: colors.onAccent },
  mediaBox: {
    width: 140,
    height: 140,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.borderStrong,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginBottom: spacing.md,
    overflow: "hidden",
  },
  mediaPreview: { width: "100%", height: "100%" },
  addMediaText: { fontSize: 11, color: colors.textSecondary },
  label: { fontSize: 12, color: colors.textSecondary, marginBottom: 6 },
  optionalTag: { fontSize: 11, color: colors.textMuted, fontWeight: "400" },
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
  errorText: { fontSize: 12, color: colors.danger, marginBottom: spacing.md },
  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.surface,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    marginBottom: spacing.sm,
  },
  optionLeft: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  optionTitle: { fontSize: 13, color: colors.textPrimary },
  optionSubtitle: { fontSize: 11, color: colors.textMuted },
  toggle: {
    width: 38,
    height: 22,
    borderRadius: 12,
    backgroundColor: colors.borderStrong,
    justifyContent: "center",
  },
  toggleActive: { backgroundColor: colors.accent },
  toggleDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.background,
    marginLeft: 2,
  },
  toggleDotActive: { marginLeft: 18 },
});