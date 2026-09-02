import React, { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { colors, radius, spacing } from "@/theme/colors";
import { RootStackParamList } from "@/navigation/types";
import { ApiUserSearchResult, searchUsers } from "../../services/api";
import { initialsFromName, startConversation } from "../../services/messaging.service";
import { ApiRequestError } from "../../services/api";

type Nav = NativeStackNavigationProp<RootStackParamList>;

export function NewMessageScreen() {
  const navigation = useNavigation<Nav>();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ApiUserSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [contactingId, setContactingId] = useState<string | null>(null);

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      return;
    }
    const timeout = setTimeout(async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await searchUsers(query.trim());
        setResults(data);
      } catch (err: unknown) {
        setError(err instanceof ApiRequestError ? err.message : "Erreur de recherche");
      } finally {
        setLoading(false);
      }
    }, 400);
    return () => clearTimeout(timeout);
  }, [query]);

  async function handleContact(user: ApiUserSearchResult) {
    if (contactingId) return;
    setContactingId(user.id);
    try {
      const conversation = await startConversation(user.id);
      navigation.replace("Conversation", {
        conversationId: conversation.id,
        contactName: user.fullName,
        contactInitials: initialsFromName(user.fullName),
      });
    } catch (err: unknown) {
      setError(err instanceof ApiRequestError ? err.message : "Impossible de démarrer la conversation");
    } finally {
      setContactingId(null);
    }
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.headerRow}>
        <Ionicons name="close" size={20} color={colors.textSecondary} onPress={() => navigation.goBack()} />
        <Text style={styles.headerTitle}>Nouveau message</Text>
        <View style={{ width: 20 }} />
      </View>

      <View style={styles.searchBar}>
        <Ionicons name="search" size={18} color={colors.textMuted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Nom, numéro, ou nom de boutique..."
          placeholderTextColor={colors.textMuted}
          value={query}
          onChangeText={setQuery}
          autoFocus
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

      {!loading && !error && (
        <FlatList
          data={results}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            query.trim().length >= 2 ? (
              <View style={styles.centerBox}>
                <Text style={styles.emptyText}>Aucun résultat pour "{query}".</Text>
              </View>
            ) : (
              <View style={styles.centerBox}>
                <Text style={styles.emptyText}>
                  Tape un nom, un numéro, ou le nom d'une boutique pour chercher.
                </Text>
              </View>
            )
          }
          renderItem={({ item }) => (
            <Pressable
              style={styles.resultRow}
              onPress={() => handleContact(item)}
              disabled={contactingId === item.id}
            >
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{initialsFromName(item.fullName)}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.resultName}>{item.fullName}</Text>
                <Text style={styles.resultPhone}>{item.phone}</Text>
              </View>
              {contactingId === item.id ? (
                <ActivityIndicator size="small" color={colors.accent} />
              ) : (
                <Ionicons name="chatbubble-outline" size={18} color={colors.accent} />
              )}
            </Pressable>
          )}
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
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  searchInput: { flex: 1, fontSize: 14, color: colors.textPrimary, padding: 0 },
  centerBox: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: spacing.xl },
  errorText: { fontSize: 13, color: colors.danger },
  emptyText: { fontSize: 13, color: colors.textMuted, textAlign: "center", lineHeight: 19 },
  list: { paddingHorizontal: spacing.lg },
  resultRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.accentBg,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { fontSize: 13, fontWeight: "600", color: colors.accent },
  resultName: { fontSize: 14, fontWeight: "600", color: colors.textPrimary },
  resultPhone: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
});