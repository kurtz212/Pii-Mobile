import React, { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute } from "@react-navigation/native";
import { NativeStackNavigationProp, NativeStackScreenProps } from "@react-navigation/native-stack";
import { colors, radius, spacing } from "@/theme/colors";
import { RootStackParamList } from "@/navigation/types";
import { createGroup, GroupType } from "../../services/group.service";
import { ApiRequestError } from "../../services/api";

type Props = NativeStackScreenProps<RootStackParamList, "CreerGroupe">;
type Nav = NativeStackNavigationProp<RootStackParamList>;

export function CreateGroupScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Props["route"]>();
  const { espaceId } = route.params;

  const [type, setType] = useState<GroupType>("discussion");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = name.trim().length > 0 && !loading;

  async function handleCreate() {
    if (!canSubmit) return;
    setError(null);
    setLoading(true);
    try {
      const group = await createGroup({
        espaceId,
        type,
        name: name.trim(),
        description: description.trim() || undefined,
      });
      navigation.replace("GroupeMessages", {
        groupId: group.id,
        groupName: group.name,
        groupType: group.type,
        isCreator: true,
      });
    } catch (err: unknown) {
      setError(err instanceof ApiRequestError ? err.message : "Impossible de créer le groupe.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.headerRow}>
        <Ionicons name="close" size={20} color={colors.textSecondary} onPress={() => navigation.goBack()} />
        <Text style={styles.headerTitle}>Nouveau groupe</Text>
        <View style={{ width: 20 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.label}>Type de groupe</Text>
        <Pressable
          style={[styles.typeCard, type === "discussion" && styles.typeCardActive]}
          onPress={() => setType("discussion")}
        >
          <Ionicons name="people-outline" size={20} color={type === "discussion" ? colors.accent : colors.textSecondary} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.typeTitle, type === "discussion" && styles.typeTitleActive]}>Discussion</Text>
            <Text style={styles.typeSubtitle}>Tous les membres peuvent écrire</Text>
          </View>
          {type === "discussion" && <Ionicons name="checkmark-circle" size={18} color={colors.accent} />}
        </Pressable>

        <Pressable
          style={[styles.typeCard, type === "annonces" && styles.typeCardActive]}
          onPress={() => setType("annonces")}
        >
          <Ionicons name="megaphone-outline" size={20} color={type === "annonces" ? colors.accent : colors.textSecondary} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.typeTitle, type === "annonces" && styles.typeTitleActive]}>Canal d'annonces</Text>
            <Text style={styles.typeSubtitle}>Toi seul peux publier, les membres lisent</Text>
          </View>
          {type === "annonces" && <Ionicons name="checkmark-circle" size={18} color={colors.accent} />}
        </Pressable>

        <Text style={styles.label}>Nom du groupe</Text>
        <TextInput
          style={styles.input}
          placeholder="Ex. Discussion clientes"
          placeholderTextColor={colors.textMuted}
          value={name}
          onChangeText={setName}
        />

        <Text style={styles.label}>Description (optionnel)</Text>
        <TextInput
          style={[styles.input, styles.textarea]}
          placeholder="Présente l'objectif de ce groupe..."
          placeholderTextColor={colors.textMuted}
          value={description}
          onChangeText={setDescription}
          multiline
        />

        {error && <Text style={styles.errorText}>{error}</Text>}

        <Pressable
          style={[styles.submitButton, !canSubmit && styles.submitButtonDisabled]}
          onPress={handleCreate}
          disabled={!canSubmit}
        >
          <Text style={styles.submitButtonText}>{loading ? "Création..." : "Créer le groupe"}</Text>
        </Pressable>
      </ScrollView>
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
  content: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xl },
  label: { fontSize: 12, color: colors.textSecondary, marginBottom: 6, marginTop: spacing.sm },
  typeCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  typeCardActive: { borderColor: colors.accent, backgroundColor: colors.accentBg },
  typeTitle: { fontSize: 14, fontWeight: "600", color: colors.textPrimary },
  typeTitleActive: { color: colors.accent },
  typeSubtitle: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.textPrimary,
    backgroundColor: colors.surface,
    marginBottom: spacing.md,
  },
  textarea: { height: 70, textAlignVertical: "top" },
  errorText: { fontSize: 12, color: colors.danger, marginBottom: spacing.md },
  submitButton: {
    backgroundColor: colors.accent,
    borderRadius: radius.sm,
    paddingVertical: 13,
    alignItems: "center",
    marginTop: spacing.sm,
  },
  submitButtonDisabled: { backgroundColor: colors.borderStrong },
  submitButtonText: { fontSize: 14, fontWeight: "600", color: colors.onAccent },
});