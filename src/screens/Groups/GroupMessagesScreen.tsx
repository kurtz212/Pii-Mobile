import React, { useCallback, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useNavigation, useRoute } from "@react-navigation/native";
import { NativeStackNavigationProp, NativeStackScreenProps } from "@react-navigation/native-stack";
import { colors, radius, spacing } from "@/theme/colors";
import { RootStackParamList } from "@/navigation/types";
import { ApiGroupMessage, getGroupMessages, sendGroupMessage } from "../../services/group.service";
import { getUserId } from "../../services/api";

type Props = NativeStackScreenProps<RootStackParamList, "GroupeMessages">;
type Nav = NativeStackNavigationProp<RootStackParamList>;

export function GroupMessagesScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Props["route"]>();
  const { groupId, groupName, groupType, isCreator } = route.params;

  const [messages, setMessages] = useState<ApiGroupMessage[]>([]);
  const [myUserId, setMyUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);

  const canWrite = groupType === "discussion" || isCreator;

  const load = useCallback(async () => {
    try {
      const uid = await getUserId();
      const data = await getGroupMessages(groupId);
      setMyUserId(uid);
      setMessages(data);
    } catch {
      // erreur silencieuse — l'écran reste utilisable pour réessayer
    } finally {
      setLoading(false);
    }
  }, [groupId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  async function handleSend() {
    if (!draft.trim() || sending) return;
    setSending(true);
    const content = draft.trim();
    setDraft("");
    try {
      await sendGroupMessage(groupId, content);
      await load();
    } catch {
      setDraft(content);
    } finally {
      setSending(false);
    }
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.headerRow}>
        <Ionicons name="arrow-back" size={20} color={colors.textSecondary} onPress={() => navigation.goBack()} />
        <View style={{ flex: 1 }}>
          <Text style={styles.headerName}>{groupName}</Text>
          <Text style={styles.headerType}>
            {groupType === "annonces" ? "Canal d'annonces" : "Discussion"}
          </Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator color={colors.accent} />
        </View>
      ) : (
        <FlatList
          data={messages}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.messageList}
          ListEmptyComponent={
            <View style={styles.centerBox}>
              <Text style={styles.emptyText}>Aucun message pour l'instant.</Text>
            </View>
          }
          renderItem={({ item }) => {
            const isMe = item.senderId === myUserId;
            return (
              <View style={[styles.bubbleRow, isMe ? styles.rowMe : styles.rowThem]}>
                <View style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleThem]}>
                  <Text style={[styles.bubbleText, isMe && { color: colors.onAccent }]}>
                    {item.content}
                  </Text>
                </View>
              </View>
            );
          }}
        />
      )}

      {canWrite ? (
        <View style={styles.inputBar}>
          <TextInput
            style={styles.textInput}
            placeholder="Écrire un message..."
            placeholderTextColor={colors.textMuted}
            value={draft}
            onChangeText={setDraft}
            multiline
          />
          <Pressable style={styles.sendButton} onPress={handleSend} disabled={sending}>
            <Ionicons name="arrow-up" size={18} color={colors.onAccent} />
          </Pressable>
        </View>
      ) : (
        <View style={styles.readOnlyBar}>
          <Ionicons name="lock-closed-outline" size={14} color={colors.textMuted} />
          <Text style={styles.readOnlyText}>Seul le créateur peut publier dans ce canal</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerName: { fontSize: 15, fontWeight: "600", color: colors.textPrimary },
  headerType: { fontSize: 11, color: colors.textMuted },
  centerBox: { flex: 1, alignItems: "center", justifyContent: "center" },
  emptyText: { fontSize: 13, color: colors.textMuted },
  messageList: { padding: spacing.lg, gap: spacing.sm, flexGrow: 1 },
  bubbleRow: { maxWidth: "80%" },
  rowMe: { alignSelf: "flex-end", alignItems: "flex-end" },
  rowThem: { alignSelf: "flex-start", alignItems: "flex-start" },
  bubble: { borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: 10 },
  bubbleMe: { backgroundColor: colors.accent, borderBottomRightRadius: 4 },
  bubbleThem: { backgroundColor: colors.surface, borderBottomLeftRadius: 4 },
  bubbleText: { fontSize: 14, color: colors.textPrimary, lineHeight: 20 },
  inputBar: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    color: colors.textPrimary,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    maxHeight: 100,
  },
  sendButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  readOnlyBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  readOnlyText: { fontSize: 12, color: colors.textMuted },
});