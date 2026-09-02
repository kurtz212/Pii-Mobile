import React, { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { colors, radius, spacing } from "@/theme/colors";
import { RootStackParamList } from "@/navigation/types";
import { EspaceResponse, getEspacesPublic } from "../../services/espaces.service";
import { ApiRequestError, getUserId } from "../../services/api";
import { initialsFromName, startConversation } from "../../services/messaging.service";
import { ApiBadgeInfo, getBadgeInfo } from "../../services/badge.service";

type Nav = NativeStackNavigationProp<RootStackParamList>;

const TYPES = [
  { value: "boutique", label: "Boutiques", icon: "storefront-outline" as const },
  { value: "entrepreneur", label: "Entrepreneurs", icon: "briefcase-outline" as const },
  { value: "agence_livraison", label: "Agences livraison", icon: "car-outline" as const },
  { value: "agence_cargo", label: "Agences cargo", icon: "cube-outline" as const },
  { value: "transitaire", label: "Transitaires", icon: "document-text-outline" as const },
];

export function AnnuaireScreen() {
  const navigation = useNavigation<Nav>();
  const [activeType, setActiveType] = useState("boutique");
  const [espaces, setEspaces] = useState<EspaceResponse[]>([]);
  const [badges, setBadges] = useState<Record<string, ApiBadgeInfo>>({});
  const [myUserId, setMyUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [contactingId, setContactingId] = useState<string | null>(null);

  const load = useCallback(async (type: string) => {
    setLoading(true);
    setError(null);
    try {
      const uid = await getUserId();
      const data = await getEspacesPublic(type);
      setMyUserId(uid);
      setEspaces(data);
      const badgeEntries = await Promise.all(
        data.map(async (e) => [e.id, await getBadgeInfo(e.id)] as const),
      );
      setBadges(Object.fromEntries(badgeEntries));
    } catch (err: unknown) {
      setError(err instanceof ApiRequestError ? err.message : "Erreur de chargement");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(activeType);
  }, [activeType, load]);

  async function handleContact(espace: EspaceResponse) {
    if (contactingId) return;
    setContactingId(espace.id);
    try {
      const conversation = await startConversation(espace.ownerId);
      navigation.navigate("Conversation", {
        conversationId: conversation.id,
        contactName: espace.name,
        contactInitials: initialsFromName(espace.name),
      });
    } catch (err: unknown) {
      // en cas d'échec on ne navigue simplement pas
    } finally {
      setContactingId(null);
    }
  }

  const categories = Array.from(
    new Set(
      espaces
        .map((e) => (e.details?.category as string) ?? null)
        .filter((c): c is string => !!c),
    ),
  );

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.headerRow}>
        <Ionicons name="arrow-back" size={20} color={colors.textSecondary} onPress={() => navigation.goBack()} />
        <Text style={styles.headerTitle}>Annuaire</Text>
        <View style={{ width: 20 }} />
      </View>

      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={TYPES}
        keyExtractor={(item) => item.value}
        contentContainerStyle={styles.typeTabs}
        renderItem={({ item }) => {
          const active = activeType === item.value;
          return (
            <Pressable
              style={[styles.typeTab, active && styles.typeTabActive]}
              onPress={() => setActiveType(item.value)}
            >
              <Ionicons name={item.icon} size={14} color={active ? colors.onAccent : colors.textSecondary} />
              <Text style={[styles.typeTabText, active && styles.typeTabTextActive]}>{item.label}</Text>
            </Pressable>
          );
        }}
      />

      {categories.length > 0 && (
        <Text style={styles.categoryHint}>Catégories : {categories.join(" · ")}</Text>
      )}

      {loading && (
        <View style={styles.centerBox}>
          <ActivityIndicator color={colors.accent} />
        </View>
      )}

      {!loading && error && (
        <View style={styles.centerBox}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {!loading && !error && (
        <FlatList
          data={espaces}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <Text style={styles.emptyText}>Aucun résultat pour cette catégorie pour le moment.</Text>
          }
          renderItem={({ item }) => {
            const category = (item.details?.category as string) ?? null;
            const isMine = item.ownerId === myUserId;
            const badge = badges[item.id];
            return (
              <View style={styles.card}>
                <Pressable
                  onPress={() => navigation.navigate("ProfilEspace", { espaceId: item.id })}
                >
                  <View style={styles.cardTop}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 6, flex: 1 }}>
                      <Text style={styles.cardName}>{item.name}</Text>
                      {badge?.level && (
                        <Ionicons
                          name="shield-checkmark"
                          size={14}
                          color={
                            badge.level === "or"
                              ? "#B8862B"
                              : badge.level === "argent"
                                ? "#8C8C8C"
                                : "#A9691E"
                          }
                        />
                      )}
                    </View>
                    {item.subscriptionActive && (
                      <View style={styles.badgeActive}>
                        <Text style={styles.badgeActiveText}>Actif</Text>
                      </View>
                    )}
                  </View>
                  {badge?.reviewCount ? (
                    <View style={styles.ratingRow}>
                      <Ionicons name="star" size={11} color="#EAB308" />
                      <Text style={styles.ratingText}>
                        {badge.averageRating} ({badge.reviewCount} avis)
                      </Text>
                    </View>
                  ) : null}
                  {category && <Text style={styles.cardCategory}>{category}</Text>}
                  {item.location && (
                    <View style={styles.locationRow}>
                      <Ionicons name="location-outline" size={12} color={colors.textMuted} />
                      <Text style={styles.cardLocation}>{item.location}</Text>
                    </View>
                  )}
                </Pressable>

                <View style={styles.cardActionsRow}>
                  <Pressable
                    style={styles.profileButton}
                    onPress={() => navigation.navigate("ProfilEspace", { espaceId: item.id })}
                  >
                    <Ionicons name="person-outline" size={13} color={colors.textSecondary} />
                    <Text style={styles.profileButtonText}>Voir le profil</Text>
                  </Pressable>
                  {!isMine && (
                    <Pressable
                      style={styles.contactButton}
                      onPress={() => handleContact(item)}
                      disabled={contactingId === item.id}
                    >
                      <Ionicons name="chatbubble-outline" size={13} color={colors.accent} />
                      <Text style={styles.contactButtonText}>
                        {contactingId === item.id ? "..." : "Contacter"}
                      </Text>
                    </Pressable>
                  )}
                </View>
              </View>
            );
          }}
        />
      )}
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
  typeTabs: { paddingHorizontal: spacing.lg, gap: spacing.sm, paddingBottom: spacing.sm },
  typeTab: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
  },
  typeTabActive: { backgroundColor: colors.accent },
  typeTabText: { fontSize: 12, color: colors.textSecondary, fontWeight: "600" },
  typeTabTextActive: { color: colors.onAccent },
  categoryHint: {
    fontSize: 11,
    color: colors.textMuted,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
  },
  centerBox: { flex: 1, alignItems: "center", justifyContent: "center" },
  errorText: { fontSize: 13, color: colors.danger },
  emptyText: { fontSize: 13, color: colors.textMuted, textAlign: "center", marginTop: spacing.xl },
  list: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xl, gap: spacing.sm },
  card: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  cardTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  cardName: { fontSize: 14, fontWeight: "600", color: colors.textPrimary },
  badgeActive: { backgroundColor: colors.accentBg, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  badgeActiveText: { fontSize: 10, fontWeight: "600", color: colors.accent },
  ratingRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 },
  ratingText: { fontSize: 11, color: colors.textMuted },
  cardCategory: { fontSize: 12, color: colors.secondary, marginTop: 4, fontWeight: "600" },
  locationRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 },
  cardLocation: { fontSize: 12, color: colors.textMuted },
  cardActionsRow: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.sm },
  profileButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.sm,
    backgroundColor: colors.surface,
  },
  profileButtonText: { fontSize: 12, fontWeight: "600", color: colors.textSecondary },
  contactButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.sm,
    backgroundColor: colors.accentBg,
  },
  contactButtonText: { fontSize: 12, fontWeight: "600", color: colors.accent },
});