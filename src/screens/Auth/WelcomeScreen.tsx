import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { colors, radius, spacing } from "@/theme/colors";
import { RootStackParamList } from "@/navigation/types";

type Nav = NativeStackNavigationProp<RootStackParamList>;

export function WelcomeScreen() {
  const navigation = useNavigation<Nav>();

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <View style={styles.content}>
        <Text style={styles.logo}>Pii</Text>

        <View style={styles.illustration}>
          <View style={[styles.iconBadge, styles.iconBadgeTopLeft]}>
            <Ionicons name="storefront-outline" size={28} color={colors.accent} />
          </View>
          <View style={[styles.iconBadge, styles.iconBadgeBottomRight]}>
            <Ionicons name="car-outline" size={28} color={colors.secondary} />
          </View>
          <View style={styles.iconCircleCenter}>
            <Ionicons name="bag-outline" size={30} color={colors.accent} />
          </View>
        </View>

        <Text style={styles.title}>Achète, vends, livre.{"\n"}Tout en un.</Text>
        <Text style={styles.subtitle}>
          Boutiques, livraisons, services et tontines réunis dans une seule application.
        </Text>

        <View style={styles.dotsRow}>
          <View style={[styles.dot, styles.dotActive]} />
          <View style={styles.dot} />
          <View style={styles.dot} />
        </View>
      </View>

      <View style={styles.footer}>
        <Pressable style={styles.primaryButton} onPress={() => navigation.navigate("Register")}>
          <Text style={styles.primaryButtonText}>Créer un compte</Text>
        </Pressable>
        <Pressable style={styles.secondaryButton} onPress={() => navigation.navigate("Login")}>
          <Text style={styles.secondaryButtonText}>J'ai déjà un compte</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.xl,
  },
  logo: {
    fontSize: 38,
    fontWeight: "700",
    color: colors.accent,
    letterSpacing: -1,
    marginBottom: spacing.xl,
  },
  illustration: {
    width: "100%",
    height: 220,
    borderRadius: 20,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.xl,
    position: "relative",
    overflow: "hidden",
  },
  iconBadge: {
    position: "absolute",
    width: 70,
    height: 70,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  iconBadgeTopLeft: { top: 20, left: 20, backgroundColor: colors.accentBg },
  iconBadgeBottomRight: { bottom: 24, right: 24, backgroundColor: colors.secondaryBg },
  iconCircleCenter: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: colors.textPrimary,
    textAlign: "center",
    lineHeight: 29,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 20,
    maxWidth: 280,
  },
  dotsRow: { flexDirection: "row", gap: 6, marginTop: spacing.lg },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.border },
  dotActive: { width: 20, backgroundColor: colors.accent },
  footer: { paddingHorizontal: spacing.xl, paddingBottom: spacing.lg },
  primaryButton: {
    backgroundColor: colors.accent,
    borderRadius: radius.md,
    paddingVertical: 15,
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  primaryButtonText: { fontSize: 15, fontWeight: "600", color: colors.onAccent },
  secondaryButton: {
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: radius.md,
    paddingVertical: 15,
    alignItems: "center",
  },
  secondaryButtonText: { fontSize: 15, fontWeight: "600", color: colors.textPrimary },
});