import React, { useCallback, useMemo, useState } from "react";
import { ActivityIndicator, FlatList, Image, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { Video, ResizeMode } from "expo-av";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { colors, radius, spacing } from "@/theme/colors";
import { RootStackParamList } from "@/navigation/types";
import { ApiPublication, getFeed } from "../../services/publication.service";
import { ApiRequestError, getImageUrl } from "../../services/api";

type Nav = NativeStackNavigationProp<RootStackParamList>;

const CATEGORIES = ["Mode", "Électronique", "Alimentation", "Services"];

const avatarColors = [
  { bg: colors.tealBg, fg: colors.teal },
  { bg: colors.coralBg, fg: colors.coral },
  { bg: colors.purpleBg, fg: colors.purple },
];

function colorForName(name: string) {
  const sum = name.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return avatarColors[sum % avatarColors.length];
}

function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last).toUpperCase();
}

export function HomeScreen() {
  const navigation = useNavigation<Nav>();
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [publications, setPublications] = useState<ApiPublication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;

      async function load() {
        setLoading(true);
        setError(null);
        try {
          const data = await getFeed();
          if (!cancelled) setPublications(data);
        } catch (err: unknown) {
          if (!cancelled) {
            setError(err instanceof ApiRequestError ? err.message : "Erreur de chargement");
          }
        } finally {
          if (!cancelled) setLoading(false);
        }
      }

      load();
      return () => {
        cancelled = true;
      };
    }, []),
  );

  const filteredPublications = useMemo(() => {
    let list = publications;
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      list = list.filter(
        (pub) => pub.title.toLowerCase().includes(q) || pub.espace.name.toLowerCase().includes(q),
      );
    }
    if (activeCategory) {
      list = list.filter((pub) => pub.espace.details?.category === activeCategory);
    }
    return list;
  }, [publications, query, activeCategory]);

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.headerRow}>
        <Text style={styles.logo}>Pii</Text>
        <View style={{ flexDirection: "row", gap: 14, alignItems: "center" }}>
          <Ionicons
            name="grid-outline"
            size={20}
            color={colors.textSecondary}
            onPress={() => navigation.navigate("Annuaire")}
          />
          <Ionicons name="notifications-outline" size={22} color={colors.textSecondary} />
        </View>
      </View>

      <View style={styles.searchBar}>
        <Ionicons name="search" size={18} color={colors.textMuted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Rechercher un article, une boutique..."
          placeholderTextColor={colors.textMuted}
          value={query}
          onChangeText={setQuery}
          returnKeyType="search"
        />
      </View>

      <FlatList
        horizontal
        data={CATEGORIES}
        keyExtractor={(item) => item}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoryList}
        renderItem={({ item }) => {
          const active = activeCategory === item;
          return (
            <Text
              onPress={() => setActiveCategory(active ? null : item)}
              style={[styles.categoryChip, active && styles.categoryChipActive]}
            >
              {item}
            </Text>
          );
        }}
      />

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
          data={filteredPublications}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => {
            const initials = initialsFromName(item.espace.name);
            const palette = colorForName(item.espace.name);
            const category = item.espace.details?.category as string | undefined;
            const fullImageUrl = getImageUrl(item.imageUrl);
            const fullVideoUrl = getImageUrl(item.videoUrl);
            const hasPrice = item.price !== null;

            return (
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <View style={[styles.avatar, { backgroundColor: palette.bg }]}>
                    <Text style={[styles.avatarText, { color: palette.fg }]}>{initials}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={styles.nameRow}>
                      <Text style={styles.name}>{item.espace.name}</Text>
                      {item.espace.subscriptionActive && (
                        <View style={styles.badgeActive}>
                          <Text style={styles.badgeActiveText}>Actif</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.location}>
                      {category ? `${category} · ` : ""}
                      {item.espace.location ?? ""}
                    </Text>
                  </View>
                </View>

                {item.contentType === "image" && fullImageUrl && (
                  <Image source={{ uri: fullImageUrl }} style={styles.mediaBox} />
                )}

                {item.contentType === "video" && fullVideoUrl && (
                  <Video
                    source={{ uri: fullVideoUrl }}
                    style={styles.mediaBox}
                    resizeMode={ResizeMode.COVER}
                    useNativeControls
                    isLooping
                  />
                )}

                {item.contentType === "text" && (
                  <View style={styles.textCard}>
                    <Ionicons name="megaphone-outline" size={18} color={colors.accent} style={{ marginBottom: 6 }} />
                    {item.description && <Text style={styles.textCardBody}>{item.description}</Text>}
                  </View>
                )}

                <View style={styles.priceRow}>
                  <Text style={styles.title}>{item.title}</Text>
                  {hasPrice && (
                    <Text style={styles.price}>{Number(item.price).toLocaleString("fr-FR")} F</Text>
                  )}
                </View>

                {item.contentType === "image" && item.description && (
                  <Text style={styles.description} numberOfLines={2}>
                    {item.description}
                  </Text>
                )}

                {item.tranchesActivees && (
                  <Text style={styles.tranches}>Paiement par tranches disponible</Text>
                )}

                {hasPrice && (
                  <Pressable
                    style={styles.orderButton}
                    onPress={() =>
                      navigation.navigate("Commander", {
                        publicationId: item.id,
                        title: item.title,
                        price: Number(item.price),
                        tranchesActivees: item.tranchesActivees,
                      })
                    }
                  >
                    <Text style={styles.orderButtonText}>Commander</Text>
                  </Pressable>
                )}
              </View>
            );
          }}
          ListEmptyComponent={
            <View style={styles.centerBox}>
              <Text style={styles.emptyText}>Aucun article ne correspond à cette recherche.</Text>
            </View>
          }
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
  logo: { fontSize: 20, fontWeight: "700", color: colors.textPrimary },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  searchInput: { flex: 1, fontSize: 14, color: colors.textPrimary, padding: 0 },
  categoryList: { paddingHorizontal: spacing.lg, gap: spacing.sm, paddingBottom: spacing.md },
  categoryChip: {
    fontSize: 12,
    color: colors.textSecondary,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.pill,
    overflow: "hidden",
  },
  categoryChipActive: { color: colors.accent, backgroundColor: colors.accentBg },
  centerBox: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: spacing.xl },
  errorText: { fontSize: 13, color: colors.danger },
  emptyText: { fontSize: 13, color: colors.textMuted, textAlign: "center" },
  card: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  cardHeader: { flexDirection: "row", alignItems: "center", gap: spacing.sm, marginBottom: spacing.sm },
  avatar: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  avatarText: { fontSize: 12, fontWeight: "600" },
  nameRow: { flexDirection: "row", alignItems: "center", gap: spacing.xs },
  name: { fontSize: 14, fontWeight: "600", color: colors.textPrimary },
  badgeActive: { backgroundColor: colors.accentBg, paddingHorizontal: 6, paddingVertical: 1, borderRadius: 6 },
  badgeActiveText: { fontSize: 9, fontWeight: "600", color: colors.accent },
  location: { fontSize: 12, color: colors.textMuted },
  mediaBox: {
    width: "100%",
    height: 200,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
  },
  textCard: {
    width: "100%",
    backgroundColor: colors.accentBg,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  textCardBody: { fontSize: 13, color: colors.textPrimary, lineHeight: 19 },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: spacing.sm,
  },
  title: { fontSize: 14, fontWeight: "600", color: colors.textPrimary, flex: 1 },
  price: { fontSize: 14, fontWeight: "600", color: colors.textPrimary },
  description: { fontSize: 12, color: colors.textSecondary, marginTop: 4, lineHeight: 17 },
  tranches: { fontSize: 11, color: colors.secondary, marginTop: 4 },
  orderButton: {
    backgroundColor: colors.accent,
    borderRadius: radius.sm,
    paddingVertical: 9,
    alignItems: "center",
    marginTop: spacing.sm,
  },
  orderButtonText: { fontSize: 13, fontWeight: "600", color: colors.onAccent },
});