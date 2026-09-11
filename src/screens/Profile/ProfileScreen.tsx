import React, { useCallback, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { colors, radius, spacing } from "@/theme/colors";
import { RootStackParamList } from "@/navigation/types";
import { getMyEspaces, EspaceResponse } from "../../services/espaces.service";
import { ApiRequestError } from "../../services/api";

type Nav = NativeStackNavigationProp<RootStackParamList>;

type DashboardRouteName =
  | "BoutiqueDashboard"
  | "EntrepreneurDashboard"
  | "AgenceLivraisonDashboard"
  | "AgenceCargoDashboard"
  | "TransitaireDashboard";

const espaceIcon: Record<string, keyof typeof Ionicons.glyphMap> = {
  boutique: "storefront-outline",
  entrepreneur: "briefcase-outline",
  agence_livraison: "car-outline",
  agence_cargo: "cube-outline",
  transitaire: "document-text-outline",
};

const espaceLabel: Record<string, string> = {
  boutique: "Boutique",
  entrepreneur: "Entrepreneur",
  agence_livraison: "Agence de livraison",
  agence_cargo: "Agence cargo",
  transitaire: "Transitaire",
};

const espaceDashboardRoute: Record<string, DashboardRouteName> = {
  boutique: "BoutiqueDashboard",
  entrepreneur: "EntrepreneurDashboard",
  agence_livraison: "AgenceLivraisonDashboard",
  agence_cargo: "AgenceCargoDashboard",
  transitaire: "TransitaireDashboard",
};

export function ProfileScreen() {
  const navigation = useNavigation<Nav>();
  const [espaces, setEspaces] = useState<EspaceResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;

      async function load() {
        setLoading(true);
        setError(null);
        try {
          const data = await getMyEspaces();
          if (!cancelled) setEspaces(data);
        } catch (err: unknown) {
          if (!cancelled) {
            if (err instanceof ApiRequestError) {
              setError(err.message);
            } else {
              setError("Impossible de charger tes espaces.");
            }
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

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>Profil</Text>
          <Ionicons
            name="settings-outline"
            size={22}
            color={colors.textSecondary}
            onPress={() => navigation.navigate("Parametres")}
          />
        </View>

        <Pressable style={styles.actionButton} onPress={() => navigation.navigate("MesCommandes")}>
          <Ionicons name="receipt-outline" size={20} color={colors.accent} />
          <Text style={styles.actionText}>Mes commandes</Text>
          <Ionicons name="chevron-forward" size={16} color={colors.textMuted} style={{ marginLeft: "auto" }} />
        </Pressable>

        <Pressable style={styles.actionButton} onPress={() => navigation.navigate("MesDevis")}>
          <Ionicons name="document-text-outline" size={20} color={colors.accent} />
          <Text style={styles.actionText}>Mes demandes de devis</Text>
          <Ionicons name="chevron-forward" size={16} color={colors.textMuted} style={{ marginLeft: "auto" }} />
        </Pressable>

        <Pressable
          style={styles.actionButton}
          onPress={() => navigation.navigate("SelectionnerTypeEspace")}
        >
          <Ionicons name="add-circle-outline" size={20} color={colors.accent} />
          <Text style={styles.actionText}>Créer un espace</Text>
          <Ionicons name="chevron-forward" size={16} color={colors.textMuted} style={{ marginLeft: "auto" }} />
        </Pressable>

        <Pressable style={styles.actionButton} onPress={() => navigation.navigate("Groupes")}>
          <Ionicons name="people-outline" size={20} color={colors.accent} />
          <Text style={styles.actionText}>Mes groupes</Text>
          <Ionicons name="chevron-forward" size={16} color={colors.textMuted} style={{ marginLeft: "auto" }} />
        </Pressable>

        <Pressable style={styles.actionButton} onPress={() => navigation.navigate("Tontines")}>
          <Ionicons name="cash-outline" size={20} color={colors.accent} />
          <Text style={styles.actionText}>Mes tontines</Text>
          <Ionicons name="chevron-forward" size={16} color={colors.textMuted} style={{ marginLeft: "auto" }} />
        </Pressable>

        <Pressable style={styles.actionButton} onPress={() => navigation.navigate("MonAffiliation")}>
          <Ionicons name="link-outline" size={20} color={colors.accent} />
          <Text style={styles.actionText}>Mon affiliation</Text>
          <Ionicons name="chevron-forward" size={16} color={colors.textMuted} style={{ marginLeft: "auto" }} />
        </Pressable>

        <Text style={styles.sectionHeader}>Mes espaces</Text>

        {loading && (
          <View style={styles.loadingBox}>
            <ActivityIndicator color={colors.accent} />
          </View>
        )}

        {!loading && error && (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>{error}</Text>
          </View>
        )}

        {!loading && !error && espaces.length === 0 && (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>
              Tu n'as pas encore d'espace. Crée ta première boutique ou espace pro ci-dessus.
            </Text>
          </View>
        )}

        {!loading &&
          !error &&
          espaces.map((espace) => {
            const dashboardRoute = espaceDashboardRoute[espace.type];

            const cardContent = (
              <>
                <Ionicons name={espaceIcon[espace.type] ?? "cube-outline"} size={18} color={colors.accent} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.espaceName}>{espace.name}</Text>
                  <Text style={styles.espaceType}>{espaceLabel[espace.type] ?? espace.type}</Text>
                </View>
                <View
                  style={[
                    styles.subBadge,
                    espace.subscriptionActive ? styles.subBadgeActive : styles.subBadgeInactive,
                  ]}
                >
                  <Text
                    style={[
                      styles.subBadgeText,
                      espace.subscriptionActive ? styles.subBadgeTextActive : styles.subBadgeTextInactive,
                    ]}
                  >
                    {espace.subscriptionActive ? "Actif" : "En attente"}
                  </Text>
                </View>
                {dashboardRoute && (
                  <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
                )}
              </>
            );

            if (dashboardRoute) {
              return (
                <Pressable
                  key={espace.id}
                  style={styles.espaceRow}
                  onPress={() => navigation.navigate(dashboardRoute, { espaceId: espace.id })}
                >
                  {cardContent}
                </Pressable>
              );
            }

            return (
              <View key={espace.id} style={styles.espaceRow}>
                {cardContent}
              </View>
            );
          })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.xl },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.md,
  },
  title: { fontSize: 20, fontWeight: "700", color: colors.textPrimary },
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
  sectionHeader: { fontSize: 13, fontWeight: "700", color: colors.textPrimary, marginTop: spacing.md, marginBottom: spacing.sm },
  loadingBox: { alignItems: "center", padding: spacing.lg },
  emptyBox: { backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.lg },
  emptyText: { fontSize: 12, color: colors.textMuted, textAlign: "center" },
  espaceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  espaceName: { fontSize: 13, fontWeight: "600", color: colors.textPrimary },
  espaceType: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
  subBadge: { paddingHorizontal: spacing.sm, paddingVertical: 3, borderRadius: radius.sm },
  subBadgeActive: { backgroundColor: colors.accentBg },
  subBadgeInactive: { backgroundColor: colors.secondaryBg },
  subBadgeText: { fontSize: 10, fontWeight: "600" },
  subBadgeTextActive: { color: colors.accent },
  subBadgeTextInactive: { color: colors.secondary },
});
