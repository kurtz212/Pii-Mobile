import React from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { colors, radius, spacing } from "@/theme/colors";
import { espaceTypeOptions } from "@/data/mockData";
import { EspaceType } from "@/types";
import { RootStackParamList } from "@/navigation/types";

type Nav = NativeStackNavigationProp<RootStackParamList>;

const IMPLEMENTED_TYPES: EspaceType[] = [
  "boutique",
  "entrepreneur",
  "agence_livraison",
  "agence_cargo",
  "transitaire",
];

export function EspaceTypeSelectionScreen() {
  const navigation = useNavigation<Nav>();

  function handleSelect(type: EspaceType) {
    if (type === "boutique") {
      navigation.navigate("CreerBoutique");
    } else if (type === "entrepreneur") {
      navigation.navigate("CreerEntrepreneur");
    } else if (type === "agence_livraison") {
      navigation.navigate("CreerAgenceLivraison");
    } else if (type === "agence_cargo") {
      navigation.navigate("CreerAgenceCargo");
    } else if (type === "transitaire") {
      navigation.navigate("CreerTransitaire");
    }
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.headerRow}>
        <Ionicons name="arrow-back" size={20} color={colors.textSecondary} />
        <Text style={styles.headerTitle}>Créer un espace</Text>
        <View style={{ width: 20 }} />
      </View>

      <Text style={styles.subtitle}>
        Choisis le type d'espace que tu veux ajouter à ton compte. Tu pourras en créer
        plusieurs par la suite.
      </Text>

      <FlatList
        data={espaceTypeOptions}
        keyExtractor={(item) => item.type}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => {
          const enabled = IMPLEMENTED_TYPES.includes(item.type);
          return (
            <Pressable
              style={[styles.card, !enabled && styles.cardDisabled]}
              onPress={() => enabled && handleSelect(item.type)}
              disabled={!enabled}
            >
              <View style={styles.iconCircle}>
                <Ionicons name={item.icon as any} size={22} color={colors.accent} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>{item.label}</Text>
                <Text style={styles.cardDescription}>{item.description}</Text>
                {!enabled && <Text style={styles.comingSoon}>Bientôt disponible</Text>}
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
            </Pressable>
          );
        }}
      />
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
  subtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
    lineHeight: 19,
  },
  list: { paddingHorizontal: spacing.lg, gap: spacing.sm, paddingBottom: spacing.xl },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  cardDisabled: { opacity: 0.5 },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.accentBg,
    alignItems: "center",
    justifyContent: "center",
  },
  cardTitle: { fontSize: 14, fontWeight: "600", color: colors.textPrimary },
  cardDescription: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  comingSoon: { fontSize: 11, color: colors.secondary, marginTop: 4 },
});