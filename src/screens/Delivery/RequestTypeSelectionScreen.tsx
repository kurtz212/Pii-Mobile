import React from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { colors, radius, spacing } from "@/theme/colors";
import { RootStackParamList } from "@/navigation/types";

type Nav = NativeStackNavigationProp<RootStackParamList>;

const OPTIONS = [
  {
    key: "livreur" as const,
    icon: "bicycle-outline" as const,
    title: "Livreur",
    subtitle: "Envoi rapide en ville, colis courant",
  },
  {
    key: "cargo" as const,
    icon: "boat-outline" as const,
    title: "Agence cargo",
    subtitle: "Marchandises entre pays, prix au kilogramme",
  },
  {
    key: "transitaire" as const,
    icon: "cube-outline" as const,
    title: "Transitaire",
    subtitle: "Conteneur, formalités de transit",
  },
];

export function RequestTypeSelectionScreen() {
  const navigation = useNavigation<Nav>();

   function handleSelect(key: "livreur" | "cargo" | "transitaire") {
    if (key === "livreur") {
      navigation.navigate("Tabs", {
        screen: "Livraison",
        params: { openLivreurForm: true },
      } as never);
      return;
    }
    if (key === "cargo") {
      navigation.replace("DemandeDevisCargo");
      return;
    }
    navigation.replace("DemandeDevisTransitaire");
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.headerRow}>
        <Ionicons name="close" size={20} color={colors.textSecondary} onPress={() => navigation.goBack()} />
        <Text style={styles.headerTitle}>Nouvelle demande</Text>
        <View style={{ width: 20 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.hint}>Que veux-tu envoyer ou transporter ?</Text>

        {OPTIONS.map((opt) => (
          <Pressable key={opt.key} style={styles.optionCard} onPress={() => handleSelect(opt.key)}>
            <View style={styles.iconBox}>
              <Ionicons name={opt.icon} size={22} color={colors.accent} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.optionTitle}>{opt.title}</Text>
              <Text style={styles.optionSubtitle}>{opt.subtitle}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </Pressable>
        ))}
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
  hint: { fontSize: 13, color: colors.textSecondary, marginBottom: spacing.lg },
  optionCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.accentBg,
    alignItems: "center",
    justifyContent: "center",
  },
  optionTitle: { fontSize: 14, fontWeight: "600", color: colors.textPrimary },
  optionSubtitle: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
});