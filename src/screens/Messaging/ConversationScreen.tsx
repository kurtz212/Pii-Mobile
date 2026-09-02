import React, { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useNavigation, useRoute } from "@react-navigation/native";
import { NativeStackNavigationProp, NativeStackScreenProps } from "@react-navigation/native-stack";
import { colors, radius, spacing } from "@/theme/colors";
import { RootStackParamList } from "@/navigation/types";
import { ApiMessage, getMessages, sendMessage } from "../../services/messaging.service";
import { getUserId } from "../../services/api";
import { ApiRequestError } from "../../services/api";

type Props = NativeStackScreenProps<RootStackParamList, "Conversation">;
type Nav = NativeStackNavigationProp<RootStackParamList>;

export function ConversationScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Props["route"]>();
  const { conversationId, contactName, contactInitials } = route.params;

  const [messages, setMessages] = useState<ApiMessage[]>([]);
  const [myUserId, setMyUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);

  const load = useCallback(async () => {
    try {
      const uid = await getUserId();
      const data = await getMessages(conversationId);
      setMyUserId(uid);
      setMessages(data);
    } catch (err: unknown) {
      // erreur silencieuse ici pour ne pas bloquer l'écran ; on pourrait
      // afficher un message si besoin
    } finally {
      setLoading(false);
    }
  }, [conversationId]);

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
      await sendMessage(conversationId, content);
      await load();
    } catch (err: unknown) {
      // en cas d'échec, on remet le brouillon pour ne pas perdre le message
      setDraft(content);
    } finally {
      setSending(false);
    }
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.headerRow}>
        <Ionicons name="arrow-back" size={20} color={colors.textSecondary} onPress={() => navigation.goBack()} />
        <View style={styles.headerContact}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{contactInitials}</Text>
          </View>
          <Text style={styles.headerName}>{contactName}</Text>
        </View>
        <View style={{ width: 20 }} />
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
  headerContact: { flex: 1, flexDirection: "row", alignItems: "center", gap: spacing.sm },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.accentBg,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { fontSize: 12, fontWeight: "600", color: colors.accent },
  headerName: { fontSize: 15, fontWeight: "600", color: colors.textPrimary },
  centerBox: { flex: 1, alignItems: "center", justifyContent: "center" },
  messageList: { padding: spacing.lg, gap: spacing.sm },
  bubbleRow: { maxWidth: "80%" },
  rowMe: { alignSelf: "flex-end", alignItems: "flex-end" },
  rowThem: { alignSelf: "flex-start", alignItems: "flex-start" },
  bubble: {
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
  },
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
});