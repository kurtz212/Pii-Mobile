import React, { useCallback, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { colors, radius, spacing } from "@/theme/colors";
import { RootStackParamList } from "@/navigation/types";
import { ApiGroup, getMyGroups } from "../../services/group.service";
import { getUserId } from "../../services/api";
import { ApiRequestError } from "../../services/api";

type Nav = NativeStackNavigationProp<RootStackParamList>;

export function GroupListScreen() {
  const navigation = useNavigation<Nav>();
  const [groups, setGroups] = useState<ApiGroup[]>([]);
  const [myUserId, setMyUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      async function load() {
        setLoading(true);
        setError(null);
        try {
          const uid = await getUserId();
          const data = await getMyGroups();
          if (!cancelled) {
            setMyUserId(uid);
            setGroups(data);
          }
        } catch (err: unknown) {
          if (!cancelled) setError(err instanceof ApiRequestError ? err.message : "Erreur de chargement");
        } finally {
          if (!cancelled) setLoading(false);
        }
      }
      load();
      return () => {
        cancelled = true;
      };
    }, []),
  );

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.headerRow}>
        <Ionicons name="arrow-back" size={20} color={colors.textSecondary} onPress={() => navigation.goBack()} />
        <Text style={styles.headerTitle}>Mes groupes</Text>
        <View style={{ width: 20 }} />
      </View>

      {loading && (
        <View style={styles.centerBox}>
          <ActivityIndicator color={colors.accent} />
        </View>
      )}

      {!loading && error && (
        <View style={styles.centerBox}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {!loading && !error && (
        <FlatList
          data={groups}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.centerBox}>
              <Text style={styles.emptyText}>
                Tu n'as encore rejoint aucun groupe. Découvre-en depuis le tableau de bord d'une boutique.
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <Pressable
              style={styles.card}
              onPress={() =>
                navigation.navigate("GroupeMessages", {
                  groupId: item.id,
                  groupName: item.name,
                  groupType: item.type,
                  isCreator: item.creatorId === myUserId,
                })
              }
            >
              <View style={[styles.iconBox, item.type === "annonces" && styles.iconBoxAnnonces]}>
                <Ionicons
                  name={item.type === "annonces" ? "megaphone-outline" : "people-outline"}
                  size={18}
                  color={item.type === "annonces" ? colors.secondary : colors.accent}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardName}>{item.name}</Text>
                <Text style={styles.cardType}>
                  {item.type === "annonces" ? "Canal d'annonces" : "Discussion"}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
            </Pressable>
          )}
        />
      )}
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
  centerBox: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: spacing.xl },
  errorText: { fontSize: 13, color: colors.danger },
  emptyText: { fontSize: 13, color: colors.textMuted, textAlign: "center", lineHeight: 19 },
  list: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: colors.accentBg,
    alignItems: "center",
    justifyContent: "center",
  },
  iconBoxAnnonces: { backgroundColor: colors.secondaryBg },
  cardName: { fontSize: 14, fontWeight: "600", color: colors.textPrimary },
  cardType: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
});