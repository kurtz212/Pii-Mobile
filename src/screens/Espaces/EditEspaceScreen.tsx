import React, { useEffect, useState } from "react";
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import { useNavigation, useRoute } from "@react-navigation/native";
import { NativeStackNavigationProp, NativeStackScreenProps } from "@react-navigation/native-stack";
import { colors, radius, spacing } from "@/theme/colors";
import { RootStackParamList } from "@/navigation/types";
import { getEspaceById, updateEspace } from "../../services/espaces.service";
import { ApiRequestError, getImageUrl, uploadImage } from "../../services/api";

type Props = NativeStackScreenProps<RootStackParamList, "ModifierEspace">;
type Nav = NativeStackNavigationProp<RootStackParamList>;

export function EditEspaceScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Props["route"]>();
  const { espaceId } = route.params;

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [existingPhotoUrl, setExistingPhotoUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const espace = await getEspaceById(espaceId);
        if (!cancelled) {
          setName(espace.name);
          setDescription(espace.description ?? "");
          setLocation(espace.location ?? "");
          setExistingPhotoUrl(espace.photoUrl ?? null);
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
  }, [espaceId]);

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

  async function handleSave() {
    setError(null);
    setSaving(true);
    try {
      let uploadedPhotoUrl: string | undefined;
      if (photoUri) {
        setUploadingPhoto(true);
        uploadedPhotoUrl = await uploadImage(photoUri);
        setUploadingPhoto(false);
      }

           await updateEspace(espaceId, {
        name: name.trim(),
        description: description.trim(),
        location: location.trim(),
        photoUrl: uploadedPhotoUrl,
      });
      navigation.goBack();
       } catch (err: unknown) {
      console.log("ERREUR REELLE:", JSON.stringify(err), err);
      setError(err instanceof ApiRequestError ? err.message : "Erreur lors de l'enregistrement");
    } finally {
      setSaving(false);
      setUploadingPhoto(false);
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

  const displayPhotoUri = photoUri ?? (existingPhotoUrl ? getImageUrl(existingPhotoUrl) : null);

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.headerRow}>
        <Ionicons name="close" size={20} color={colors.textSecondary} onPress={() => navigation.goBack()} />
        <Text style={styles.headerTitle}>Modifier le profil</Text>
        <View style={{ width: 20 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Pressable style={styles.photoBox} onPress={handlePickPhoto}>
          {displayPhotoUri ? (
            <Image source={{ uri: displayPhotoUri }} style={styles.photoImage} />
          ) : (
            <>
              <Ionicons name="camera-outline" size={24} color={colors.textSecondary} />
              <Text style={styles.photoText}>Ajouter une photo</Text>
            </>
          )}
        </Pressable>

               <Text style={styles.label}>Nom</Text>
        <TextInput
          style={styles.input}
          placeholder="Nom de l'espace"
          placeholderTextColor={colors.textMuted}
          value={name}
          onChangeText={setName}
        />

        <Text style={styles.label}>Description</Text>
        <TextInput
          style={[styles.input, styles.textarea]}
          placeholder="Présente ton activité..."
          placeholderTextColor={colors.textMuted}
          value={description}
          onChangeText={setDescription}
          multiline
        />

        <Text style={styles.label}>Localisation</Text>
        <TextInput
          style={styles.input}
          placeholder="Ton quartier ou ta ville"
          placeholderTextColor={colors.textMuted}
          value={location}
          onChangeText={setLocation}
        />

        {error && <Text style={styles.errorText}>{error}</Text>}

        <Pressable style={styles.submitButton} onPress={handleSave} disabled={saving}>
          <Text style={styles.submitButtonText}>
            {uploadingPhoto ? "Envoi de la photo..." : saving ? "Enregistrement..." : "Enregistrer"}
          </Text>
        </Pressable>
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
  photoBox: {
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
    overflow: "hidden",
  },
  photoImage: { width: "100%", height: "100%" },
  photoText: { fontSize: 10, color: colors.textSecondary, textAlign: "center", width: 70 },
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
  inputLocked: { backgroundColor: colors.border, justifyContent: "center" },
  lockedText: { fontSize: 14, color: colors.textMuted },
  textarea: { height: 80, textAlignVertical: "top" },
  errorText: { fontSize: 12, color: colors.danger, marginBottom: spacing.md },
  submitButton: {
    backgroundColor: colors.accent,
    borderRadius: radius.sm,
    paddingVertical: 13,
    alignItems: "center",
    marginTop: spacing.sm,
  },
  submitButtonText: { fontSize: 14, fontWeight: "600", color: colors.onAccent },
});