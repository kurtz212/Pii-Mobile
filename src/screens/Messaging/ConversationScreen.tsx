import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Linking,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import * as Location from "expo-location";
import * as Contacts from "expo-contacts/legacy";
import { VideoView, useVideoPlayer } from "expo-video";
import { useFocusEffect, useNavigation, useRoute } from "@react-navigation/native";
import { NativeStackNavigationProp, NativeStackScreenProps } from "@react-navigation/native-stack";
import { colors, radius, spacing } from "@/theme/colors";
import { RootStackParamList } from "@/navigation/types";
import { ApiMessage, getMessages, MessageMetadata, sendMessage } from "../../services/messaging.service";
import { getUserId, uploadImage, uploadVideo, uploadFile } from "../../services/api";
import { ApiRequestError } from "../../services/api";

type Props = NativeStackScreenProps<RootStackParamList, "Conversation">;
type Nav = NativeStackNavigationProp<RootStackParamList>;

function MessageVideo({ uri }: { uri: string }) {
  const player = useVideoPlayer(uri, (p) => {
    p.loop = false;
  });
  return <VideoView player={player} style={styles.attachmentMedia} contentFit="cover" nativeControls />;
}

export function ConversationScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Props["route"]>();
  const { conversationId, contactName, contactInitials } = route.params;

  const [messages, setMessages] = useState<ApiMessage[]>([]);
  const [myUserId, setMyUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [attachError, setAttachError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const uid = await getUserId();
      const data = await getMessages(conversationId);
      setMyUserId(uid);
      setMessages(data);
    } catch {
      // erreur silencieuse ici pour ne pas bloquer l'écran
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
    } catch {
      setDraft(content);
    } finally {
      setSending(false);
    }
  }

  async function handlePickImage() {
    setShowAttachMenu(false);
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setAttachError("Autorise l'accès à ta galerie pour continuer.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
    });
    if (result.canceled || !result.assets[0]) return;
    try {
      setSending(true);
      const url = await uploadImage(result.assets[0].uri);
      await sendMessage(conversationId, "", "image", { url });
      await load();
    } catch (err: unknown) {
      setAttachError(err instanceof ApiRequestError ? err.message : "Échec de l'envoi de l'image");
    } finally {
      setSending(false);
    }
  }

  async function handlePickVideo() {
    setShowAttachMenu(false);
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setAttachError("Autorise l'accès à ta galerie pour continuer.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      quality: 0.7,
    });
    if (result.canceled || !result.assets[0]) return;
    try {
      setSending(true);
      const url = await uploadVideo(result.assets[0].uri);
      await sendMessage(conversationId, "", "video", { url });
      await load();
    } catch (err: unknown) {
      setAttachError(err instanceof ApiRequestError ? err.message : "Échec de l'envoi de la vidéo");
    } finally {
      setSending(false);
    }
  }

   async function handlePickFile() {
    setShowAttachMenu(false);
    // Laisse le temps à la modale de se fermer complètement avant
    // d'ouvrir le sélecteur natif, pour éviter un conflit connu entre
    // Modal et expo-document-picker sur les versions récentes.
    await new Promise((resolve) => setTimeout(resolve, 400));
    const result = await DocumentPicker.getDocumentAsync({ multiple: false });
    if (result.canceled || !result.assets[0]) return;
    const asset = result.assets[0];
    try {
      setSending(true);
      const uploaded = await uploadFile(asset.uri, asset.name);
      await sendMessage(conversationId, "", "file", {
        url: uploaded.url,
        fileName: uploaded.fileName,
        fileSize: uploaded.fileSize,
      });
      await load();
    } catch (err: unknown) {
      setAttachError(err instanceof ApiRequestError ? err.message : "Échec de l'envoi du fichier");
    } finally {
      setSending(false);
    }
  }

  async function handleShareLocation() {
    setShowAttachMenu(false);
    const permission = await Location.requestForegroundPermissionsAsync();
    if (!permission.granted) {
      setAttachError("Autorise l'accès à ta position pour continuer.");
      return;
    }
    try {
      setSending(true);
      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const { latitude, longitude } = position.coords;
      await sendMessage(conversationId, "Localisation partagée", "location", {
        latitude,
        longitude,
        label: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
      });
      await load();
    } catch (err: unknown) {
      console.log("ERREUR LOCALISATION:", err);
      setAttachError("Impossible de récupérer ta position");
    } finally {
      setSending(false);
    }
  }

    async function handleShareContact() {
    setShowAttachMenu(false);
    const permission = await Contacts.requestPermissionsAsync();
    if (!permission.granted) {
      setAttachError("Autorise l'accès à tes contacts pour continuer.");
      return;
    }
    try {
      const contact = await Contacts.presentContactPickerAsync();
      if (!contact) {
        return;
      }
      const phone = contact.phoneNumbers?.[0]?.number ?? "";
      if (!phone) {
        setAttachError("Ce contact n'a pas de numéro de téléphone");
        return;
      }
      setSending(true);
      const contactName = contact.name ?? "Contact";
      try {
        await sendMessage(conversationId, `Contact partagé : ${contactName}`, "contact", {
          name: contactName,
          phone,
        });
      } catch (err: unknown) {
        // Certains déploiements backend n'acceptent pas encore le type contact.
        if (!(err instanceof ApiRequestError)) throw err;
        await sendMessage(conversationId, `Contact partagé : ${contactName} - ${phone}`);
      }
      await load();
    } catch {
      setAttachError("Impossible de partager ce contact");
    } finally {
      setSending(false);
    }
  }

  function renderMessageContent(item: ApiMessage, isMe: boolean) {
    let parsedContent: MessageMetadata | null = null;
    if (item.type !== "text" && item.content) {
      try {
        const parsed = JSON.parse(item.content) as unknown;
        if (parsed && typeof parsed === "object") {
          parsedContent = parsed as MessageMetadata;
        }
      } catch {
        // Les anciens messages peuvent contenir un contenu non sérialisé.
      }
    }
    const meta = item.metadata ?? parsedContent;

    if (item.type === "image" && meta?.url) {
      return <Image source={{ uri: meta.url }} style={styles.attachmentMedia} />;
    }

    if (item.type === "video" && meta?.url) {
      return <MessageVideo uri={meta.url as string} />;
    }

    if (
      item.type === "location" &&
      typeof meta?.latitude === "number" &&
      typeof meta?.longitude === "number"
    ) {
      const mapsUrl = `https://www.google.com/maps?q=${meta.latitude},${meta.longitude}`;
      return (
        <Pressable style={styles.attachmentCard} onPress={() => Linking.openURL(mapsUrl)}>
          <Ionicons name="location" size={20} color={colors.accent} />
          <Text style={styles.attachmentCardText}>Voir la position sur la carte</Text>
        </Pressable>
      );
    }

    if (item.type === "contact" && meta?.name) {
      return (
        <Pressable
          style={styles.attachmentCard}
          onPress={() => meta.phone && Linking.openURL(`tel:${meta.phone}`)}
        >
          <Ionicons name="person-circle-outline" size={22} color={colors.accent} />
          <View>
            <Text style={styles.attachmentCardText}>{meta.name as string}</Text>
            {meta.phone && <Text style={styles.attachmentCardSubtext}>{meta.phone as string}</Text>}
          </View>
        </Pressable>
      );
    }

    if (item.type === "file" && meta?.url) {
      const sizeKb = meta.fileSize ? Math.round((meta.fileSize as number) / 1024) : null;
      return (
        <Pressable style={styles.attachmentCard} onPress={() => Linking.openURL(meta.url as string)}>
          <Ionicons name="document-outline" size={22} color={colors.accent} />
          <View style={{ flex: 1 }}>
            <Text style={styles.attachmentCardText} numberOfLines={1}>
              {(meta.fileName as string) ?? "Fichier"}
            </Text>
            {sizeKb && <Text style={styles.attachmentCardSubtext}>{sizeKb} Ko</Text>}
          </View>
        </Pressable>
      );
    }

    if (item.type === "audio") {
      return (
        <View style={styles.attachmentCard}>
          <Ionicons name="mic-outline" size={20} color={colors.accent} />
          <Text style={styles.attachmentCardText}>Message vocal</Text>
        </View>
      );
    }

    return (
      <>
        <Text style={[styles.bubbleText, isMe && { color: colors.onAccent }]}>
          {item.translatedContent ?? item.content}
        </Text>
        {item.translatedContent && item.translatedContent !== item.content && (
          <Text style={styles.originalTextHint}>Original : {item.content}</Text>
        )}
      </>
    );
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

      {attachError && (
        <Pressable onPress={() => setAttachError(null)}>
          <Text style={styles.attachErrorText}>{attachError}</Text>
        </Pressable>
      )}

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
            const isMediaType = item.type === "image" || item.type === "video";
            return (
              <View style={[styles.bubbleRow, isMe ? styles.rowMe : styles.rowThem]}>
                <View
                  style={[
                    styles.bubble,
                    isMe ? styles.bubbleMe : styles.bubbleThem,
                    isMediaType && styles.bubbleMedia,
                  ]}
                >
                  {renderMessageContent(item, isMe)}
                </View>
              </View>
            );
          }}
        />
      )}

      <View style={styles.inputBar}>
        <Pressable style={styles.attachButton} onPress={() => setShowAttachMenu(true)}>
          <Ionicons name="add" size={22} color={colors.accent} />
        </Pressable>
        <TextInput
          style={styles.textInput}
          placeholder="Écrire un message..."
          placeholderTextColor={colors.textMuted}
          value={draft}
          onChangeText={setDraft}
          multiline
        />
        <Pressable style={styles.sendButton} onPress={handleSend} disabled={sending}>
          {sending ? (
            <ActivityIndicator size="small" color={colors.onAccent} />
          ) : (
            <Ionicons name="arrow-up" size={18} color={colors.onAccent} />
          )}
        </Pressable>
      </View>

      <Modal visible={showAttachMenu} transparent animationType="fade">
        <Pressable style={styles.menuOverlay} onPress={() => setShowAttachMenu(false)}>
          <View style={styles.menuBox}>
            <Pressable style={styles.menuItem} onPress={handlePickImage}>
              <View style={[styles.menuIconBox, { backgroundColor: "#8B5CF622" }]}>
                <Ionicons name="image-outline" size={20} color="#8B5CF6" />
              </View>
              <Text style={styles.menuItemText}>Photo</Text>
            </Pressable>
            <Pressable style={styles.menuItem} onPress={handlePickVideo}>
              <View style={[styles.menuIconBox, { backgroundColor: "#EF444422" }]}>
                <Ionicons name="videocam-outline" size={20} color="#EF4444" />
              </View>
              <Text style={styles.menuItemText}>Vidéo</Text>
            </Pressable>
            <Pressable style={styles.menuItem} onPress={handlePickFile}>
              <View style={[styles.menuIconBox, { backgroundColor: "#3B82F622" }]}>
                <Ionicons name="document-outline" size={20} color="#3B82F6" />
              </View>
              <Text style={styles.menuItemText}>Fichier</Text>
            </Pressable>
            <Pressable style={styles.menuItem} onPress={handleShareLocation}>
              <View style={[styles.menuIconBox, { backgroundColor: "#10B98122" }]}>
                <Ionicons name="location-outline" size={20} color="#10B981" />
              </View>
              <Text style={styles.menuItemText}>Localisation</Text>
            </Pressable>
            <Pressable style={styles.menuItem} onPress={handleShareContact}>
              <View style={[styles.menuIconBox, { backgroundColor: "#F59E0B22" }]}>
                <Ionicons name="person-outline" size={20} color="#F59E0B" />
              </View>
              <Text style={styles.menuItemText}>Contact</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
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
  bubbleMedia: { padding: 4, backgroundColor: "transparent" },
  bubbleText: { fontSize: 14, color: colors.textPrimary, lineHeight: 20 },
  originalTextHint: { fontSize: 10, color: colors.textMuted, fontStyle: "italic", marginTop: 2 },
  attachmentMedia: { width: 220, height: 220, borderRadius: radius.md },
  attachmentCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    minWidth: 160,
  },
  attachmentCardText: { fontSize: 13, fontWeight: "600", color: colors.textPrimary },
  attachmentCardSubtext: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
  attachErrorText: {
    fontSize: 12,
    color: colors.danger,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs,
    backgroundColor: colors.dangerBg,
  },
  inputBar: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  attachButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.accentBg,
    alignItems: "center",
    justifyContent: "center",
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.textPrimary,
    backgroundColor: colors.surface,
    maxHeight: 100,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  menuOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.3)", justifyContent: "flex-end" },
  menuBox: {
    backgroundColor: colors.background,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  menuItem: { flexDirection: "row", alignItems: "center", gap: spacing.md, paddingVertical: spacing.sm },
  menuIconBox: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  menuItemText: { fontSize: 14, color: colors.textPrimary, fontWeight: "500" },
});