import React, { useCallback, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { colors, radius, spacing } from "@/theme/colors";
import { RootStackParamList } from "@/navigation/types";
import { setLivreurStatus, deleteAccount } from "../../services/api";
import { getMyProfile } from "../../services/affiliation.service";
import { logout } from "../../services/auth.service";

type Nav = NativeStackNavigationProp<RootStackParamList>;

export function SettingsScreen() {
  const navigation = useNavigation<Nav>();
  const [isLivreur, setIsLivreur] = useState(false);
  const [loading, setLoading] = useState(true);
  const [togglingLivreur, setTogglingLivreur] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;

      async function load() {
        try {
          const profile = await getMyProfile();
          if (!cancelled) setIsLivreur((profile as any).isLivreur ?? false);
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

  async function handleToggleLivreur() {
    if (togglingLivreur) return;
    setTogglingLivreur(true);
    try {
      const newValue = !isLivreur;
      await setLivreurStatus(newValue);
      setIsLivreur(newValue);
    } catch {
      // en cas d'échec, l'état affiché ne change pas
    } finally {
      setTogglingLivreur(false);
    }
  }

  async function handleLogout() {
    await logout();
    navigation.reset({ index: 0, routes: [{ name: "Welcome" }] });
  }

  function confirmDeleteAccount() {
    Alert.alert(
      "Supprimer ton compte ?",
      "Cette action est définitive et irréversible. Toutes tes données (espaces, publications, conversations, commandes) seront perdues.",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Supprimer définitivement",
          style: "destructive",
          onPress: handleDeleteAccount,
        },
      ],
    );
  }

  async function handleDeleteAccount() {
    setDeleting(true);
    try {
      await deleteAccount();
      await logout();
      navigation.reset({ index: 0, routes: [{ name: "Welcome" }] });
    } catch {
      Alert.alert("Erreur", "Impossible de supprimer le compte pour l'instant.");
    } finally {
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.centerBox}>
          <Text style={styles.headerTitle}>Chargement...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.headerRow}>
        <Ionicons name="arrow-back" size={20} color={colors.textSecondary} onPress={() => navigation.goBack()} />
        <Text style={styles.headerTitle}>Paramètres</Text>
        <View style={{ width: 20 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Pressable style={styles.actionButton} onPress={handleToggleLivreur} disabled={togglingLivreur}>
          <Ionicons name="bicycle-outline" size={20} color={colors.accent} />
          <Text style={styles.actionText}>Je suis livreur</Text>
          <View style={[styles.toggle, isLivreur && styles.toggleActive]}>
            <View style={[styles.toggleDot, isLivreur && styles.toggleDotActive]} />
          </View>
        </Pressable>

        <Pressable style={styles.actionButton} onPress={() => navigation.navigate("LangueMessages")}>
          <Ionicons name="language-outline" size={20} color={colors.accent} />
          <Text style={styles.actionText}>Langue des messages</Text>
          <Ionicons name="chevron-forward" size={16} color={colors.textMuted} style={{ marginLeft: "auto" }} />
        </Pressable>

        <Pressable style={styles.actionButton} onPress={() => navigation.navigate("InvitationsEquipe")}>
          <Ionicons name="mail-open-outline" size={20} color={colors.accent} />
          <Text style={styles.actionText}>Invitations d'équipe</Text>
          <Ionicons name="chevron-forward" size={16} color={colors.textMuted} style={{ marginLeft: "auto" }} />
        </Pressable>

        <Pressable style={styles.actionButton} onPress={() => navigation.navigate("VerificationIdentite")}>
          <Ionicons name="shield-checkmark-outline" size={20} color={colors.accent} />
          <Text style={styles.actionText}>Vérification d'identité</Text>
          <Ionicons name="chevron-forward" size={16} color={colors.textMuted} style={{ marginLeft: "auto" }} />
        </Pressable>

        <Pressable style={styles.actionButton} onPress={() => navigation.navigate("PolitiqueConfidentialite")}>
          <Ionicons name="document-lock-outline" size={20} color={colors.accent} />
          <Text style={styles.actionText}>Politique de confidentialité</Text>
          <Ionicons name="chevron-forward" size={16} color={colors.textMuted} style={{ marginLeft: "auto" }} />
        </Pressable>

        <Pressable style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={18} color={colors.danger} />
          <Text style={styles.logoutText}>Se déconnecter</Text>
        </Pressable>

        <Pressable style={styles.deleteButton} onPress={confirmDeleteAccount} disabled={deleting}>
          <Ionicons name="trash-outline" size={18} color={colors.danger} />
          <Text style={styles.deleteText}>
            {deleting ? "Suppression..." : "Supprimer mon compte"}
          </Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  centerBox: { flex: 1, alignItems: "center", justifyContent: "center" },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  headerTitle: { fontSize: 16, fontWeight: "600", color: colors.textPrimary },
  content: { padding: spacing.lg, paddingBottom: spacing.xl },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  actionText: { fontSize: 14, fontWeight: "600", color: colors.textPrimary },
  toggle: {
    width: 40,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.border,
    padding: 2,
    marginLeft: "auto",
  },
  toggleActive: { backgroundColor: colors.accent },
  toggleDot: { width: 18, height: 18, borderRadius: 9, backgroundColor: colors.background },
  toggleDotActive: { transform: [{ translateX: 18 }] },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: colors.danger,
    borderRadius: radius.md,
    padding: spacing.md,
    marginTop: spacing.lg,
  },
  logoutText: { fontSize: 14, fontWeight: "600", color: colors.danger },
  deleteButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    padding: spacing.md,
    marginTop: spacing.sm,
  },
  deleteText: { fontSize: 13, color: colors.danger },
});
