import React, { useCallback, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { colors, radius, spacing } from "@/theme/colors";
import { RootStackParamList } from "@/navigation/types";
import {
  ApiConversation,
  getMyConversations,
  getOtherParticipant,
  initialsFromName,
} from "../../services/messaging.service";
import { getUserId } from "../../services/api";
import { ApiRequestError } from "../../services/api";

type Nav = NativeStackNavigationProp<RootStackParamList>;

export function MessagingListScreen() {
  const navigation = useNavigation<Nav>();
  const [conversations, setConversations] = useState<ApiConversation[]>([]);
  const [myUserId, setMyUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;

      async function load() {
        setLoading(true);
        setError(null);
        try {
          const uid = await getUserId();
          const data = await getMyConversations();
          if (!cancelled) {
            setMyUserId(uid);
            setConversations(data);
          }
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

  function formatTime(dateStr: string | null): string {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    const now = new Date();
    const sameDay = date.toDateString() === now.toDateString();
    if (sameDay) {
      return date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
    }
    return date.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" });
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.headerRow}>
  <Text style={styles.headerTitle}>Messagerie</Text>
  <Ionicons
  name="create-outline"
  size={20}
  color={colors.textSecondary}
  onPress={() => navigation.navigate("NouveauMessage")}
/>
</View>

      <View style={styles.searchBar}>
        <Ionicons name="search" size={16} color={colors.textMuted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Rechercher une conversation"
          placeholderTextColor={colors.textMuted}
        />
      </View>

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

      {!loading && !error && myUserId && (
        <FlatList
          data={conversations}
          keyExtractor={(item) => item.id}
          ListEmptyComponent={
            <View style={styles.centerBox}>
              <Text style={styles.emptyText}>
                Aucune conversation pour l'instant. Contacte une boutique depuis l'annuaire pour commencer.
              </Text>
            </View>
          }
          renderItem={({ item }) => {
            const other = getOtherParticipant(item, myUserId);
            const initials = initialsFromName(other.fullName);
            return (
              <Pressable
                style={styles.row}
                onPress={() =>
                  navigation.navigate("Conversation", {
                    conversationId: item.id,
                    contactName: other.fullName,
                    contactInitials: initials,
                  })
                }
              >
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{initials}</Text>
                </View>
                                <View style={{ flex: 1 }}>
                  <View style={styles.rowTop}>
                                 <Text style={[styles.contactName, item.unreadCount > 0 && styles.contactNameUnread]}>
                      {other.fullName}
                    </Text>
                    <Text style={styles.timestamp}>{formatTime(item.lastMessageAt)}</Text>
                  </View>
                  <View style={styles.previewRow}>
                    <Text
                      style={[styles.previewText, item.unreadCount > 0 && styles.previewTextUnread]}
                      numberOfLines={1}
                    >
                      {item.lastMessageAt ? "Appuie pour voir la conversation" : "Nouvelle conversation"}
                    </Text>
                    {item.unreadCount > 0 && (
                      <View style={styles.unreadBadge}>
                        <Text style={styles.unreadBadgeText}>
                          {item.unreadCount > 9 ? "9+" : item.unreadCount}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              </Pressable>
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
  headerTitle: { fontSize: 20, fontWeight: "700", color: colors.textPrimary },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  searchInput: { flex: 1, fontSize: 13, color: colors.textPrimary, padding: 0 },
  centerBox: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: spacing.xl },
  errorText: { fontSize: 13, color: colors.danger },
  emptyText: { fontSize: 13, color: colors.textMuted, textAlign: "center", lineHeight: 19 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.accentBg,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { fontSize: 14, fontWeight: "600", color: colors.accent },
  rowTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  contactName: { fontSize: 14, fontWeight: "600", color: colors.textPrimary },
  timestamp: { fontSize: 11, color: colors.textMuted },
  previewText: { fontSize: 12, color: colors.textSecondary, marginTop: 2, flex: 1 },
  previewTextUnread: { color: colors.textPrimary, fontWeight: "600" },
  previewRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  contactNameUnread: { fontWeight: "700" },
  unreadBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 5,
  },
  unreadBadgeText: { fontSize: 10, fontWeight: "700", color: colors.onAccent },
});