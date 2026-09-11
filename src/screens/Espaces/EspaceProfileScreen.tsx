import React, { useCallback, useState } from "react";
import { ActivityIndicator, Image, Linking, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useNavigation, useRoute } from "@react-navigation/native";
import { NativeStackNavigationProp, NativeStackScreenProps } from "@react-navigation/native-stack";
import { colors, radius, spacing } from "@/theme/colors";
import { RootStackParamList } from "@/navigation/types";
import {
  EspaceResponse,
  getEspaceById,
  getSubscriptionStatus,
  subscribeToEspace,
  unsubscribeFromEspace,
} from "../../services/espaces.service";
import { ApiPublication, getFeed } from "../../services/publication.service";
import { ApiBadgeInfo, getBadgeInfo } from "../../services/badge.service";
import { ApiRequestError, getImageUrl, getUserId } from "../../services/api";
import { initialsFromName, startConversation } from "../../services/messaging.service";

type Props = NativeStackScreenProps<RootStackParamList, "ProfilEspace">;
type Nav = NativeStackNavigationProp<RootStackParamList>;

const SOCIAL_ICONS: { key: string; icon: keyof typeof Ionicons.glyphMap; color: string }[] = [
  { key: "whatsapp", icon: "logo-whatsapp", color: "#25D366" },
  { key: "snapchat", icon: "logo-snapchat", color: "#FFFC00" },
  { key: "linkedin", icon: "logo-linkedin", color: "#0A66C2" },
  { key: "tiktok", icon: "logo-tiktok", color: colors.textPrimary },
];

export function EspaceProfileScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Props["route"]>();
  const { espaceId } = route.params;

  const [espace, setEspace] = useState<EspaceResponse | null>(null);
  const [publications, setPublications] = useState<ApiPublication[]>([]);
  const [badge, setBadge] = useState<ApiBadgeInfo | null>(null);
  const [myUserId, setMyUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [contacting, setContacting] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [togglingSubscription, setTogglingSubscription] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [espaceData, pubsData, badgeData] = await Promise.all([
        getEspaceById(espaceId),
        getFeed(espaceId),
        getBadgeInfo(espaceId),
      ]);

      const uid = await getUserId();
      setMyUserId(uid);
      setEspace(espaceData);
      setPublications(pubsData);
      setBadge(badgeData);

      if (uid && espaceData.ownerId !== uid) {
        try {
          const status = await getSubscriptionStatus(espaceId);
          setSubscribed(status.subscribed);
        } catch {
          // pas grave si le statut n'a pas pu être chargé
        }
      }
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

  async function handleToggleSubscription() {
    if (togglingSubscription || !espace) return;
    setTogglingSubscription(true);
    try {
      if (subscribed) {
        await unsubscribeFromEspace(espaceId);
        setSubscribed(false);
      } else {
        await subscribeToEspace(espaceId);
        setSubscribed(true);
      }
    } catch {
      // en cas d'échec, on ne change pas l'état affiché
    } finally {
      setTogglingSubscription(false);
    }
  }

  async function handleContact() {
    if (!espace || contacting) return;
    setContacting(true);
    try {
      const conversation = await startConversation(espace.ownerId);
      navigation.navigate("Conversation", {
        conversationId: conversation.id,
        contactName: espace.name,
        contactInitials: initialsFromName(espace.name),
      });
    } catch {
      // en cas d'échec, on ne navigue simplement pas
    } finally {
      setContacting(false);
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

  const isMine = espace.ownerId === myUserId;
  const category = (espace.details?.category as string) ?? null;
  const socialLinks = SOCIAL_ICONS.map((s) => ({
    ...s,
    url: espace.details?.[s.key] as string | null,
  })).filter((s) => !!s.url);
  const portfolio = espace.details?.lienPortfolio as string | null;

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.headerRow}>
        <Ionicons name="arrow-back" size={20} color={colors.textSecondary} onPress={() => navigation.goBack()} />
        <Text style={styles.headerTitle}>Profil</Text>
        <View style={{ width: 20 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.profileHeader}>
          {espace.photoUrl ? (
            <Image source={{ uri: getImageUrl(espace.photoUrl) ?? undefined }} style={styles.avatarImage} />
          ) : (
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initialsFromName(espace.name)}</Text>
            </View>
          )}
          <Text style={styles.name}>{espace.name}</Text>
          {category && <Text style={styles.category}>{category}</Text>}
          {badge?.level && (
            <View style={styles.badgeRow}>
              <Ionicons
                name="shield-checkmark"
                size={14}
                color={badge.level === "or" ? "#B8862B" : badge.level === "argent" ? "#8C8C8C" : "#A9691E"}
              />
              <Text style={styles.badgeText}>
                Badge {badge.level === "or" ? "Or" : badge.level === "argent" ? "Argent" : "Bronze"}
              </Text>
              {badge.reviewCount > 0 && (
                <>
                  <Ionicons name="star" size={12} color="#EAB308" style={{ marginLeft: 8 }} />
                  <Text style={styles.badgeText}>
                    {badge.averageRating} ({badge.reviewCount})
                  </Text>
                </>
              )}
            </View>
          )}
        </View>

        {espace.description && (
          <View style={styles.bioBox}>
            <Text style={styles.bioText}>{espace.description}</Text>
          </View>
        )}

        {(socialLinks.length > 0 || portfolio) && (
          <View style={styles.socialsRow}>
            {socialLinks.map((s) => (
              <Pressable key={s.key} style={styles.socialButton} onPress={() => Linking.openURL(s.url!)}>
                <Ionicons name={s.icon} size={20} color={s.color} />
              </Pressable>
            ))}
            {portfolio && (
              <Pressable style={styles.socialButton} onPress={() => Linking.openURL(portfolio)}>
                <Ionicons name="link-outline" size={20} color={colors.accent} />
              </Pressable>
            )}
          </View>
        )}

        {espace.location && (
          <View style={styles.locationRow}>
            <Ionicons name="location-outline" size={14} color={colors.textMuted} />
            <Text style={styles.locationText}>{espace.location}</Text>
          </View>
        )}
        {!isMine && (
          <Pressable
            style={[styles.subscribeButton, subscribed && styles.subscribeButtonActive]}
            onPress={handleToggleSubscription}
            disabled={togglingSubscription}
          >
            <Ionicons
              name={subscribed ? "notifications" : "notifications-outline"}
              size={16}
              color={subscribed ? colors.accent : colors.textSecondary}
            />
            <Text style={[styles.subscribeButtonText, subscribed && styles.subscribeButtonTextActive]}>
              {togglingSubscription ? "..." : subscribed ? "Abonné" : "S'abonner"}
            </Text>
          </Pressable>
        )}
        {!isMine && (
          <View style={styles.actionRow}>
            <Pressable
              style={[styles.contactButton, { flex: 1, marginBottom: 0 }]}
              onPress={handleContact}
              disabled={contacting}
            >
              <Ionicons name="chatbubble-outline" size={16} color={colors.onAccent} />
              <Text style={styles.contactButtonText}>{contacting ? "..." : "Contacter"}</Text>
            </Pressable>
            {espace.type === "agence_cargo" && (
              <Pressable
                style={styles.quoteButton}
                onPress={() => navigation.navigate("DemandeDevisCargo")}
              >
                <Ionicons name="document-text-outline" size={16} color={colors.accent} />
                <Text style={styles.quoteButtonText}>Devis</Text>
              </Pressable>
            )}
            {espace.type === "transitaire" && (
              <Pressable
                style={styles.quoteButton}
                onPress={() => navigation.navigate("DemandeDevisTransitaire")}
              >
                <Ionicons name="document-text-outline" size={16} color={colors.accent} />
                <Text style={styles.quoteButtonText}>Devis</Text>
              </Pressable>
            )}
          </View>
        )}

        <Text style={styles.sectionTitle}>Publications ({publications.length})</Text>
        {publications.length === 0 ? (
          <Text style={styles.emptyText}>Aucune publication pour l'instant.</Text>
        ) : (
          publications.map((pub) => {
            const fullImageUrl = getImageUrl(pub.imageUrl);
            return (
              <View key={pub.id} style={styles.pubCard}>
                {fullImageUrl && <View style={styles.pubImagePlaceholder} />}
                <Text style={styles.pubTitle}>{pub.title}</Text>
                {pub.price && (
                  <Text style={styles.pubPrice}>{Number(pub.price).toLocaleString("fr-FR")} F</Text>
                )}
              </View>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  centerBox: { flex: 1, alignItems: "center", justifyContent: "center" },
  errorText: { fontSize: 13, color: colors.danger },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  headerTitle: { fontSize: 16, fontWeight: "600", color: colors.textPrimary },
  content: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xl },
  profileHeader: { alignItems: "center", marginBottom: spacing.md },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.accentBg,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.sm,
  },
  avatarText: { fontSize: 22, fontWeight: "700", color: colors.accent },
    avatarImage: { width: 72, height: 72, borderRadius: 36, marginBottom: spacing.sm },
  name: { fontSize: 18, fontWeight: "700", color: colors.textPrimary },
  category: { fontSize: 12, color: colors.secondary, marginTop: 2, fontWeight: "600" },
  badgeRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: spacing.sm },
  badgeText: { fontSize: 12, color: colors.textSecondary, fontWeight: "600" },
  bioBox: { backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.md },
  bioText: { fontSize: 13, color: colors.textPrimary, lineHeight: 19 },
  socialsRow: { flexDirection: "row", gap: spacing.sm, marginBottom: spacing.md },
  socialButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  locationRow: { flexDirection: "row", alignItems: "center", gap: 4, marginBottom: spacing.md },
  locationText: { fontSize: 12, color: colors.textMuted },
  actionRow: { flexDirection: "row", gap: spacing.sm, marginBottom: spacing.lg },
  subscribeButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingVertical: 10,
    marginBottom: spacing.sm,
  },
  subscribeButtonActive: { borderColor: colors.accent, backgroundColor: colors.accentBg },
  subscribeButtonText: { fontSize: 13, fontWeight: "600", color: colors.textSecondary },
  subscribeButtonTextActive: { color: colors.accent },
  contactButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: colors.accent,
    borderRadius: radius.sm,
    paddingVertical: 12,
  },
  contactButtonText: { fontSize: 14, fontWeight: "600", color: colors.onAccent },
  quoteButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: colors.accent,
    borderRadius: radius.sm,
    paddingVertical: 12,
    paddingHorizontal: spacing.md,
  },
  quoteButtonText: { fontSize: 13, fontWeight: "600", color: colors.accent },
  sectionTitle: { fontSize: 14, fontWeight: "700", color: colors.textPrimary, marginBottom: spacing.sm },
  emptyText: { fontSize: 13, color: colors.textMuted },
  pubCard: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  pubImagePlaceholder: { width: "100%", height: 120, borderRadius: radius.sm, backgroundColor: colors.surface, marginBottom: spacing.sm },
  pubTitle: { fontSize: 13, fontWeight: "600", color: colors.textPrimary },
  pubPrice: { fontSize: 13, fontWeight: "700", color: colors.accent, marginTop: 4 },
});