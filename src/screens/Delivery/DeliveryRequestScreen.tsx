
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
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
import { useFocusEffect, useNavigation, useRoute } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { colors, radius, spacing } from "@/theme/colors";
import { TrackingTimeline } from "./TrackingTimeline";
import { RootStackParamList } from "@/navigation/types";
import {
  ApiContactInfo,
  ApiDeliveryOffer,
  ApiDeliveryRequest,
  createDeliveryRequest,
  createOffer,
  getDeliveryContact,
  getMyDeliveryRequests,
  getOffersForRequest,
  getOpenDeliveryRequests,
} from "../../services/delivery.service";
import { getAcceptedByMe as getAcceptedByMeRaw } from "../../services/deliveryReview.service";
import {
  createDeliveryReview,
  markDeliveryCompleted,
} from "../../services/deliveryReview.service";
import { getUserId } from "../../services/api";
import { ApiRequestError } from "../../services/api";

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Mode = "envoyer" | "livrer" | "mes_livraisons";

function isMapsLink(value: string): boolean {
  return value.trim().startsWith("http://") || value.trim().startsWith("https://");
}

function LocationText({ value, style }: { value: string; style?: any }) {
  const isLink = isMapsLink(value);
  if (!isLink) {
    return <Text style={style}>{value}</Text>;
  }
  return (
    <Pressable onPress={() => Linking.openURL(value)}>
      <Text style={[style, { color: colors.accent, textDecorationLine: "underline" }]}>
        Voir sur la carte
      </Text>
    </Pressable>
  );
}

export function DeliveryRequestScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<any>();
  const [mode, setMode] = useState<Mode>("envoyer");
  const forceOpenForm = !!route.params?.openLivreurForm;

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.headerRow}>
        <Text style={styles.headerTitle}>Livraison</Text>
        <Ionicons
          name="qr-code-outline"
          size={20}
          color={colors.textSecondary}
          onPress={() => navigation.navigate("SuiviColis")}
        />
      </View>

      <View style={styles.toggleRow}>
        <Pressable
          style={[styles.toggleButton, mode === "envoyer" && styles.toggleButtonActive]}
          onPress={() => setMode("envoyer")}
        >
          <Text style={[styles.toggleText, mode === "envoyer" && styles.toggleTextActive]}>
            Envoyer
          </Text>
        </Pressable>
        <Pressable
          style={[styles.toggleButton, mode === "livrer" && styles.toggleButtonActive]}
          onPress={() => setMode("livrer")}
        >
          <Text style={[styles.toggleText, mode === "livrer" && styles.toggleTextActive]}>
            Livrer
          </Text>
        </Pressable>
        <Pressable
          style={[styles.toggleButton, mode === "mes_livraisons" && styles.toggleButtonActive]}
          onPress={() => setMode("mes_livraisons")}
        >
          <Text style={[styles.toggleText, mode === "mes_livraisons" && styles.toggleTextActive]}>
            Mes courses
          </Text>
        </Pressable>
      </View>

      {mode === "envoyer" && <EnvoyerView forceOpenForm={forceOpenForm} />}
      {mode === "livrer" && <LivrerView />}
      {mode === "mes_livraisons" && <MesLivraisonsView />}
    </SafeAreaView>
  );
}

function LocationField({
  label,
  value,
  onChangeText,
}: {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
}) {
  async function handleOpenMaps() {
    await Linking.openURL("https://www.google.com/maps");
  }

  return (
    <View style={{ marginBottom: spacing.md }}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.locationRow}>
        <TextInput
          style={[styles.input, { flex: 1, marginBottom: 0 }]}
          placeholder="Nom du quartier, ou colle un lien Maps"
          placeholderTextColor={colors.textMuted}
          value={value}
          onChangeText={onChangeText}
        />
        <Pressable style={styles.gpsButton} onPress={handleOpenMaps}>
          <Ionicons name="map-outline" size={18} color={colors.accent} />
        </Pressable>
      </View>
      <Text style={styles.gpsHint}>
        Ouvre Maps, choisis ton point, copie le lien et colle-le ici, ou tape juste ton quartier.
      </Text>
    </View>
  );
}

function EnvoyerView({ forceOpenForm }: { forceOpenForm?: boolean }) {
  const navigation = useNavigation<Nav>();
  const [depart, setDepart] = useState("");
  const [packageSize, setPackageSize] = useState<string | null>(null);
  const [isFragile, setIsFragile] = useState(false);
  const [destination, setDestination] = useState("");
  const [creating, setCreating] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeRequests, setActiveRequests] = useState<ApiDeliveryRequest[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<ApiDeliveryRequest | null>(null);
  const [offers, setOffers] = useState<ApiDeliveryOffer[]>([]);
  const [contact, setContact] = useState<ApiContactInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewedIds, setReviewedIds] = useState<Set<string>>(new Set());

  const loadRequests = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const mine = await getMyDeliveryRequests();
      const active = mine.filter((r) => r.status === "open" || r.status === "assigned");
      setActiveRequests(active);
    } catch (err: unknown) {
      setError(err instanceof ApiRequestError ? err.message : "Erreur de chargement");
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadRequests();
      setSelectedRequest(null);
      setShowForm(!!forceOpenForm);
    }, [loadRequests, forceOpenForm]),
  );

  async function loadOffersFor(request: ApiDeliveryRequest) {
    setSelectedRequest(request);
    setContact(null);
    try {
      const offersData = await getOffersForRequest(request.id);
      setOffers(offersData);
      if (request.status === "assigned") {
        try {
          const contactData = await getDeliveryContact(request.id);
          setContact(contactData);
        } catch {
        }
      }
    } catch (err: unknown) {
      setError(err instanceof ApiRequestError ? err.message : "Erreur de chargement");
    }
  }

  async function handleCreate() {
    if (!depart.trim() || !destination.trim()) return;
    setCreating(true);
    setError(null);
    try {
        await createDeliveryRequest(depart.trim(), destination.trim(), undefined, packageSize ?? undefined, isFragile);
      setDepart("");
      setDestination("");
      setShowForm(false);
      await loadRequests();
    } catch (err: unknown) {
      setError(err instanceof ApiRequestError ? err.message : "Erreur lors de la demande");
    } finally {
      setCreating(false);
    }
  }

  async function handleAccept(offerId: string) {
    if (!selectedRequest) return;
    try {
      const { acceptOffer } = await import("../../services/delivery.service");
      await acceptOffer(selectedRequest.id, offerId);
      await loadRequests();
      const updated = await import("../../services/delivery.service").then((m) =>
        m.getMyDeliveryRequests(),
      );
      const fresh = updated.find((r) => r.id === selectedRequest.id);
      if (fresh) await loadOffersFor(fresh);
    } catch (err: unknown) {
      setError(err instanceof ApiRequestError ? err.message : "Erreur lors de l'acceptation");
    }
  }

  async function handleMarkReceived() {
    if (!selectedRequest) return;
    try {
      await markDeliveryCompleted(selectedRequest.id);
      setShowReviewModal(true);
    } catch (err: unknown) {
      setError(err instanceof ApiRequestError ? err.message : "Erreur lors de la confirmation");
    }
  }

  async function handleSubmitReview() {
    if (!selectedRequest) return;
    setSubmittingReview(true);
    try {
      await createDeliveryReview(selectedRequest.id, rating, comment.trim() || undefined);
      setShowReviewModal(false);
      setReviewedIds((prev) => new Set(prev).add(selectedRequest.id));
      setSelectedRequest(null);
      await loadRequests();
    } catch {
    } finally {
      setSubmittingReview(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.centerBox}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  if (showForm) {
    return (
      <View style={styles.content}>
        <View style={styles.formHeaderRow}>
          <Ionicons
            name="arrow-back"
            size={18}
            color={colors.textSecondary}
            onPress={() => setShowForm(false)}
          />
          <Text style={styles.formHeaderTitle}>Nouvelle demande</Text>
        </View>
               <LocationField label="Depart" value={depart} onChangeText={setDepart} />
        <LocationField label="Destination" value={destination} onChangeText={setDestination}/>

        <Text style={styles.label}>Taille du colis</Text>
        <View style={styles.sizeRow}>
          {["petit", "moyen", "grand"].map((size) => (
            <Pressable
              key={size}
              style={[styles.sizeChip, packageSize === size && styles.sizeChipActive]}
              onPress={() => setPackageSize(size)}
            >
              <Text style={[styles.sizeChipText, packageSize === size && styles.sizeChipTextActive]}>
                {size.charAt(0).toUpperCase() + size.slice(1)}
              </Text>
            </Pressable>
          ))}
        </View>

        <Pressable style={styles.fragileRow} onPress={() => setIsFragile(!isFragile)}>
          <Ionicons
            name={isFragile ? "checkbox" : "square-outline"}
            size={20}
            color={isFragile ? colors.accent : colors.textMuted}
          />
          <Text style={styles.fragileText}>Colis fragile</Text>
        </Pressable>

        {error && <Text style={styles.errorText}>{error}</Text>}
        <Pressable
          style={[
            styles.submitButton,
            (!depart.trim() || !destination.trim() || creating) && styles.submitButtonDisabled,
          ]}
          onPress={handleCreate}
          disabled={!depart.trim() || !destination.trim() || creating}
        >
          <Text style={styles.submitButtonText}>
            {creating ? "Envoi..." : "Demander une livraison"}
          </Text>
        </Pressable>
      </View>
    );
  }

  if (selectedRequest) {
    return (
      <View style={styles.content}>
        <View style={styles.formHeaderRow}>
          <Ionicons
            name="arrow-back"
            size={18}
            color={colors.textSecondary}
            onPress={() => setSelectedRequest(null)}
          />
          <Text style={styles.formHeaderTitle}>Detail de la demande</Text>
        </View>

        <View style={styles.routeCard}>
          <LocationText value={selectedRequest.depart} style={styles.routeText} />
          <Ionicons name="arrow-down" size={14} color={colors.textMuted} style={{ marginVertical: 4 }} />
          <LocationText value={selectedRequest.destination} style={styles.routeText} />
        </View>

        {selectedRequest.status === "assigned" ? (
          <View>
            <View style={styles.assignedBox}>
              <Ionicons name="checkmark-circle" size={20} color={colors.accent} />
              <Text style={styles.assignedText}>Livraison confirmee avec un livreur.</Text>
            </View>
                       <TrackingTimeline steps={selectedRequest.trackingSteps ?? []} />
                        <TrackingTimeline steps={selectedRequest.trackingSteps ?? []} />
            {contact && (
              <View style={styles.contactCard}>
                <Ionicons name="person-circle-outline" size={22} color={colors.accent} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.contactName}>{contact.name}</Text>
                  <Text style={styles.contactPhone}>{contact.phone}</Text>
                </View>
                <Pressable onPress={() => Linking.openURL(`tel:${contact.phone}`)}>
                  <Ionicons name="call-outline" size={20} color={colors.accent} />
                </Pressable>
              </View>
            )}
            {!reviewedIds.has(selectedRequest.id) && (
              <Pressable style={styles.receivedButton} onPress={handleMarkReceived}>
                <Ionicons name="cube-outline" size={16} color={colors.onAccent} />
                <Text style={styles.receivedButtonText}>J'ai recu mon colis</Text>
              </Pressable>
            )}
          </View>
        ) : (
          <>
            <Text style={styles.offersHeaderTitle}>
              Offres recues ({offers.filter((o) => o.status === "pending").length})
            </Text>
            {offers.length === 0 && (
              <Text style={styles.hintText}>
                En attente d'offres des livreurs. Reviens sur cet ecran pour actualiser.
              </Text>
            )}
            <FlatList
              data={offers.filter((o) => o.status === "pending")}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              renderItem={({ item }) => (
                <View style={styles.offerCard}>
                  <Text style={styles.offerPrice}>
                    {Number(item.price).toLocaleString("fr-FR")} F
                  </Text>
                  <Pressable style={styles.chooseButton} onPress={() => handleAccept(item.id)}>
                    <Text style={styles.chooseButtonText}>Choisir</Text>
                  </Pressable>
                </View>
              )}
            />
            <Pressable style={styles.refreshButton} onPress={() => loadOffersFor(selectedRequest)}>
              <Ionicons name="refresh" size={16} color={colors.accent} />
              <Text style={styles.refreshText}>Actualiser</Text>
            </Pressable>
          </>
        )}

        <Modal visible={showReviewModal} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalBox}>
              <Text style={styles.modalTitle}>Note ton livreur</Text>
              <View style={styles.starsRow}>
                {[1, 2, 3, 4, 5].map((n) => (
                  <Pressable key={n} onPress={() => setRating(n)}>
                    <Ionicons name={n <= rating ? "star" : "star-outline"} size={30} color="#EAB308" />
                  </Pressable>
                ))}
              </View>
              <TextInput
                style={styles.commentInput}
                placeholder="Un commentaire (optionnel)..."
                placeholderTextColor={colors.textMuted}
                value={comment}
                onChangeText={setComment}
                multiline
              />
              <View style={styles.modalActions}>
                <Pressable
                  style={styles.modalSubmitButton}
                  onPress={handleSubmitReview}
                  disabled={submittingReview}
                >
                  <Text style={styles.modalSubmitText}>{submittingReview ? "..." : "Envoyer"}</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    );
  }

  return (
    <View style={styles.content}>
      <Pressable
        style={styles.newRequestButton}
        onPress={() => navigation.navigate("SelectionTypeDemande")}
      >
        <Ionicons name="add" size={18} color={colors.onAccent} />
        <Text style={styles.newRequestButtonText}>Nouvelle demande</Text>
      </Pressable>

      {error && <Text style={styles.errorText}>{error}</Text>}

      {activeRequests.length === 0 ? (
        <Text style={styles.hintText}>Aucune demande en cours.</Text>
      ) : (
        <FlatList
          data={activeRequests}
          keyExtractor={(item) => item.id}
          scrollEnabled={false}
          renderItem={({ item }) => (
            <Pressable style={styles.requestCard} onPress={() => loadOffersFor(item)}>
              <LocationText value={item.depart} style={styles.routeText} />
              <Ionicons name="arrow-down" size={12} color={colors.textMuted} style={{ marginVertical: 2 }} />
              <LocationText value={item.destination} style={styles.routeText} />
              <View style={styles.statusRow}>
                <Text style={styles.statusText}>
                  {item.status === "open" ? "En attente d'offres" : "Livreur assigne"}
                </Text>
              </View>
            </Pressable>
          )}
        />
      )}
    </View>
  );
}

function LivrerView() {
  const [requests, setRequests] = useState<ApiDeliveryRequest[]>([]);
  const [myAgencies, setMyAgencies] = useState<{ id: string; name: string }[]>([]);
  const [selectedAgencyId, setSelectedAgencyId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [priceDrafts, setPriceDrafts] = useState<Record<string, string>>({});
  const [submittingId, setSubmittingId] = useState<string | null>(null);
  const [needsLivreurStatus, setNeedsLivreurStatus] = useState(false);
  const [togglingLivreur, setTogglingLivreur] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    setNeedsLivreurStatus(false);
    try {
      const data = await getOpenDeliveryRequests();
      setRequests(data);
      const { getMyEspaces } = await import("../../services/espaces.service");
      const espaces = await getMyEspaces();
      const agencies = espaces
        .filter((e) => e.type === "agence_livraison")
        .map((e) => ({ id: e.id, name: e.name }));
      setMyAgencies(agencies);
    } catch (err: unknown) {
      if (err instanceof ApiRequestError && err.statusCode === 403) {
        setNeedsLivreurStatus(true);
      } else {
        setError(err instanceof ApiRequestError ? err.message : "Erreur de chargement");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  async function handleActivateLivreur() {
    setTogglingLivreur(true);
    try {
      const { setLivreurStatus } = await import("../../services/api");
      await setLivreurStatus(true);
      await load();
    } catch {
      // en cas d'échec, on reste sur l'écran d'invitation
    } finally {
      setTogglingLivreur(false);
    }
  }

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  async function handleSubmitOffer(requestId: string) {
    const priceStr = priceDrafts[requestId];
    const price = Number(priceStr);
    if (!priceStr || isNaN(price) || price <= 0) return;

    setSubmittingId(requestId);
    try {
      await createOffer(requestId, price, selectedAgencyId ?? undefined);
      setPriceDrafts((prev) => ({ ...prev, [requestId]: "" }));
      await load();
    } catch (err: unknown) {
      setError(err instanceof ApiRequestError ? err.message : "Erreur lors de l'envoi de l'offre");
    } finally {
      setSubmittingId(null);
    }
  }

   if (loading) {
    return (
      <View style={styles.centerBox}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  if (needsLivreurStatus) {
    return (
      <View style={styles.livreurGateBox}>
        <Ionicons name="bicycle-outline" size={36} color={colors.accent} />
        <Text style={styles.livreurGateTitle}>Deviens livreur</Text>
        <Text style={styles.livreurGateText}>
          Active ton statut de livreur pour voir les demandes de livraison et proposer tes services.
        </Text>
        <Pressable
          style={styles.livreurGateButton}
          onPress={handleActivateLivreur}
          disabled={togglingLivreur}
        >
          <Text style={styles.livreurGateButtonText}>
            {togglingLivreur ? "..." : "Activer le statut livreur"}
          </Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.content}>
      {myAgencies.length > 0 && (
        <View style={styles.agencySelectorBox}>
          <Text style={styles.agencySelectorLabel}>Proposer en tant que :</Text>
          <View style={styles.agencyChipsRow}>
            <Pressable
              style={[styles.agencyChip, selectedAgencyId === null && styles.agencyChipActive]}
              onPress={() => setSelectedAgencyId(null)}
            >
              <Text style={[styles.agencyChipText, selectedAgencyId === null && styles.agencyChipTextActive]}>
                Moi-meme
              </Text>
            </Pressable>
            {myAgencies.map((agency) => (
              <Pressable
                key={agency.id}
                style={[styles.agencyChip, selectedAgencyId === agency.id && styles.agencyChipActive]}
                onPress={() => setSelectedAgencyId(agency.id)}
              >
                <Text
                  style={[styles.agencyChipText, selectedAgencyId === agency.id && styles.agencyChipTextActive]}
                >
                  {agency.name}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      )}

      {error && <Text style={styles.errorText}>{error}</Text>}
      <FlatList
        data={requests}
        keyExtractor={(item) => item.id}
        scrollEnabled={false}
        ListEmptyComponent={
          <Text style={styles.hintText}>Aucune demande de livraison disponible pour le moment.</Text>
        }
        renderItem={({ item }) => (
          <View style={styles.requestCard}>
            <LocationText value={item.depart} style={styles.routeText} />
            <Ionicons name="arrow-down" size={12} color={colors.textMuted} style={{ marginVertical: 2 }} />
            <LocationText value={item.destination} style={styles.routeText} />
            {item.packageSize && (
              <Text style={styles.packageInfo}>
                Taille : {item.packageSize}
                {item.isFragile ? " - Fragile" : ""}
              </Text>
            )}

            <View style={styles.offerInputRow}>
              <TextInput
                style={styles.priceInput}
                placeholder="Prix (F)"
                placeholderTextColor={colors.textMuted}
                keyboardType="numeric"
                value={priceDrafts[item.id] ?? ""}
                onChangeText={(text) =>
                  setPriceDrafts((prev) => ({ ...prev, [item.id]: text }))
                }
              />
              <Pressable
                style={styles.proposeButton}
                onPress={() => handleSubmitOffer(item.id)}
                disabled={submittingId === item.id}
              >
                <Text style={styles.proposeButtonText}>
                  {submittingId === item.id ? "..." : "Proposer"}
                </Text>
              </Pressable>
            </View>
          </View>
        )}
      />
      <Pressable style={styles.refreshButton} onPress={load}>
        <Ionicons name="refresh" size={16} color={colors.accent} />
        <Text style={styles.refreshText}>Actualiser</Text>
      </Pressable>
    </View>
  );
}

function MesLivraisonsView() {
  const [requests, setRequests] = useState<ApiDeliveryRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [myUserId, setMyUserId] = useState<string | null>(null);
  const [contacts, setContacts] = useState<Record<string, ApiContactInfo>>({});
  const [badgeInfo, setBadgeInfo] = useState<{ completedDeliveries: number; averageRating: number | null; reviewCount: number } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const uid = await getUserId();
      const data = await getAcceptedByMeRaw();
      setMyUserId(uid);
      setRequests(data);

      const contactEntries = await Promise.all(
        data
          .filter((r) => r.status === "assigned")
          .map(async (r) => {
            try {
              const c = await getDeliveryContact(r.id);
              return [r.id, c] as const;
            } catch {
              return null;
            }
          }),
      );
      setContacts(
        Object.fromEntries(
          contactEntries.filter((e): e is [string, ApiContactInfo] => e !== null),
        ),
      );

      if (uid) {
        const { getProviderBadge } = await import("../../services/deliveryReview.service");
        const badge = await getProviderBadge(uid);
        setBadgeInfo(badge);
      }
    } catch (err: unknown) {
      setError(err instanceof ApiRequestError ? err.message : "Erreur de chargement");
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  if (loading) {
    return (
           <View style={styles.centerBox}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  return (
    <View style={styles.content}>
      {badgeInfo && (
        <View style={styles.badgeCard}>
          <Text style={styles.badgeStat}>{badgeInfo.completedDeliveries} livraisons</Text>
          {badgeInfo.averageRating !== null && (
            <View style={styles.badgeRatingRow}>
              <Ionicons name="star" size={14} color="#EAB308" />
              <Text style={styles.badgeStat}>
                {badgeInfo.averageRating} ({badgeInfo.reviewCount} avis)
              </Text>
            </View>
          )}
        </View>
      )}

      {error && <Text style={styles.errorText}>{error}</Text>}

      <FlatList
        data={requests}
        keyExtractor={(item) => item.id}
        scrollEnabled={false}
        ListEmptyComponent={
          <Text style={styles.hintText}>Aucune course acceptee pour l'instant.</Text>
        }
        renderItem={({ item }) => (
          <View style={styles.requestCard}>
            <View style={styles.pickupRow}>
              <View style={styles.dotAccent} />
              <Text style={styles.pickupLabel}>Recuperer a</Text>
            </View>
            <LocationText value={item.depart} style={styles.routeText} />
            <View style={[styles.pickupRow, { marginTop: spacing.sm }]}>
              <View style={styles.dotDanger} />
              <Text style={styles.pickupLabel}>Livrer a</Text>
            </View>
            <LocationText value={item.destination} style={styles.routeText} />
            {item.packageSize && (
              <Text style={styles.packageInfo}>
                Taille : {item.packageSize}
                {item.isFragile ? " - Fragile" : ""}
              </Text>
            )}
                        <View style={styles.statusRow}>
              <Text style={styles.statusText}>
                {item.status === "assigned" ? "En cours" : item.status === "completed" ? "Terminée" : item.status}
              </Text>
            </View>
            {item.status === "assigned" && (
              <TrackingUpdateButtons request={item} onUpdated={load} />
            )}
            {contacts[item.id] && (
              <View style={styles.contactCard}>
                <Ionicons name="person-circle-outline" size={20} color={colors.accent} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.contactName}>{contacts[item.id].name}</Text>
                  <Text style={styles.contactPhone}>{contacts[item.id].phone}</Text>
                </View>
                <Pressable onPress={() => Linking.openURL(`tel:${contacts[item.id].phone}`)}>
                  <Ionicons name="call-outline" size={18} color={colors.accent} />
                </Pressable>
              </View>
            )}
          </View>
        )}
      />
      <Pressable style={styles.refreshButton} onPress={load}>
        <Ionicons name="refresh" size={16} color={colors.accent} />
        <Text style={styles.refreshText}>Actualiser</Text>
      </Pressable>
    </View>
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
    sizeRow: { flexDirection: "row", gap: spacing.sm, marginBottom: spacing.md },
  sizeChip: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: radius.sm,
    backgroundColor: colors.surface,
    alignItems: "center",
  },
  sizeChipActive: { backgroundColor: colors.accent },
  sizeChipText: { fontSize: 12, color: colors.textSecondary, fontWeight: "600" },
  sizeChipTextActive: { color: colors.onAccent },
  fragileRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm, marginBottom: spacing.md },
  fragileText: { fontSize: 13, color: colors.textPrimary },
  headerTitle: { fontSize: 18, fontWeight: "700", color: colors.textPrimary },
  toggleRow: {
    flexDirection: "row",
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.pill,
    padding: 4,
  },
  toggleButton: { flex: 1, paddingVertical: 8, alignItems: "center", borderRadius: radius.pill },
  toggleButtonActive: { backgroundColor: colors.accent },
  toggleText: { fontSize: 12, fontWeight: "600", color: colors.textSecondary },
  toggleTextActive: { color: colors.onAccent },
  content: { flex: 1, paddingHorizontal: spacing.lg },
  centerBox: { flex: 1, alignItems: "center", justifyContent: "center" },
  livreurGateBox: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.xl,
    gap: spacing.sm,
  },
  livreurGateTitle: { fontSize: 16, fontWeight: "700", color: colors.textPrimary, marginTop: spacing.sm },
  livreurGateText: { fontSize: 13, color: colors.textSecondary, textAlign: "center", lineHeight: 19, marginBottom: spacing.md },
  livreurGateButton: {
    backgroundColor: colors.accent,
    borderRadius: radius.sm,
    paddingVertical: 12,
    paddingHorizontal: spacing.xl,
  },
  livreurGateButtonText: { fontSize: 14, fontWeight: "600", color: colors.onAccent },
  label: { fontSize: 12, color: colors.textSecondary, marginBottom: 6 },
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
  locationRow: { flexDirection: "row", gap: spacing.sm, alignItems: "center" },
  gpsButton: {
    width: 40,
    height: 40,
    borderRadius: radius.sm,
    backgroundColor: colors.accentBg,
    alignItems: "center",
    justifyContent: "center",
  },
  gpsHint: { fontSize: 10, color: colors.textMuted, marginTop: 4 },
  errorText: { fontSize: 12, color: colors.danger, marginBottom: spacing.md },
  submitButton: {
    backgroundColor: colors.accent,
    borderRadius: radius.sm,
    paddingVertical: 12,
    alignItems: "center",
    marginTop: spacing.sm,
  },
  submitButtonDisabled: { backgroundColor: colors.borderStrong },
  submitButtonText: { fontSize: 14, fontWeight: "600", color: colors.onAccent },
  formHeaderRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm, marginBottom: spacing.md },
  formHeaderTitle: { fontSize: 14, fontWeight: "600", color: colors.textPrimary },
  newRequestButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: colors.accent,
    borderRadius: radius.sm,
    paddingVertical: 12,
    marginBottom: spacing.md,
  },
  newRequestButtonText: { fontSize: 13, fontWeight: "600", color: colors.onAccent },
  routeCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  routeText: { fontSize: 14, color: colors.textPrimary },
  packageInfo: { fontSize: 11, color: colors.textMuted, marginTop: 4 },
  assignedBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.accentBg,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  assignedText: { fontSize: 13, color: colors.textPrimary, flex: 1 },
  contactCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    marginTop: spacing.sm,
  },
  contactName: { fontSize: 13, fontWeight: "600", color: colors.textPrimary },
  contactPhone: { fontSize: 12, color: colors.textMuted },
  receivedButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: colors.accent,
    borderRadius: radius.sm,
    paddingVertical: 12,
    marginTop: spacing.md,
  },
  receivedButtonText: { fontSize: 13, fontWeight: "600", color: colors.onAccent },
  offersHeaderTitle: { fontSize: 13, fontWeight: "600", color: colors.textPrimary, marginBottom: spacing.sm },
  hintText: { fontSize: 12, color: colors.textMuted, marginBottom: spacing.md },
  offerCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  offerPrice: { fontSize: 16, fontWeight: "700", color: colors.textPrimary },
  chooseButton: {
    backgroundColor: colors.accent,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
  },
  chooseButtonText: { fontSize: 12, fontWeight: "600", color: colors.onAccent },
  requestCard: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
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
  refreshButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingVertical: spacing.md,
  },
  refreshText: { fontSize: 12, fontWeight: "600", color: colors.accent },
  agencySelectorBox: { marginBottom: spacing.md },
  agencySelectorLabel: { fontSize: 12, color: colors.textSecondary, marginBottom: spacing.sm },
  agencyChipsRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  agencyChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
  },
  agencyChipActive: { backgroundColor: colors.accent },
  agencyChipText: { fontSize: 12, color: colors.textSecondary, fontWeight: "600" },
  agencyChipTextActive: { color: colors.onAccent },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.lg,
  },
  modalBox: { width: "100%", backgroundColor: colors.background, borderRadius: radius.md, padding: spacing.lg },
  modalTitle: { fontSize: 15, fontWeight: "600", color: colors.textPrimary, marginBottom: spacing.md, textAlign: "center" },
  starsRow: { flexDirection: "row", justifyContent: "center", gap: spacing.sm, marginBottom: spacing.md },
  commentInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    fontSize: 13,
    color: colors.textPrimary,
    backgroundColor: colors.surface,
    height: 70,
    textAlignVertical: "top",
    marginBottom: spacing.md,
  },
  modalActions: { flexDirection: "row" },
  modalSubmitButton: {
    flex: 1,
    backgroundColor: colors.accent,
    borderRadius: radius.sm,
    paddingVertical: 11,
    alignItems: "center",
  },
  modalSubmitText: { fontSize: 13, fontWeight: "600", color: colors.onAccent },
  badgeCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  badgeStat: { fontSize: 13, fontWeight: "600", color: colors.textPrimary },
  badgeRatingRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  pickupRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  dotAccent: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.accent },
  dotDanger: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.danger },
  pickupLabel: { fontSize: 11, color: colors.textMuted, fontWeight: "600" },
  statusRow: { marginTop: spacing.sm },
  statusText: { fontSize: 11, color: colors.accent, fontWeight: "600" },
   trackingButton: {
    backgroundColor: colors.accent,
    borderRadius: radius.sm,
    paddingVertical: 8,
    alignItems: "center",
    marginTop: spacing.sm,
  },
  trackingButtonText: { fontSize: 12, fontWeight: "600", color: colors.onAccent }, 
});
function TrackingUpdateButtons({
  request,
  onUpdated,
}: {
  request: ApiDeliveryRequest;
  onUpdated: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const steps = request.trackingSteps ?? [];
  const doneSteps = new Set(steps.map((s) => s.step));

  const nextStep = !doneSteps.has("picked_up")
    ? "picked_up"
    : !doneSteps.has("in_transit")
      ? "in_transit"
      : !doneSteps.has("delivered")
        ? "delivered"
        : null;

  const nextLabel: Record<string, string> = {
    picked_up: "Marquer comme récupéré",
    in_transit: "Marquer en route",
    delivered: "Marquer comme livré",
  };

  if (!nextStep) return null;

  async function handlePress() {
    setBusy(true);
    try {
      const { addTrackingStep } = await import("../../services/delivery.service");
      await addTrackingStep(request.id, nextStep!);
      onUpdated();
    } catch {
      // en cas d'échec, l'utilisateur peut réessayer
    } finally {
      setBusy(false);
    }
  }

  return (
    <Pressable style={styles.trackingButton} onPress={handlePress} disabled={busy}>
      <Text style={styles.trackingButtonText}>{busy ? "..." : nextLabel[nextStep]}</Text>
    </Pressable>
  );
}