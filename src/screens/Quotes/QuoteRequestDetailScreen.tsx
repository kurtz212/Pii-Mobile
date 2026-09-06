import React, { useCallback, useState } from "react";
import { ActivityIndicator, FlatList, StyleSheet, Text, View, Pressable, Linking } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useNavigation, useRoute } from "@react-navigation/native";
import { NativeStackNavigationProp, NativeStackScreenProps } from "@react-navigation/native-stack";
import { colors, radius, spacing } from "@/theme/colors";
import { RootStackParamList } from "@/navigation/types";
import { QuoteTrackingTimeline } from "./QuoteTrackingTimeline";
import {
  ApiQuote,
  ApiQuoteContactInfo,
  ApiQuoteRequest,
  acceptQuote,
  getQuoteContact,
  getQuotesForRequest,
} from "../../services/quote.service";
import { api, ApiRequestError } from "../../services/api";

type Props = NativeStackScreenProps<RootStackParamList, "QuoteRequestDetail">;
type Nav = NativeStackNavigationProp<RootStackParamList>;

export function QuoteRequestDetailScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Props["route"]>();
  const { requestId } = route.params;

  const [request, setRequest] = useState<ApiQuoteRequest | null>(null);
  const [quotes, setQuotes] = useState<ApiQuote[]>([]);
  const [contact, setContact] = useState<ApiQuoteContactInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [acceptingId, setAcceptingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const req = await api.get<ApiQuoteRequest>(`/quote-requests/${requestId}`, true);
      const quotesData = await getQuotesForRequest(requestId);
      setRequest(req);
      setQuotes(quotesData);
      if (req.status === "accepted" || req.status === "completed") {
        try {
          const contactData = await getQuoteContact(requestId);
          setContact(contactData);
        } catch {
          // pas grave si le contact n'est pas encore disponible
        }
      }
    } catch (err: unknown) {
      setError(err instanceof ApiRequestError ? err.message : "Erreur de chargement");
    } finally {
      setLoading(false);
    }
  }, [requestId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  async function handleAccept(quoteId: string) {
    setAcceptingId(quoteId);
    try {
      await acceptQuote(requestId, quoteId);
      await load();
    } catch {
      // en cas d'échec on ne change rien
    } finally {
      setAcceptingId(null);
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

  if (error || !request) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.headerRow}>
          <Ionicons name="arrow-back" size={20} color={colors.textSecondary} onPress={() => navigation.goBack()} />
        </View>
        <View style={styles.centerBox}>
          <Text style={styles.errorText}>{error ?? "Demande introuvable"}</Text>
        </View>
      </SafeAreaView>
    );
  }

  const acceptedQuote = quotes.find((q) => q.id === request.acceptedQuoteId);

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.headerRow}>
        <Ionicons name="arrow-back" size={20} color={colors.textSecondary} onPress={() => navigation.goBack()} />
        <Text style={styles.headerTitle}>Réponses reçues</Text>
        <View style={{ width: 20 }} />
      </View>

      {acceptedQuote && (
        <View style={styles.acceptedBanner}>
          <Ionicons name="checkmark-circle" size={16} color={colors.accent} />
          <Text style={styles.acceptedBannerText}>
            Devis accepté avec {acceptedQuote.espace.name} — {Number(acceptedQuote.price).toLocaleString("fr-FR")} F
          </Text>
        </View>
      )}
        {request.status === "accepted" && (
          <QuoteTrackingTimeline steps={request.trackingSteps ?? []} />
        )}

        <View style={styles.contactCard}></View>
      {contact && (
        <View style={styles.contactCard}>
          <Ionicons name="person-circle-outline" size={22} color={colors.accent} />
          <View style={{ flex: 1 }}>
            <Text style={styles.contactName}>{contact.name}</Text>
            {contact.agencyName && <Text style={styles.contactAgency}>{contact.agencyName}</Text>}
            <Text style={styles.contactPhone}>{contact.phone}</Text>
          </View>
          <Pressable onPress={() => Linking.openURL(`tel:${contact.phone}`)}>
            <Ionicons name="call-outline" size={20} color={colors.accent} />
          </Pressable>
        </View>
      )}

      <FlatList
        data={quotes}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.centerBox}>
            <Text style={styles.emptyText}>Aucune réponse pour l'instant. Reviens plus tard.</Text>
          </View>
        }
        renderItem={({ item }) => {
          const isAccepted = item.id === request.acceptedQuoteId;
          return (
            <View style={[styles.quoteCard, isAccepted && styles.quoteCardAccepted]}>
              <Text style={styles.quoteAgency}>{item.espace.name}</Text>
              <Text style={styles.quotePrice}>{Number(item.price).toLocaleString("fr-FR")} F</Text>
              {item.notes && <Text style={styles.quoteNotes}>{item.notes}</Text>}
              {request.status === "open" && (
                <Pressable
                  style={styles.acceptButton}
                  onPress={() => handleAccept(item.id)}
                  disabled={acceptingId === item.id}
                >
                  <Text style={styles.acceptButtonText}>
                    {acceptingId === item.id ? "..." : "Accepter ce devis"}
                  </Text>
                </Pressable>
              )}
              {isAccepted && (
                <View style={styles.acceptedTag}>
                  <Text style={styles.acceptedTagText}>Accepté</Text>
                </View>
              )}
            </View>
          );
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  centerBox: { flex: 1, alignItems: "center", justifyContent: "center" },
  errorText: { fontSize: 13, color: colors.danger },
  emptyText: { fontSize: 13, color: colors.textMuted, textAlign: "center" },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  headerTitle: { fontSize: 16, fontWeight: "600", color: colors.textPrimary },
  acceptedBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.accentBg,
    padding: spacing.md,
    marginHorizontal: spacing.lg,
    borderRadius: radius.sm,
    marginBottom: spacing.sm,
  },
  acceptedBannerText: { fontSize: 12, color: colors.textPrimary, flex: 1 },
  contactCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
  },
  contactName: { fontSize: 13, fontWeight: "600", color: colors.textPrimary },
  contactAgency: { fontSize: 11, color: colors.textSecondary, marginTop: 1 },
  contactPhone: { fontSize: 12, color: colors.textMuted, marginTop: 1 },
  list: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm },
  quoteCard: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  quoteCardAccepted: { borderColor: colors.accent, backgroundColor: colors.accentBg },
  quoteAgency: { fontSize: 14, fontWeight: "600", color: colors.textPrimary },
  quotePrice: { fontSize: 18, fontWeight: "700", color: colors.accent, marginTop: 4 },
  quoteNotes: { fontSize: 12, color: colors.textSecondary, marginTop: 4, fontStyle: "italic" },
  acceptButton: {
    backgroundColor: colors.accent,
    borderRadius: radius.sm,
    paddingVertical: 9,
    alignItems: "center",
    marginTop: spacing.sm,
  },
  acceptButtonText: { fontSize: 12, fontWeight: "600", color: colors.onAccent },
  acceptedTag: { marginTop: spacing.sm, alignSelf: "flex-start", backgroundColor: colors.accent, paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: radius.sm },
  acceptedTagText: { fontSize: 11, fontWeight: "600", color: colors.onAccent },
});