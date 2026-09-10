import React, { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { colors, radius, spacing } from "@/theme/colors";
import { RootStackParamList } from "@/navigation/types";
import { getMyProfile, updateLanguagePreferences, SUPPORTED_LANGUAGES } from "../../services/affiliation.service";
import { ApiRequestError } from "../../services/api";

type Nav = NativeStackNavigationProp<RootStackParamList>;

export function LanguageSettingsScreen() {
  const navigation = useNavigation<Nav>();
  const [current, setCurrent] = useState<string>("fr");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const profile = await getMyProfile();
        if (!cancelled) setCurrent((profile as any).preferredTextLanguage ?? "fr");
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
  }, []);

  async function handleSelect(code: string) {
    if (code === current || saving) return;
    setSaving(true);
    setError(null);
    try {
      await updateLanguagePreferences(code);
      setCurrent(code);
    } catch (err: unknown) {
      setError(err instanceof ApiRequestError ? err.message : "Erreur lors de la mise à jour");
    } finally {
      setSaving(false);
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

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.headerRow}>
        <Ionicons name="arrow-back" size={20} color={colors.textSecondary} onPress={() => navigation.goBack()} />
        <Text style={styles.headerTitle}>Langue des messages</Text>
        <View style={{ width: 20 }} />
      </View>

      <View style={styles.content}>
        <Text style={styles.hint}>
          Les messages écrits que tu reçois seront automatiquement traduits dans cette langue.
        </Text>

        {error && <Text style={styles.errorText}>{error}</Text>}

        {SUPPORTED_LANGUAGES.map((lang) => {
          const active = lang.code === current;
          return (
            <Pressable
              key={lang.code}
              style={[styles.langRow, active && styles.langRowActive]}
              onPress={() => handleSelect(lang.code)}
              disabled={saving}
            >
              <Text style={[styles.langLabel, active && styles.langLabelActive]}>{lang.label}</Text>
              {active && <Ionicons name="checkmark-circle" size={20} color={colors.accent} />}
            </Pressable>
          );
        })}

        <View style={styles.infoNote}>
          <Ionicons name="information-circle-outline" size={16} color={colors.textSecondary} />
          <Text style={styles.infoText}>
            Traduction automatique — la qualité peut varier selon les langues. Les messages
            audio ne sont pas encore traduits.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  centerBox: { flex: 1, alignItems: "center", justifyContent: "center" },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  headerTitle: { fontSize: 16, fontWeight: "600", color: colors.textPrimary },
  content: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm },
  hint: { fontSize: 12, color: colors.textSecondary, lineHeight: 17, marginBottom: spacing.lg },
  errorText: { fontSize: 12, color: colors.danger, marginBottom: spacing.md },
  langRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    marginBottom: spacing.sm,
  },
  langRowActive: { borderColor: colors.accent, backgroundColor: colors.accentBg },
  langLabel: { fontSize: 14, color: colors.textPrimary },
  langLabelActive: { color: colors.accent, fontWeight: "600" },
  infoNote: {
    flexDirection: "row",
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.sm,
    padding: spacing.md,
    marginTop: spacing.md,
  },
  infoText: { flex: 1, fontSize: 11, color: colors.textSecondary, lineHeight: 16 },
});