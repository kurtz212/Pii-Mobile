import React, { useCallback, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useNavigation, useRoute } from "@react-navigation/native";
import { NativeStackNavigationProp, NativeStackScreenProps } from "@react-navigation/native-stack";
import { colors, radius, spacing } from "@/theme/colors";
import { RootStackParamList } from "@/navigation/types";
import { EspaceResponse, getEspaceById } from "../../services/espaces.service";
import { ApiGroup, getGroupsByEspace, joinGroup } from "../../services/group.service";
import { ApiQuoteRequest, getReceivedQuoteRequests, submitQuote } from "../../services/quote.service";
import { ApiRequestError } from "../../services/api";
import { QuoteTrackingTimeline } from "../Quotes/QuoteTrackingTimeline";
type Props = NativeStackScreenProps<RootStackParamList, "AgenceCargoDashboard">;
type Nav = NativeStackNavigationProp<RootStackParamList>;

export function AgenceCargoDashboardScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Props["route"]>();
  const { espaceId } = route.params;

  const [espace, setEspace] = useState<EspaceResponse | null>(null);
  const [groups, setGroups] = useState<ApiGroup[]>([]);
  const [receivedRequests, setReceivedRequests] = useState<ApiQuoteRequest[]>([]);
  const [priceDrafts, setPriceDrafts] = useState<Record<string, string>>({});
  const [submittingId, setSubmittingId] = useState<string | null>(null);
  const [trackingBusy, setTrackingBusy] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [espaceData, groupsData, requestsData] = await Promise.all([
        getEspaceById(espaceId),
        getGroupsByEspace(espaceId),
        getReceivedQuoteRequests(espaceId),
      ]);
      setEspace(espaceData);
      setGroups(groupsData);
         setReceivedRequests(requestsData.filter((r) => r.status === "open" || r.status === "accepted"));
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

  async function handleSubmitQuote(requestId: string) {
    const priceStr = priceDrafts[requestId];
    const price = Number(priceStr);
    if (!priceStr || isNaN(price) || price <= 0) return;

    setSubmittingId(requestId);
    try {
      await submitQuote(requestId, espaceId, price);
      setPriceDrafts((prev) => ({ ...prev, [requestId]: "" }));
      await load();
    } catch {
      // en cas d'échec, la liste reste inchangée
    } finally {
      setSubmittingId(null);
    }
  }

  async function handleTrackingStep(
    requestId: string,
    nextStep: "picked_up" | "in_transit" | "customs" | "delivered",
  ) {
    setTrackingBusy(requestId);
    try {
      const { addQuoteTrackingStep } = await import("../../services/quote.service");
      await addQuoteTrackingStep(requestId, nextStep);
      await load();
    } catch {
      // en cas d'échec, l'utilisateur peut réessayer
    } finally {
      setTrackingBusy(null);
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
          <Text style={styles.errorText}>{error ?? "Espace introuvable"}</Text>
        </View>
      </SafeAreaView>
    );
  }

  const zonesDesservies = (espace.details?.zonesDesservies as string) ?? null;
  const typesMarchandises = (espace.details?.typesMarchandises as string[]) ?? [];

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.headerRow}>
        <Ionicons name="arrow-back" size={20} color={colors.textSecondary} onPress={() => navigation.goBack()} />
        <View style={styles.headerIconBox}>
          <Ionicons name="cube-outline" size={17} color={colors.accent} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>{espace.name}</Text>
          <Text style={styles.headerSubtitle}>Tableau de bord</Text>
        </View>
        <Ionicons name="settings-outline" size={19} color={colors.textSecondary} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.infoCard}>
          {zonesDesservies && (
            <View style={styles.infoRow}>
              <Ionicons name="location-outline" size={15} color={colors.textSecondary} />
              <Text style={styles.infoText}>{zonesDesservies}</Text>
            </View>
          )}
          {typesMarchandises.length > 0 && (
            <View style={styles.infoRow}>
              <Ionicons name="cube-outline" size={15} color={colors.textSecondary} />
              <Text style={styles.infoText}>{typesMarchandises.join(", ")}</Text>
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
        </View>

        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Demandes de devis ({receivedRequests.length})</Text>
        </View>
        {receivedRequests.length === 0 ? (
          <View style={styles.comingSoonBox}>
            <Ionicons name="document-text-outline" size={20} color={colors.textMuted} />
            <Text style={styles.comingSoonText}>Aucune demande pour l'instant.</Text>
          </View>
        ) : (
          receivedRequests.map((req) => {
            const d = req.details as {
              originCountry?: string;
              destinationCountry?: string;
              weightKg?: number;
              merchandiseDescription?: string;
            };
            const stepsOrder: Array<"picked_up" | "in_transit" | "customs" | "delivered"> = [
              "picked_up",
              "in_transit",
              "customs",
              "delivered",
            ];
            const doneSteps = new Set((req.trackingSteps ?? []).map((s) => s.step));
            const nextStep = stepsOrder.find((s) => !doneSteps.has(s));
            const nextLabel: Record<"picked_up" | "in_transit" | "customs" | "delivered", string> = {
              picked_up: "Marquer comme récupéré",
              in_transit: "Marquer en transit",
              customs: "Marquer en dédouanement",
              delivered: "Marquer comme livré",
            };

            return (
              <View key={req.id} style={styles.quoteRequestCard}>
                <Text style={styles.quoteRequestRoute}>
                  {d.originCountry} → {d.destinationCountry}
                </Text>
                <Text style={styles.quoteRequestDetail}>
                  {d.weightKg} kg · {d.merchandiseDescription}
                </Text>

                {req.status === "open" && (
                  <View style={styles.offerInputRow}>
                    <TextInput
                      style={styles.priceInput}
                      placeholder="Prix (F)"
                      placeholderTextColor={colors.textMuted}
                      keyboardType="numeric"
                      value={priceDrafts[req.id] ?? ""}
                      onChangeText={(text) => setPriceDrafts((prev) => ({ ...prev, [req.id]: text }))}
                    />
                    <Pressable
                      style={styles.proposeButton}
                      onPress={() => handleSubmitQuote(req.id)}
                      disabled={submittingId === req.id}
                    >
                      <Text style={styles.proposeButtonText}>
                        {submittingId === req.id ? "..." : "Répondre"}
                      </Text>
                    </Pressable>
                  </View>
                )}

                {req.status === "accepted" && (
                  <>
                    <QuoteTrackingTimeline steps={req.trackingSteps ?? []} />
                    {nextStep && (
                      <Pressable
                        style={styles.proposeButton}
                        onPress={() => handleTrackingStep(req.id, nextStep)}
                        disabled={trackingBusy === req.id}
                      >
                        <Text style={styles.proposeButtonText}>
                          {trackingBusy === req.id ? "..." : nextLabel[nextStep]}
                        </Text>
                      </Pressable>
                    )}
                  </>
                )}
              </View>
            );
          })
        )}

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
  quoteRequestCard: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  quoteRequestRoute: { fontSize: 13, fontWeight: "600", color: colors.textPrimary },
  quoteRequestDetail: { fontSize: 12, color: colors.textSecondary, marginTop: 4 },
  offerInputRow: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.sm },
  priceInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    fontSize: 13,
    color: colors.textPrimary,
    backgroundColor: colors.surface,
  },
  proposeButton: {
    backgroundColor: colors.accent,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    justifyContent: "center",
  },
  proposeButtonText: { fontSize: 12, fontWeight: "600", color: colors.onAccent },
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