import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, radius, spacing } from "@/theme/colors";
import { Publication } from "@/types";
import { Avatar } from "./Avatar";
import { Badge } from "./Badge";

interface PublicationCardProps {
  publication: Publication;
  onContact?: () => void;
  onOrder?: () => void;
}

export function PublicationCard({ publication, onContact, onOrder }: PublicationCardProps) {
  const { owner, title, price, currency, tranchesActivees } = publication;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Avatar initials={owner.initials} colorKey={owner.colorKey} size={32} />
        <View style={{ flex: 1 }}>
          <View style={styles.nameRow}>
            <Text style={styles.name}>{owner.name}</Text>
            <Badge level={owner.badgeLevel} label={owner.badgeThematique} />
          </View>
          {owner.location ? <Text style={styles.location}>Boutique · {owner.location}</Text> : null}
        </View>
      </View>

      <View style={styles.imagePlaceholder}>
        <Ionicons name="image-outline" size={28} color={colors.textMuted} />
      </View>

      <View style={styles.priceRow}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.price}>
          {price.toLocaleString("fr-FR")} {currency === "XOF" ? "F" : currency}
        </Text>
      </View>

      {tranchesActivees ? (
        <Text style={styles.tranches}>Paiement par tranches disponible</Text>
      ) : null}

      {(onContact || onOrder) && (
        <View style={styles.actions}>
          {onContact && (
            <Pressable style={[styles.button, styles.buttonSecondary]} onPress={onContact}>
              <Text style={styles.buttonSecondaryText}>Contacter</Text>
            </Pressable>
          )}
          {onOrder && (
            <Pressable style={[styles.button, styles.buttonPrimary]} onPress={onOrder}>
              <Text style={styles.buttonPrimaryText}>Commander</Text>
            </Pressable>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  name: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  location: {
    fontSize: 12,
    color: colors.textMuted,
  },
  imagePlaceholder: {
    width: "100%",
    height: 160,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: spacing.sm,
  },
  title: {
    fontSize: 14,
    color: colors.textPrimary,
  },
  price: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  tranches: {
    fontSize: 11,
    color: colors.secondary,
    marginTop: 4,
  },
  actions: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  button: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: radius.sm,
    alignItems: "center",
  },
  buttonSecondary: {
    borderWidth: 1,
    borderColor: colors.borderStrong,
  },
  buttonSecondaryText: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  buttonPrimary: {
    backgroundColor: colors.accent,
  },
  buttonPrimaryText: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.onAccent,
  },
});
