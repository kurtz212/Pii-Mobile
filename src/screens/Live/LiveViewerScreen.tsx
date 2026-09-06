import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { colors, radius, spacing } from "@/theme/colors";
import { RootStackParamList } from "@/navigation/types";

type Nav = NativeStackNavigationProp<RootStackParamList>;

export function LiveViewerScreen() {
  const navigation = useNavigation<Nav>();

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.headerRow}>
        <Ionicons name="close" size={22} color={colors.textSecondary} onPress={() => navigation.goBack()} />
      </View>

      <View style={styles.content}>
        <View style={styles.iconBox}>
          <Ionicons name="radio-outline" size={36} color={colors.accent} />
        </View>
        <Text style={styles.title}>Live bientôt disponible</Text>
        <Text style={styles.subtitle}>
          Tu pourras bientôt lancer ou regarder des lives en direct, ouverts à tous — sans être
          rattaché à une publication précise.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  headerRow: { flexDirection: "row", justifyContent: "flex-end", paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
  content: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: spacing.xl },
  iconBox: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.accentBg,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.lg,
  },
  title: { fontSize: 18, fontWeight: "700", color: colors.textPrimary, marginBottom: spacing.sm, textAlign: "center" },
  subtitle: { fontSize: 13, color: colors.textSecondary, textAlign: "center", lineHeight: 19 },
});