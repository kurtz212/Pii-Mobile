
import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, View, ViewStyle } from "react-native";
import { colors, radius } from "@/theme/colors";

export function SkeletonBox({ style }: { style?: ViewStyle | ViewStyle[] }) {
  const opacity = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.4, duration: 700, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);

  return <Animated.View style={[styles.base, style, { opacity }]} />;
}

// Silhouette d'une carte de publication (fil d'accueil / annuaire)
export function SkeletonPublicationCard() {
  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <SkeletonBox style={styles.avatar} />
        <View style={{ flex: 1, gap: 6 }}>
          <SkeletonBox style={{ height: 12, width: "50%", borderRadius: 4 }} />
          <SkeletonBox style={{ height: 10, width: "35%", borderRadius: 4 }} />
        </View>
      </View>
      <SkeletonBox style={styles.media} />
      <SkeletonBox style={{ height: 14, width: "60%", borderRadius: 4, marginTop: 10 }} />
    </View>
  );
}

// Silhouette d'une ligne de conversation
export function SkeletonConversationRow() {
  return (
    <View style={styles.rowContainer}>
      <SkeletonBox style={styles.avatarSmall} />
      <View style={{ flex: 1, gap: 6 }}>
        <SkeletonBox style={{ height: 12, width: "40%", borderRadius: 4 }} />
        <SkeletonBox style={{ height: 10, width: "70%", borderRadius: 4 }} />
      </View>
    </View>
  );
}

// Silhouette d'une carte d'annuaire (boutique/espace)
export function SkeletonEspaceCard() {
  return (
    <View style={styles.espaceCard}>
      <SkeletonBox style={styles.avatarSmall} />
      <View style={{ flex: 1, gap: 6 }}>
        <SkeletonBox style={{ height: 12, width: "55%", borderRadius: 4 }} />
        <SkeletonBox style={{ height: 10, width: "40%", borderRadius: 4 }} />
      </View>
    </View>
  );
}

// Silhouette générique pour un profil (avatar rond + lignes)
export function SkeletonProfileHeader() {
  return (
    <View style={{ alignItems: "center", paddingVertical: 20 }}>
      <SkeletonBox style={styles.avatarLarge} />
      <SkeletonBox style={{ height: 16, width: 140, borderRadius: 4, marginTop: 12 }} />
      <SkeletonBox style={{ height: 11, width: 100, borderRadius: 4, marginTop: 8 }} />
    </View>
  );
}

const styles = StyleSheet.create({
  base: { backgroundColor: colors.border },
  card: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: 12,
    marginBottom: 12,
  },
  headerRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 10 },
  avatar: { width: 36, height: 36, borderRadius: 18 },
  avatarSmall: { width: 40, height: 40, borderRadius: 20 },
  avatarLarge: { width: 80, height: 80, borderRadius: 40 },
  media: { width: "100%", height: 180, borderRadius: 8 },
  rowContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  espaceCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: 12,
    marginBottom: 10,
  },
});