import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useNavigation, useRoute } from "@react-navigation/native";
import { NativeStackNavigationProp, NativeStackScreenProps } from "@react-navigation/native-stack";
import { colors, radius, spacing } from "@/theme/colors";
import { RootStackParamList } from "@/navigation/types";

import { EspaceResponse, getEspaceById, updateEspace } from "../../services/espaces.service";
import { ApiDeliveryRequest } from "../../services/delivery.service";
import {
  ApiTeamMember,
  assignToLivreur,
  getAgencyAssignments,
  getTeam,
  inviteLivreur,
} from "../../services/deliveryTeam.service";
import { ApiRequestError } from "../../services/api";

type Props = NativeStackScreenProps<RootStackParamList, "AgenceLivraisonDashboard">;
type Nav = NativeStackNavigationProp<RootStackParamList>;

export function AgenceLivraisonDashboardScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Props["route"]>();
  const { espaceId } = route.params;

  const [espace, setEspace] = useState<EspaceResponse | null>(null);
  const [team, setTeam] = useState<ApiTeamMember[]>([]);
  const [assignments, setAssignments] = useState<ApiDeliveryRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [policyDraft, setPolicyDraft] = useState("");
  const [editingPolicy, setEditingPolicy] = useState(false);
  const [savingPolicy, setSavingPolicy] = useState(false);

  const [invitePhone, setInvitePhone] = useState("");
  const [inviting, setInviting] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);

  const [assignModalRequest, setAssignModalRequest] = useState<ApiDeliveryRequest | null>(null);
  const [assigning, setAssigning] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [espaceData, teamData, assignmentsData] = await Promise.all([
        getEspaceById(espaceId),
        getTeam(espaceId),
        getAgencyAssignments(espaceId),
      ]);
      setEspace(espaceData);
      setTeam(teamData);
      setAssignments(assignmentsData);
      setPolicyDraft((espaceData.details?.workPolicy as string) ?? "");
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

  async function handleSavePolicy() {
    setSavingPolicy(true);
    try {
      await updateEspace(espaceId, { details: { workPolicy: policyDraft.trim() } });
      setEditingPolicy(false);
      await load();
    } catch {
      // en cas d'échec on laisse l'édition ouverte pour réessayer
    } finally {
      setSavingPolicy(false);
    }
  }

  async function handleInvite() {
    if (!invitePhone.trim()) return;
    setInviting(true);
    setInviteError(null);
    try {
      await inviteLivreur(espaceId, invitePhone.trim());
      setInvitePhone("");
      await load();
    } catch (err: unknown) {
      setInviteError(err instanceof ApiRequestError ? err.message : "Erreur lors de l'invitation");
    } finally {
      setInviting(false);
    }
  }

  async function handleAssign(livreurId: string) {
    if (!assignModalRequest) return;
    setAssigning(true);
    try {
      await assignToLivreur(assignModalRequest.id, livreurId);
      setAssignModalRequest(null);
      await load();
    } catch {
      // en cas d'échec, la modale reste ouverte
    } finally {
      setAssigning(false);
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

  const vehicleTypes = (espace.details?.vehicleTypes as string[]) ?? [];
  const coverageZone = (espace.details?.coverageZone as string) ?? espace.location;
  const acceptedTeam = team.filter((m) => m.status === "accepted");
  const pendingTeam = team.filter((m) => m.status === "pending");

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.headerRow}>
        <Ionicons name="arrow-back" size={20} color={colors.textSecondary} onPress={() => navigation.goBack()} />
        <View style={styles.headerIconBox}>
          <Ionicons name="car-outline" size={17} color={colors.accent} />
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
          {coverageZone && (
            <View style={styles.infoRow}>
              <Ionicons name="location-outline" size={15} color={colors.textSecondary} />
              <Text style={styles.infoText}>{coverageZone}</Text>
            </View>
          )}
          {vehicleTypes.length > 0 && (
            <View style={styles.infoRow}>
              <Ionicons name="car-outline" size={15} color={colors.textSecondary} />
              <Text style={styles.infoText}>{vehicleTypes.join(", ")}</Text>
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

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Livreurs actifs</Text>
            <Text style={styles.statValue}>{acceptedTeam.length}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Courses en cours</Text>
            <Text style={[styles.statValue, { color: colors.accent }]}>
              {assignments.filter((a) => a.status === "assigned").length}
            </Text>
          </View>
        </View>

        <View style={styles.actionsRow}>
          <Pressable
            style={styles.primaryAction}
            onPress={() => navigation.navigate("Tabs", { screen: "Livraison" } as never)}
          >
            <Ionicons name="search-outline" size={16} color={colors.onAccent} />
            <Text style={styles.primaryActionText}>Voir les courses ouvertes</Text>
          </Pressable>
        </View>

        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Politique de travail</Text>
        </View>
        {editingPolicy ? (
          <View>
            <TextInput
              style={[styles.input, styles.textarea]}
              placeholder="Ex. Commission de 15% par course, paiement chaque vendredi..."
              placeholderTextColor={colors.textMuted}
              value={policyDraft}
              onChangeText={setPolicyDraft}
              multiline
            />
            <View style={styles.policyActionsRow}>
              <Pressable style={styles.saveButton} onPress={handleSavePolicy} disabled={savingPolicy}>
                <Text style={styles.saveButtonText}>{savingPolicy ? "..." : "Enregistrer"}</Text>
              </Pressable>
              <Pressable style={styles.cancelButton} onPress={() => setEditingPolicy(false)}>
                <Text style={styles.cancelButtonText}>Annuler</Text>
              </Pressable>
            </View>
          </View>
        ) : (
          <Pressable style={styles.policyBox} onPress={() => setEditingPolicy(true)}>
            <Text style={styles.policyText}>
              {policyDraft || "Aucune politique définie — appuie pour en ajouter une."}
            </Text>
            <Ionicons name="create-outline" size={16} color={colors.textMuted} />
          </Pressable>
        )}

        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Inviter un livreur</Text>
        </View>
        <View style={styles.inviteRow}>
          <TextInput
            style={styles.inviteInput}
            placeholder="Numéro de téléphone"
            placeholderTextColor={colors.textMuted}
            value={invitePhone}
            onChangeText={setInvitePhone}
            keyboardType="phone-pad"
          />
          <Pressable style={styles.inviteButton} onPress={handleInvite} disabled={inviting}>
            <Text style={styles.inviteButtonText}>{inviting ? "..." : "Inviter"}</Text>
          </Pressable>
        </View>
        {inviteError && <Text style={styles.errorText}>{inviteError}</Text>}

        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Mon équipe ({acceptedTeam.length})</Text>
        </View>
        {acceptedTeam.length === 0 ? (
          <View style={styles.comingSoonBox}>
            <Ionicons name="people-outline" size={20} color={colors.textMuted} />
            <Text style={styles.comingSoonText}>Aucun livreur pour l'instant.</Text>
          </View>
        ) : (
          acceptedTeam.map((member) => (
            <View key={member.id} style={styles.memberRow}>
              <Ionicons name="person-circle-outline" size={22} color={colors.accent} />
              <Text style={styles.memberName}>{member.livreur.fullName}</Text>
            </View>
          ))
        )}

        {pendingTeam.length > 0 && (
          <>
            <Text style={styles.pendingLabel}>En attente de réponse ({pendingTeam.length})</Text>
            {pendingTeam.map((member) => (
              <View key={member.id} style={styles.memberRowPending}>
                <Ionicons name="time-outline" size={16} color={colors.secondary} />
                <Text style={styles.memberNamePending}>{member.livreur.fullName}</Text>
              </View>
            ))}
          </>
        )}

        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Courses acceptées</Text>
        </View>
        {assignments.length === 0 ? (
          <View style={styles.comingSoonBox}>
            <Ionicons name="receipt-outline" size={20} color={colors.textMuted} />
            <Text style={styles.comingSoonText}>Aucune course pour l'instant.</Text>
          </View>
        ) : (
          assignments.map((request) => {
            const assignedMember = team.find((m) => m.livreurId === request.assignedLivreurId);
            return (
              <View key={request.id} style={styles.assignmentCard}>
                <Text style={styles.routeText}>{request.depart}</Text>
                <Ionicons name="arrow-down" size={12} color={colors.textMuted} style={{ marginVertical: 2 }} />
                <Text style={styles.routeText}>{request.destination}</Text>

                {request.assignedLivreurId ? (
                  <View style={styles.assignedRow}>
                    <Ionicons name="checkmark-circle" size={14} color={colors.accent} />
                    <Text style={styles.assignedRowText}>
                      Confié à {assignedMember?.livreur.fullName ?? "un livreur"}
                    </Text>
                  </View>
                ) : (
                  <Pressable
                    style={styles.assignButton}
                    onPress={() => setAssignModalRequest(request)}
                    disabled={acceptedTeam.length === 0}
                  >
                    <Text style={styles.assignButtonText}>
                      {acceptedTeam.length === 0 ? "Aucun livreur disponible" : "Attribuer à un livreur"}
                    </Text>
                  </Pressable>
                )}
              </View>
            );
          })
        )}
      </ScrollView>

      <Modal visible={assignModalRequest !== null} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Attribuer à un livreur</Text>
            {acceptedTeam.map((member) => (
              <Pressable
                key={member.id}
                style={styles.modalMemberRow}
                onPress={() => handleAssign(member.livreurId)}
                disabled={assigning}
              >
                <Ionicons name="person-circle-outline" size={20} color={colors.accent} />
                <Text style={styles.modalMemberName}>{member.livreur.fullName}</Text>
              </Pressable>
            ))}
            <Pressable style={styles.modalCancelButton} onPress={() => setAssignModalRequest(null)}>
              <Text style={styles.modalCancelText}>Annuler</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  centerBox: { flex: 1, alignItems: "center", justifyContent: "center" },
  errorText: { fontSize: 13, color: colors.danger, marginBottom: spacing.md },
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
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    fontSize: 13,
    color: colors.textPrimary,
    backgroundColor: colors.surface,
  },
  textarea: { height: 80, textAlignVertical: "top", marginBottom: spacing.sm },
  policyActionsRow: { flexDirection: "row", gap: spacing.sm, marginBottom: spacing.md },
  saveButton: { flex: 1, backgroundColor: colors.accent, borderRadius: radius.sm, paddingVertical: 10, alignItems: "center" },
  saveButtonText: { fontSize: 12, fontWeight: "600", color: colors.onAccent },
  cancelButton: { flex: 1, borderWidth: 1, borderColor: colors.borderStrong, borderRadius: radius.sm, paddingVertical: 10, alignItems: "center" },
  cancelButtonText: { fontSize: 12, fontWeight: "600", color: colors.textPrimary },
  policyBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  policyText: { flex: 1, fontSize: 12, color: colors.textPrimary, lineHeight: 17 },
  inviteRow: { flexDirection: "row", gap: spacing.sm, marginBottom: spacing.sm },
  inviteInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    fontSize: 13,
    color: colors.textPrimary,
    backgroundColor: colors.surface,
  },
  inviteButton: { backgroundColor: colors.accent, borderRadius: radius.sm, paddingHorizontal: spacing.md, justifyContent: "center" },
  inviteButtonText: { fontSize: 12, fontWeight: "600", color: colors.onAccent },
  memberRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    padding: spacing.sm,
    marginBottom: 6,
  },
  memberName: { fontSize: 13, color: colors.textPrimary },
  pendingLabel: { fontSize: 11, color: colors.textMuted, marginTop: spacing.sm, marginBottom: 6 },
  memberRowPending: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.secondaryBg,
    borderRadius: radius.sm,
    padding: spacing.sm,
    marginBottom: 6,
  },
  memberNamePending: { fontSize: 12, color: colors.secondary },
  assignmentCard: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  routeText: { fontSize: 13, color: colors.textPrimary },
  assignedRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: spacing.sm },
  assignedRowText: { fontSize: 12, color: colors.accent, fontWeight: "600" },
  assignButton: {
    backgroundColor: colors.accent,
    borderRadius: radius.sm,
    paddingVertical: 9,
    alignItems: "center",
    marginTop: spacing.sm,
  },
  assignButtonText: { fontSize: 12, fontWeight: "600", color: colors.onAccent },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", alignItems: "center", justifyContent: "center", padding: spacing.lg },
  modalBox: { width: "100%", backgroundColor: colors.background, borderRadius: radius.md, padding: spacing.lg },
  modalTitle: { fontSize: 15, fontWeight: "600", color: colors.textPrimary, marginBottom: spacing.md },
  modalMemberRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm, paddingVertical: 10 },
  modalMemberName: { fontSize: 14, color: colors.textPrimary },
  modalCancelButton: { marginTop: spacing.sm, paddingVertical: 10, alignItems: "center" },
  modalCancelText: { fontSize: 13, color: colors.textMuted },
});