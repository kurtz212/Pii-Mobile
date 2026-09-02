import React from "react";
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { colors, radius, spacing } from "@/theme/colors";
import { mockLiveComments, mockLiveSession } from "@/data/mockData";
import { Avatar } from "@/components/Avatar";
import { RootStackParamList } from "@/navigation/types";

type Nav = NativeStackNavigationProp<RootStackParamList>;

export function LiveViewerScreen() {
  const navigation = useNavigation<Nav>();
  const live = mockLiveSession;

  return (
    <View style={styles.container}>
      {/* Zone vidéo — à remplacer par le lecteur du service de streaming
          managé (ex: Agora / Mux) une fois intégré. */}
      <View style={styles.videoPlaceholder}>
        <Ionicons name="videocam-outline" size={40} color="rgba(255,255,255,0.3)" />
      </View>

      <SafeAreaView style={styles.overlay} edges={["top", "bottom"]}>
        <View style={styles.topBar}>
          <View style={styles.hostInfo}>
            <Avatar initials={live.host.initials} colorKey={live.host.colorKey} size={36} />
            <View>
              <View style={styles.hostNameRow}>
                <Text style={styles.hostName}>{live.host.name}</Text>
                <View style={styles.liveBadge}>
                  <Text style={styles.liveBadgeText}>DIRECT</Text>
                </View>
              </View>
              <View style={styles.viewerRow}>
                <Ionicons name="eye-outline" size={12} color="rgba(255,255,255,0.8)" />
                <Text style={styles.viewerCount}>{live.viewerCount} spectateurs</Text>
              </View>
            </View>
          </View>
          <Ionicons name="close" size={26} color="#FFFFFF" onPress={() => navigation.goBack()} />
        </View>

        <View style={styles.spacer} />

        <Pressable style={styles.productCard}>
          <View style={styles.productImagePlaceholder}>
            <Ionicons name="image-outline" size={18} color={colors.textMuted} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.productTitle}>{live.featuredProduct.title}</Text>
            <Text style={styles.productPrice}>
              {live.featuredProduct.price.toLocaleString("fr-FR")} F
            </Text>
          </View>
          <View style={styles.orderButton}>
            <Text style={styles.orderButtonText}>Commander</Text>
          </View>
        </Pressable>

        <View style={styles.bottomRow}>
          <View style={styles.chatColumn}>
            <FlatList
              data={mockLiveComments}
              keyExtractor={(item) => item.id}
              inverted
              contentContainerStyle={styles.chatList}
              renderItem={({ item }) => (
                <Text style={styles.chatLine}>
                  <Text style={styles.chatAuthor}>{item.authorName} </Text>
                  {item.text}
                </Text>
              )}
            />
            <View style={styles.chatInputRow}>
              <TextInput
                style={styles.chatInput}
                placeholder="Écrire un commentaire..."
                placeholderTextColor="rgba(255,255,255,0.6)"
              />
            </View>
          </View>
          <View style={styles.actionsColumn}>
            <View style={styles.actionButton}>
              <Ionicons name="heart-outline" size={24} color="#FFFFFF" />
            </View>
            <View style={styles.actionButton}>
              <Ionicons name="share-outline" size={22} color="#FFFFFF" />
            </View>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0A0A0A" },
  videoPlaceholder: { ...StyleSheet.absoluteFillObject, alignItems: "center", justifyContent: "center" },
  overlay: { flex: 1, justifyContent: "space-between" },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  hostInfo: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  hostNameRow: { flexDirection: "row", alignItems: "center", gap: spacing.xs },
  hostName: { fontSize: 14, fontWeight: "600", color: "#FFFFFF" },
  liveBadge: { backgroundColor: colors.danger, paddingHorizontal: 6, paddingVertical: 1, borderRadius: 4 },
  liveBadgeText: { fontSize: 9, fontWeight: "700", color: "#FFFFFF" },
  viewerRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 },
  viewerCount: { fontSize: 11, color: "rgba(255,255,255,0.8)" },
  spacer: { flex: 1 },
  productCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: "rgba(255,255,255,0.95)",
    borderRadius: radius.md,
    padding: spacing.sm,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  productImagePlaceholder: {
    width: 40,
    height: 40,
    borderRadius: radius.sm,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  productTitle: { fontSize: 13, fontWeight: "600", color: colors.textPrimary },
  productPrice: { fontSize: 12, color: colors.textSecondary, marginTop: 1 },
  orderButton: { backgroundColor: colors.accent, borderRadius: radius.sm, paddingHorizontal: spacing.md, paddingVertical: 8 },
  orderButtonText: { fontSize: 12, fontWeight: "600", color: colors.onAccent },
  bottomRow: { flexDirection: "row", alignItems: "flex-end", paddingHorizontal: spacing.lg, paddingBottom: spacing.sm, gap: spacing.sm },
  chatColumn: { flex: 1, maxHeight: 160 },
  chatList: { gap: 4 },
  chatLine: { fontSize: 12, color: "#FFFFFF", lineHeight: 17 },
  chatAuthor: { fontWeight: "700" },
  chatInputRow: { marginTop: spacing.sm },
  chatInput: {
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    fontSize: 13,
    color: "#FFFFFF",
  },
  actionsColumn: { alignItems: "center", gap: spacing.md },
  actionButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(255,255,255,0.15)", alignItems: "center", justifyContent: "center" },
});
