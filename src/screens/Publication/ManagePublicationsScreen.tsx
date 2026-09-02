import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useNavigation, useRoute } from "@react-navigation/native";
import { NativeStackNavigationProp, NativeStackScreenProps } from "@react-navigation/native-stack";
import { colors, radius, spacing } from "@/theme/colors";
import { RootStackParamList } from "@/navigation/types";
import { ApiPublication, getMyPublications, updatePublication } from "../../services/publication.service";
import { ApiRequestError, getImageUrl } from "../../services/api";

type Props = NativeStackScreenProps<RootStackParamList, "GererPublications">;
type Nav = NativeStackNavigationProp<RootStackParamList>;

export function ManagePublicationsScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Props["route"]>();
  const { espaceId } = route.params;

  const [publications, setPublications] = useState<ApiPublication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const [editTarget, setEditTarget] = useState<ApiPublication | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editPrice, setEditPrice] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getMyPublications(espaceId);
      setPublications(data);
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

  async function handleTogglePause(pub: ApiPublication) {
    setTogglingId(pub.id);
    try {
      await updatePublication(pub.id, { isPaused: !pub.isPaused });
      await load();
    } catch {
      // en cas d'échec, la liste reste inchangée
    } finally {
      setTogglingId(null);
    }
  }

  function openEdit(pub: ApiPublication) {
    setEditTarget(pub);
    setEditTitle(pub.title);
    setEditDescription(pub.description ?? "");
    setEditPrice(pub.price ?? "");
  }

  async function handleSaveEdit() {
    if (!editTarget) return;
    setSaving(true);
    try {
      const priceNumber = Number(editPrice.replace(/\s/g, ""));
      await updatePublication(editTarget.id, {
        title: editTitle.trim(),
        description: editDescription.trim() || undefined,
        price: priceNumber > 0 ? priceNumber : undefined,
      });
      setEditTarget(null);
      await load();
    } catch {
      // en cas d'échec, la modale reste ouverte
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
        <Text style={styles.headerTitle}>Mes publications</Text>
        <View style={{ width: 20 }} />
      </View>

      {error && (
        <View style={styles.centerBox}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {!error && (
        <FlatList
          data={publications}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.centerBox}>
              <Text style={styles.emptyText}>Aucune publication pour l'instant.</Text>
            </View>
          }
          renderItem={({ item }) => {
            const fullImageUrl = getImageUrl(item.imageUrl);
            return (
              <View style={[styles.card, item.isPaused && styles.cardPaused]}>
                <View style={styles.cardTop}>
                  <Text style={styles.cardTitle} numberOfLines={1}>
                    {item.title}
                  </Text>
                  {item.isPaused && (
                    <View style={styles.pausedBadge}>
                      <Text style={styles.pausedBadgeText}>En pause</Text>
                    </View>
                  )}
                </View>
                {item.price && (
                  <Text style={styles.cardPrice}>{Number(item.price).toLocaleString("fr-FR")} F</Text>
                )}
                <View style={styles.cardActions}>
                  <Pressable style={styles.editButton} onPress={() => openEdit(item)}>
                    <Ionicons name="create-outline" size={14} color={colors.accent} />
                    <Text style={styles.editButtonText}>Modifier</Text>
                  </Pressable>
                  <Pressable
                    style={styles.pauseButton}
                    onPress={() => handleTogglePause(item)}
                    disabled={togglingId === item.id}
                  >
                    <Ionicons
                      name={item.isPaused ? "play-outline" : "pause-outline"}
                      size={14}
                      color={colors.textSecondary}
                    />
                    <Text style={styles.pauseButtonText}>
                      {togglingId === item.id ? "..." : item.isPaused ? "Réactiver" : "Mettre en pause"}
                    </Text>
                  </Pressable>
                </View>
              </View>
            );
          }}
        />
      )}

      <Modal visible={editTarget !== null} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Modifier la publication</Text>
            <TextInput
              style={styles.input}
              placeholder="Titre"
              placeholderTextColor={colors.textMuted}
              value={editTitle}
              onChangeText={setEditTitle}
            />
            <TextInput
              style={[styles.input, styles.textarea]}
              placeholder="Description"
              placeholderTextColor={colors.textMuted}
              value={editDescription}
              onChangeText={setEditDescription}
              multiline
            />
            <TextInput
              style={styles.input}
              placeholder="Prix (F CFA)"
              placeholderTextColor={colors.textMuted}
              value={editPrice}
              onChangeText={setEditPrice}
              keyboardType="numeric"
            />
            <View style={styles.modalActions}>
              <Pressable style={styles.modalCancelButton} onPress={() => setEditTarget(null)}>
                <Text style={styles.modalCancelText}>Annuler</Text>
              </Pressable>
              <Pressable style={styles.modalSaveButton} onPress={handleSaveEdit} disabled={saving}>
                <Text style={styles.modalSaveText}>{saving ? "..." : "Enregistrer"}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
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
  centerBox: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: spacing.xl },
  errorText: { fontSize: 13, color: colors.danger },
  emptyText: { fontSize: 13, color: colors.textMuted, textAlign: "center" },
  list: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm },
  card: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  cardPaused: { backgroundColor: colors.surface, opacity: 0.75 },
  cardTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  cardTitle: { fontSize: 14, fontWeight: "600", color: colors.textPrimary, flex: 1 },
  pausedBadge: { backgroundColor: colors.secondaryBg, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  pausedBadgeText: { fontSize: 10, fontWeight: "600", color: colors.secondary },
  cardPrice: { fontSize: 15, fontWeight: "700", color: colors.textPrimary, marginTop: 4 },
  cardActions: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.sm },
  editButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: radius.sm,
    backgroundColor: colors.accentBg,
  },
  editButtonText: { fontSize: 11, fontWeight: "600", color: colors.accent },
  pauseButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: radius.sm,
    backgroundColor: colors.surface,
  },
  pauseButtonText: { fontSize: 11, fontWeight: "600", color: colors.textSecondary },
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
  modalActions: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.sm },
  modalCancelButton: { flex: 1, borderWidth: 1, borderColor: colors.borderStrong, borderRadius: radius.sm, paddingVertical: 10, alignItems: "center" },
  modalCancelText: { fontSize: 13, fontWeight: "600", color: colors.textPrimary },
  modalSaveButton: { flex: 1, backgroundColor: colors.accent, borderRadius: radius.sm, paddingVertical: 10, alignItems: "center" },
  modalSaveText: { fontSize: 13, fontWeight: "600", color: colors.onAccent },
});