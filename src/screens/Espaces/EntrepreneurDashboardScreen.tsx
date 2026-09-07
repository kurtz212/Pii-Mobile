import React, { useCallback, useState } from "react";
import { ActivityIndicator, Image, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import { useFocusEffect, useNavigation, useRoute } from "@react-navigation/native";
import { NativeStackNavigationProp, NativeStackScreenProps } from "@react-navigation/native-stack";
import { colors, radius, spacing } from "@/theme/colors";
import { RootStackParamList } from "@/navigation/types";
import { EspaceResponse, getEspaceById, updateEspace } from "../../services/espaces.service";
import { ApiGroup, getGroupsByEspace, joinGroup } from "../../services/group.service";
import { ApiRequestError, getImageUrl, uploadImage } from "../../services/api";

type Props = NativeStackScreenProps<RootStackParamList, "EntrepreneurDashboard">;
type Nav = NativeStackNavigationProp<RootStackParamList>;

export function EntrepreneurDashboardScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Props["route"]>();
  const { espaceId } = route.params;

  const [espace, setEspace] = useState<EspaceResponse | null>(null);
  const [groups, setGroups] = useState<ApiGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [editName, setEditName] = useState("");
  const [editBio, setEditBio] = useState("");
  const [editPhotoUri, setEditPhotoUri] = useState<string | null>(null);
  const [existingPhotoUrl, setExistingPhotoUrl] = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [editWhatsapp, setEditWhatsapp] = useState("");
  const [editSnapchat, setEditSnapchat] = useState("");
  const [editLinkedin, setEditLinkedin] = useState("");
  const [editTiktok, setEditTiktok] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [espaceData, groupsData] = await Promise.all([
        getEspaceById(espaceId),
        getGroupsByEspace(espaceId),
      ]);
           setEditName(espaceData.name);
      setEditBio(espaceData.description ?? "");
      setExistingPhotoUrl(espaceData.photoUrl ?? null);
      setEditWhatsapp((espaceData.details?.whatsapp as string) ?? "");
      setEditSnapchat((espaceData.details?.snapchat as string) ?? "");
      setEditLinkedin((espaceData.details?.linkedin as string) ?? "");
      setEditTiktok((espaceData.details?.tiktok as string) ?? "");
      setEspace(espaceData);
      setGroups(groupsData);
    } catch (err: unknown) {
      setError(err instanceof ApiRequestError ? err.message : "Erreur de chargement");
    } finally {
      setLoading(false);
    }
  }, [espaceId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  async function handleOpenGroup(group: ApiGroup) {
    try {
      await joinGroup(group.id);
      navigation.navigate("GroupeMessages", {
        groupId: group.id,
        groupName: group.name,
        groupType: group.type,
        isCreator: true,
      });
    } catch {
      // en cas d'échec, on ne navigue pas
    }
  }
  async function handlePickPhoto() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
      allowsEditing: true,
      aspect: [1, 1],
    });
    if (!result.canceled && result.assets[0]) {
      setEditPhotoUri(result.assets[0].uri);
    }
  }
    async function handleSaveProfile() {
    setSavingProfile(true);
    try {
      let uploadedPhotoUrl: string | undefined;
      if (editPhotoUri) {
        setUploadingPhoto(true);
        uploadedPhotoUrl = await uploadImage(editPhotoUri);
        setUploadingPhoto(false);
      }

      await updateEspace(espaceId, {
        name: editName.trim(),
        description: editBio.trim(),
        photoUrl: uploadedPhotoUrl,
        details: {
          whatsapp: editWhatsapp.trim() || null,
          snapchat: editSnapchat.trim() || null,
          linkedin: editLinkedin.trim() || null,
          tiktok: editTiktok.trim() || null,
        },
      });
      setShowEditProfile(false);
      await load();
    } catch {
      // en cas d'échec, la modale reste ouverte
    } finally {
      setSavingProfile(false);
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

  if (error || !espace) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.headerRow}>
          <Ionicons name="arrow-back" size={20} color={colors.textSecondary} onPress={() => navigation.goBack()} />
        </View>
        <View style={styles.centerBox}>
          <Text style={styles.errorText}>{error ?? "Espace introuvable"}</Text>
        </View>
      </SafeAreaView>
    );
  }

  const category = (espace.details?.category as string) ?? null;
  const accepterReservations = espace.details?.accepterReservations as boolean | undefined;

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.headerRow}>
        <Ionicons name="arrow-back" size={20} color={colors.textSecondary} onPress={() => navigation.goBack()} />
        <View style={styles.headerIconBox}>
          <Ionicons name="briefcase-outline" size={17} color={colors.accent} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>{espace.name}</Text>
          <Text style={styles.headerSubtitle}>Tableau de bord</Text>
        </View>
        <Ionicons
          name="settings-outline"
          size={19}
          color={colors.textSecondary}
          onPress={() => setShowEditProfile(true)}
        />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.infoCard}>
          {category && (
            <View style={styles.infoRow}>
              <Ionicons name="pricetag-outline" size={15} color={colors.textSecondary} />
              <Text style={styles.infoText}>{category}</Text>
            </View>
          )}
          <View style={styles.infoRow}>
            <Ionicons name="calendar-outline" size={15} color={colors.textSecondary} />
            <Text style={styles.infoText}>
              {accepterReservations ? "Réservations dans l'app activées" : "Contact par messagerie uniquement"}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons
              name={espace.subscriptionActive ? "checkmark-circle-outline" : "time-outline"}
              size={15}
              color={espace.subscriptionActive ? colors.accent : colors.secondary}
            />
            <Text
              style={[
                styles.infoText,
                { color: espace.subscriptionActive ? colors.accent : colors.secondary, fontWeight: "600" },
              ]}
            >
              Abonnement {espace.subscriptionActive ? "actif" : "en attente d'activation"}
            </Text>
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Demandes en attente</Text>
            <Text style={styles.statValue}>—</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Revenu du mois</Text>
            <Text style={[styles.statValue, { color: colors.accent }]}>—</Text>
          </View>
        </View>

        <View style={styles.actionsRow}>
          <Pressable style={styles.primaryAction} onPress={() => navigation.navigate("CreerPublication", { espaceId })}>
            <Ionicons name="add" size={16} color={colors.onAccent} />
            <Text style={styles.primaryActionText}>Nouveau service</Text>
          </Pressable>
          <Pressable style={styles.secondaryAction} onPress={() => navigation.navigate("LiveViewer")}>
            <Ionicons name="radio-outline" size={16} color={colors.danger} />
            <Text style={styles.secondaryActionText}>Live</Text>
          </Pressable>
        </View>

        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Réservations récentes</Text>
        </View>
        <View style={styles.comingSoonBox}>
          <Ionicons name="calendar-outline" size={20} color={colors.textMuted} />
          <Text style={styles.comingSoonText}>
            Le suivi des réservations arrivera avec le module Commandes, bientôt disponible.
          </Text>
        </View>

        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Mes services publiés</Text>
        </View>
        <Pressable
          style={styles.teamRow}
          onPress={() => navigation.navigate("GererPublications", { espaceId })}
        >
          <Ionicons name="images-outline" size={16} color={colors.textSecondary} />
          <Text style={styles.teamText}>Gérer mes publications</Text>
          <Ionicons name="chevron-forward" size={14} color={colors.textMuted} style={{ marginLeft: "auto" }} />
        </Pressable>

        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Groupes</Text>
        </View>
        {groups.length === 0 ? (
          <View style={styles.comingSoonBox}>
            <Ionicons name="people-outline" size={20} color={colors.textMuted} />
            <Text style={styles.comingSoonText}>Aucun groupe pour l'instant.</Text>
          </View>
        ) : (
          groups.map((group) => (
            <Pressable key={group.id} style={styles.teamRow} onPress={() => handleOpenGroup(group)}>
              <Ionicons
                name={group.type === "annonces" ? "megaphone-outline" : "people-outline"}
                size={16}
                color={colors.textSecondary}
              />
              <Text style={styles.teamText}>{group.name}</Text>
              <Ionicons name="chevron-forward" size={14} color={colors.textMuted} style={{ marginLeft: "auto" }} />
            </Pressable>
          ))
        )}
        <Pressable
          style={[styles.teamRow, { marginTop: spacing.sm }]}
          onPress={() => navigation.navigate("CreerGroupe", { espaceId })}
        >
          <Ionicons name="add-circle-outline" size={16} color={colors.accent} />
          <Text style={[styles.teamText, { color: colors.accent }]}>Créer un groupe</Text>
        </Pressable>
      </ScrollView>

      <Modal visible={showEditProfile} transparent animationType="fade">
        <View style={styles.modalOverlay}>
                   <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Modifier mon profil</Text>

            <Pressable style={styles.modalPhotoBox} onPress={handlePickPhoto}>
              {editPhotoUri || existingPhotoUrl ? (
                <Image
                  source={{ uri: editPhotoUri ?? getImageUrl(existingPhotoUrl) ?? undefined }}
                  style={styles.modalPhotoImage}
                />
              ) : (
                <Ionicons name="camera-outline" size={22} color={colors.textSecondary} />
              )}
            </Pressable>

            <Text style={styles.label}>Nom</Text>
            <TextInput
              style={styles.input}
              placeholder="Nom de l'espace"
              placeholderTextColor={colors.textMuted}
              value={editName}
              onChangeText={setEditName}
            />

            <TextInput
              style={[styles.input, styles.textarea]}
              placeholder="Bio"
              placeholderTextColor={colors.textMuted}
              value={editBio}
              onChangeText={setEditBio}
              multiline
            />
            <View style={styles.socialEditRow}>
              <Ionicons name="logo-whatsapp" size={16} color="#25D366" />
              <TextInput
                style={styles.socialEditInput}
                placeholder="Lien WhatsApp"
                placeholderTextColor={colors.textMuted}
                value={editWhatsapp}
                onChangeText={setEditWhatsapp}
                autoCapitalize="none"
              />
            </View>
            <View style={styles.socialEditRow}>
              <Ionicons name="logo-snapchat" size={16} color="#FFFC00" />
              <TextInput
                style={styles.socialEditInput}
                placeholder="Lien Snapchat"
                placeholderTextColor={colors.textMuted}
                value={editSnapchat}
                onChangeText={setEditSnapchat}
                autoCapitalize="none"
              />
            </View>
            <View style={styles.socialEditRow}>
              <Ionicons name="logo-linkedin" size={16} color="#0A66C2" />
              <TextInput
                style={styles.socialEditInput}
                placeholder="Lien LinkedIn"
                placeholderTextColor={colors.textMuted}
                value={editLinkedin}
                onChangeText={setEditLinkedin}
                autoCapitalize="none"
              />
            </View>
            <View style={styles.socialEditRow}>
              <Ionicons name="logo-tiktok" size={16} color={colors.textPrimary} />
              <TextInput
                style={styles.socialEditInput}
                placeholder="Lien TikTok"
                placeholderTextColor={colors.textMuted}
                value={editTiktok}
                onChangeText={setEditTiktok}
                autoCapitalize="none"
              />
            </View>

            <View style={styles.modalActions}>
              <Pressable style={styles.modalCancelButton} onPress={() => setShowEditProfile(false)}>
                <Text style={styles.modalCancelText}>Annuler</Text>
              </Pressable>
              <Pressable style={styles.modalSaveButton} onPress={handleSaveProfile} disabled={savingProfile}>
                          <Text style={styles.modalSaveText}>
                  {uploadingPhoto ? "Envoi..." : savingProfile ? "..." : "Enregistrer"}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
    modalPhotoBox: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.surface,
    alignSelf: "center",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md,
    overflow: "hidden",
  },
  modalPhotoImage: { width: "100%", height: "100%" },
  label: { fontSize: 12, color: colors.textSecondary, marginBottom: 6 },
  container: { flex: 1, backgroundColor: colors.background },
  centerBox: { flex: 1, alignItems: "center", justifyContent: "center" },
  errorText: { fontSize: 13, color: colors.danger },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  headerIconBox: {
    width: 34,
    height: 34,
    borderRadius: 9,
    backgroundColor: colors.accentBg,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: { fontSize: 15, fontWeight: "700", color: colors.textPrimary },
  headerSubtitle: { fontSize: 11, color: colors.textMuted },
  content: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xl },
  infoCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    gap: 8,
  },
  infoRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  infoText: { fontSize: 13, color: colors.textPrimary },
  statsRow: { flexDirection: "row", gap: spacing.sm, marginBottom: spacing.sm },
  statCard: { flex: 1, backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.md },
  statLabel: { fontSize: 11, color: colors.textSecondary, marginBottom: 4 },
  statValue: { fontSize: 20, fontWeight: "700", color: colors.textPrimary },
  actionsRow: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.sm, marginBottom: spacing.md },
  primaryAction: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: colors.accent,
    borderRadius: radius.md,
    paddingVertical: 11,
  },
  primaryActionText: { fontSize: 12, fontWeight: "600", color: colors.onAccent },
  secondaryAction: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: radius.md,
    paddingVertical: 11,
  },
  secondaryActionText: { fontSize: 12, fontWeight: "600", color: colors.textPrimary },
  sectionHeaderRow: { marginTop: spacing.md, marginBottom: spacing.sm },
  sectionTitle: { fontSize: 13, fontWeight: "700", color: colors.textPrimary },
  comingSoonBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  comingSoonText: { flex: 1, fontSize: 12, color: colors.textSecondary, lineHeight: 17 },
  teamRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    marginTop: spacing.sm,
  },
  teamText: { fontSize: 13, color: colors.textPrimary },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", alignItems: "center", justifyContent: "center", padding: spacing.lg },
  modalBox: { width: "100%", backgroundColor: colors.background, borderRadius: radius.md, padding: spacing.lg },
  modalTitle: { fontSize: 15, fontWeight: "600", color: colors.textPrimary, marginBottom: spacing.md },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    fontSize: 13,
    color: colors.textPrimary,
    backgroundColor: colors.surface,
    marginBottom: spacing.sm,
  },
  textarea: { height: 70, textAlignVertical: "top" },
  socialEditRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm, marginBottom: spacing.sm },
  socialEditInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    fontSize: 12,
    color: colors.textPrimary,
    backgroundColor: colors.surface,
  },
  modalActions: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.sm },
  modalCancelButton: { flex: 1, borderWidth: 1, borderColor: colors.borderStrong, borderRadius: radius.sm, paddingVertical: 10, alignItems: "center" },
  modalCancelText: { fontSize: 13, fontWeight: "600", color: colors.textPrimary },
  modalSaveButton: { flex: 1, backgroundColor: colors.accent, borderRadius: radius.sm, paddingVertical: 10, alignItems: "center" },
  modalSaveText: { fontSize: 13, fontWeight: "600", color: colors.onAccent },
});