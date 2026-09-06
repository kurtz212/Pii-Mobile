import React, { useCallback, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useNavigation, useRoute } from "@react-navigation/native";
import { NativeStackNavigationProp, NativeStackScreenProps } from "@react-navigation/native-stack";
import { colors, radius, spacing } from "@/theme/colors";
import { RootStackParamList } from "@/navigation/types";
import { EspaceResponse, getEspaceById } from "../../services/espaces.service";
import { ApiOrder, getReceivedOrders, OrderStatus, updateOrderStatus } from "../../services/order.service";
import { ApiGroup, getGroupsByEspace, joinGroup } from "../../services/group.service";
import { ApiBadgeInfo, getBadgeInfo } from "../../services/badge.service";
import { ApiRequestError } from "../../services/api";

type Props = NativeStackScreenProps<RootStackParamList, "BoutiqueDashboard">;
type Nav = NativeStackNavigationProp<RootStackParamList>;

const statusLabel: Record<OrderStatus, string> = {
  pending: "Nouvelle",
  confirmed: "Confirmée",
  delivered: "Livrée",
  cancelled: "Annulée",
};

const statusColor: Record<OrderStatus, { bg: string; fg: string }> = {
  pending: { bg: colors.secondaryBg, fg: colors.secondary },
  confirmed: { bg: colors.accentBg, fg: colors.accent },
  delivered: { bg: colors.surface, fg: colors.textSecondary },
  cancelled: { bg: colors.dangerBg, fg: colors.danger },
};

export function BoutiqueDashboardScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Props["route"]>();
  const { espaceId } = route.params;

  const [espace, setEspace] = useState<EspaceResponse | null>(null);
  const [orders, setOrders] = useState<ApiOrder[]>([]);
  const [groups, setGroups] = useState<ApiGroup[]>([]);
  const [badge, setBadge] = useState<ApiBadgeInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [espaceData, ordersData, groupsData, badgeData] = await Promise.all([
        getEspaceById(espaceId),
        getReceivedOrders(espaceId),
        getGroupsByEspace(espaceId),
        getBadgeInfo(espaceId),
      ]);
      setEspace(espaceData);
      setOrders(ordersData);
      setGroups(groupsData);
      setBadge(badgeData);
    } catch (err: unknown) {
      setError(err instanceof ApiRequestError ? err.message : "Erreur de chargement");
    } finally {
      setLoading(false);
    }
  }, [espaceId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  async function handleUpdateStatus(orderId: string, status: OrderStatus) {
    setUpdatingId(orderId);
    try {
      await updateOrderStatus(orderId, status);
      await load();
    } catch {
      // en cas d'échec, la liste reste inchangée ; l'utilisateur peut réessayer
    } finally {
      setUpdatingId(null);
    }
  }

  async function handleOpenGroup(group: ApiGroup) {
    try {
      await joinGroup(group.id);
      navigation.navigate("GroupeMessages", {
        groupId: group.id,
        groupName: group.name,
        groupType: group.type,
        isCreator: true,
      });
    } catch {
      // en cas d'échec, on ne navigue pas
    }
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.centerBox}>
          <ActivityIndicator color={colors.accent} />
        </View>
      </SafeAreaView>
    );
  }

  if (error || !espace) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.headerRow}>
          <Ionicons name="arrow-back" size={20} color={colors.textSecondary} onPress={() => navigation.goBack()} />
        </View>
        <View style={styles.centerBox}>
          <Text style={styles.errorText}>{error ?? "Boutique introuvable"}</Text>
        </View>
      </SafeAreaView>
    );
  }

  const category = (espace.details?.category as string) ?? null;
  const pendingCount = orders.filter((o) => o.status === "pending").length;
  const revenueThisMonth = orders
    .filter((o) => o.status !== "cancelled")
    .reduce((sum, o) => sum + Number(o.price), 0);

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.headerRow}>
        <Ionicons name="arrow-back" size={20} color={colors.textSecondary} onPress={() => navigation.goBack()} />
        <View style={styles.headerIconBox}>
          <Ionicons name="storefront-outline" size={17} color={colors.accent} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>{espace.name}</Text>
          <Text style={styles.headerSubtitle}>Tableau de bord</Text>
        </View>
            <Ionicons
          name="settings-outline"
          size={19}
          color={colors.textSecondary}
          onPress={() => navigation.navigate("ModifierEspace", { espaceId })}
        />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.infoCard}>
          {category && (
            <View style={styles.infoRow}>
              <Ionicons name="pricetag-outline" size={15} color={colors.textSecondary} />
              <Text style={styles.infoText}>{category}</Text>
            </View>
          )}
          {espace.location && (
            <View style={styles.infoRow}>
              <Ionicons name="location-outline" size={15} color={colors.textSecondary} />
              <Text style={styles.infoText}>{espace.location}</Text>
            </View>
          )}
          <View style={styles.infoRow}>
            <Ionicons
              name={espace.subscriptionActive ? "checkmark-circle-outline" : "time-outline"}
              size={15}
              color={espace.subscriptionActive ? colors.accent : colors.secondary}
            />
            <Text
              style={[
                styles.infoText,
                { color: espace.subscriptionActive ? colors.accent : colors.secondary, fontWeight: "600" },
              ]}
            >
              Abonnement {espace.subscriptionActive ? "actif" : "en attente d'activation"}
            </Text>
          </View>
          {badge?.level && (
            <View style={styles.infoRow}>
              <Ionicons name="shield-checkmark" size={15} color={colors.accent} />
              <Text style={styles.infoText}>
                Badge {badge.level === "or" ? "Or" : badge.level === "argent" ? "Argent" : "Bronze"} ·{" "}
                {badge.averageRating ?? "—"} ★ ({badge.reviewCount} avis)
              </Text>
            </View>
          )}
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Commandes en attente</Text>
            <Text style={styles.statValue}>{pendingCount}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Revenu (hors annulées)</Text>
            <Text style={[styles.statValue, { color: colors.accent }]}>
              {revenueThisMonth.toLocaleString("fr-FR")} F
            </Text>
          </View>
        </View>

        <View style={styles.actionsRow}>
          <Pressable
            style={styles.primaryAction}
            onPress={() => navigation.navigate("CreerPublication", { espaceId })}
          >
            <Ionicons name="add" size={16} color={colors.onAccent} />
            <Text style={styles.primaryActionText}>Publication</Text>
          </Pressable>
          <Pressable style={styles.secondaryAction} onPress={() => navigation.navigate("LiveViewer")}>
            <Ionicons name="radio-outline" size={16} color={colors.danger} />
            <Text style={styles.secondaryActionText}>Live</Text>
          </Pressable>
        </View>

        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Commandes récentes</Text>
        </View>

        {orders.length === 0 ? (
          <View style={styles.comingSoonBox}>
            <Ionicons name="receipt-outline" size={20} color={colors.textMuted} />
            <Text style={styles.comingSoonText}>Aucune commande reçue pour l'instant.</Text>
          </View>
        ) : (
          orders.map((order) => {
            const colorSet = statusColor[order.status];
            return (
              <View key={order.id} style={styles.orderCard}>
                <View style={styles.orderTop}>
                  <Text style={styles.orderTitle}>{order.title}</Text>
                  <View style={[styles.statusBadge, { backgroundColor: colorSet.bg }]}>
                    <Text style={[styles.statusBadgeText, { color: colorSet.fg }]}>
                      {statusLabel[order.status]}
                    </Text>
                  </View>
                </View>
                <Text style={styles.orderPrice}>{Number(order.price).toLocaleString("fr-FR")} F</Text>
                <View style={styles.orderMetaRow}>
                  <Ionicons
                    name={order.paymentMethod === "cash" ? "cash-outline" : "card-outline"}
                    size={12}
                    color={colors.textMuted}
                  />
                  <Text style={styles.orderMetaText}>
                    {order.paymentMethod === "cash" ? "Cash" : "Par tranches"}
                  </Text>
                  <Text style={styles.orderMetaDot}>·</Text>
                  <Ionicons
                    name={order.receptionMode === "livraison" ? "car-outline" : "calendar-outline"}
                    size={12}
                    color={colors.textMuted}
                  />
                  <Text style={styles.orderMetaText}>
                    {order.receptionMode === "livraison" ? "Livraison" : "Rendez-vous"}
                  </Text>
                </View>
                {order.notes && <Text style={styles.orderNotes}>« {order.notes} »</Text>}

                {order.status === "pending" && (
                  <View style={styles.orderActionsRow}>
                    <Pressable
                      style={styles.confirmButton}
                      onPress={() => handleUpdateStatus(order.id, "confirmed")}
                      disabled={updatingId === order.id}
                    >
                      <Text style={styles.confirmButtonText}>
                        {updatingId === order.id ? "..." : "Confirmer"}
                      </Text>
                    </Pressable>
                    <Pressable
                      style={styles.cancelButton}
                      onPress={() => handleUpdateStatus(order.id, "cancelled")}
                      disabled={updatingId === order.id}
                    >
                      <Text style={styles.cancelButtonText}>Annuler</Text>
                    </Pressable>
                  </View>
                )}
                {order.status === "confirmed" && (
                  <Pressable
                    style={styles.confirmButton}
                    onPress={() => handleUpdateStatus(order.id, "delivered")}
                    disabled={updatingId === order.id}
                  >
                    <Text style={styles.confirmButtonText}>
                      {updatingId === order.id ? "..." : "Marquer comme livrée"}
                    </Text>
                  </Pressable>
                )}
              </View>
            );
          })
        )}

        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Mes publications</Text>
        </View>
        <Pressable
          style={styles.teamRow}
          onPress={() => navigation.navigate("GererPublications", { espaceId })}
        >
          <Ionicons name="images-outline" size={16} color={colors.textSecondary} />
          <Text style={styles.teamText}>Gérer mes publications</Text>
          <Ionicons name="chevron-forward" size={14} color={colors.textMuted} style={{ marginLeft: "auto" }} />
        </Pressable>

        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Groupes</Text>
        </View>
        {groups.length === 0 ? (
          <View style={styles.comingSoonBox}>
            <Ionicons name="people-outline" size={20} color={colors.textMuted} />
            <Text style={styles.comingSoonText}>Aucun groupe pour l'instant.</Text>
          </View>
        ) : (
          groups.map((group) => (
            <Pressable key={group.id} style={styles.teamRow} onPress={() => handleOpenGroup(group)}>
              <Ionicons
                name={group.type === "annonces" ? "megaphone-outline" : "people-outline"}
                size={16}
                color={colors.textSecondary}
              />
              <Text style={styles.teamText}>{group.name}</Text>
              <Ionicons name="chevron-forward" size={14} color={colors.textMuted} style={{ marginLeft: "auto" }} />
            </Pressable>
          ))
        )}
        <Pressable
          style={[styles.teamRow, { marginTop: spacing.sm }]}
          onPress={() => navigation.navigate("CreerGroupe", { espaceId })}
        >
          <Ionicons name="add-circle-outline" size={16} color={colors.accent} />
          <Text style={[styles.teamText, { color: colors.accent }]}>Créer un groupe</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  centerBox: { flex: 1, alignItems: "center", justifyContent: "center" },
  errorText: { fontSize: 13, color: colors.danger },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  headerIconBox: {
    width: 34,
    height: 34,
    borderRadius: 9,
    backgroundColor: colors.accentBg,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: { fontSize: 15, fontWeight: "700", color: colors.textPrimary },
  headerSubtitle: { fontSize: 11, color: colors.textMuted },
  content: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xl },
  infoCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    gap: 8,
  },
  infoRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  infoText: { fontSize: 13, color: colors.textPrimary },
  statsRow: { flexDirection: "row", gap: spacing.sm, marginBottom: spacing.sm },
  statCard: { flex: 1, backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.md },
  statLabel: { fontSize: 11, color: colors.textSecondary, marginBottom: 4 },
  statValue: { fontSize: 20, fontWeight: "700", color: colors.textPrimary },
  actionsRow: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.sm, marginBottom: spacing.md },
  primaryAction: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: colors.accent,
    borderRadius: radius.md,
    paddingVertical: 11,
  },
  primaryActionText: { fontSize: 12, fontWeight: "600", color: colors.onAccent },
  secondaryAction: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: radius.md,
    paddingVertical: 11,
  },
  secondaryActionText: { fontSize: 12, fontWeight: "600", color: colors.textPrimary },
  sectionHeaderRow: { marginTop: spacing.md, marginBottom: spacing.sm },
  sectionTitle: { fontSize: 13, fontWeight: "700", color: colors.textPrimary },
  comingSoonBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  comingSoonText: { flex: 1, fontSize: 12, color: colors.textSecondary, lineHeight: 17 },
  orderCard: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  orderTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  orderTitle: { fontSize: 14, fontWeight: "600", color: colors.textPrimary, flex: 1 },
  statusBadge: { paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: radius.sm },
  statusBadgeText: { fontSize: 10, fontWeight: "600" },
  orderPrice: { fontSize: 16, fontWeight: "700", color: colors.textPrimary, marginTop: 4 },
  orderMetaRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 6 },
  orderMetaText: { fontSize: 11, color: colors.textMuted },
  orderMetaDot: { fontSize: 11, color: colors.textMuted },
  orderNotes: { fontSize: 12, color: colors.textSecondary, fontStyle: "italic", marginTop: 6 },
  orderActionsRow: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.sm },
  confirmButton: {
    flex: 1,
    backgroundColor: colors.accent,
    borderRadius: radius.sm,
    paddingVertical: 9,
    alignItems: "center",
    marginTop: spacing.sm,
  },
  confirmButtonText: { fontSize: 12, fontWeight: "600", color: colors.onAccent },
  cancelButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.danger,
    borderRadius: radius.sm,
    paddingVertical: 9,
    alignItems: "center",
  },
  cancelButtonText: { fontSize: 12, fontWeight: "600", color: colors.danger },
  teamRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    marginTop: spacing.sm,
  },
  teamText: { fontSize: 13, color: colors.textPrimary },
});