import React, { useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { colors, radius, spacing } from "@/theme/colors";
import { RootStackParamList } from "@/navigation/types";
import { forgotPassword } from "../../services/auth.service";
import { ApiRequestError } from "../../services/api";

type Nav = NativeStackNavigationProp<RootStackParamList>;

export function ForgotPasswordScreen() {
  const navigation = useNavigation<Nav>();
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [channel, setChannel] = useState<"email" | "sms">("email");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit =
    phone.trim().length > 0 &&
    (channel === "sms" || email.trim().length > 0) &&
    !loading;

  async function handleSubmit() {
    if (!canSubmit) return;
    setError(null);
    setLoading(true);
    try {
      await forgotPassword(channel, email.trim() || undefined, phone.trim());
      navigation.navigate("ResetPassword", { email: email.trim() });
    } catch (err: unknown) {
      setError(err instanceof ApiRequestError ? err.message : "Erreur lors de l'envoi du code.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.headerRow}>
        <Ionicons name="arrow-back" size={20} color={colors.textSecondary} onPress={() => navigation.goBack()} />
        <Text style={styles.headerTitle}>Mot de passe oublié</Text>
        <View style={{ width: 20 }} />
      </View>

      <View style={styles.content}>
        <Text style={styles.hint}>
          Entre ton numéro de téléphone, on t'enverra un code pour réinitialiser ton mot de passe.
        </Text>

        <Text style={styles.label}>Numéro de téléphone</Text>
        <TextInput
          style={styles.input}
          placeholder="Ex. 70123456"
          placeholderTextColor={colors.textMuted}
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
        />

            {channel === "email" && (
          <>
            <Text style={styles.label}>Ton adresse email</Text>
            <TextInput
              style={styles.input}
              placeholder="exemple@email.com"
              placeholderTextColor={colors.textMuted}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </>
        )}

        <Text style={styles.label}>Recevoir le code par</Text>
        <View style={styles.channelRow}>
          <Pressable
            style={[styles.channelChip, channel === "email" && styles.channelChipActive]}
            onPress={() => setChannel("email")}
          >
            <Ionicons name="mail-outline" size={16} color={channel === "email" ? colors.onAccent : colors.textSecondary} />
            <Text style={[styles.channelChipText, channel === "email" && styles.channelChipTextActive]}>
              Email
            </Text>
          </Pressable>
          <Pressable
            style={[styles.channelChip, channel === "sms" && styles.channelChipActive]}
            onPress={() => setChannel("sms")}
          >
            <Ionicons name="chatbox-outline" size={16} color={channel === "sms" ? colors.onAccent : colors.textSecondary} />
            <Text style={[styles.channelChipText, channel === "sms" && styles.channelChipTextActive]}>
              SMS
            </Text>
          </Pressable>
        </View>
        {channel === "sms" && (
          <Text style={styles.smsWarning}>
            La réinitialisation par SMS n'est pas encore disponible. Utilise l'email pour l'instant.
          </Text>
        )}

        {error && <Text style={styles.errorText}>{error}</Text>}

        <Pressable
          style={[styles.submitButton, !canSubmit && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={!canSubmit}
        >
          {loading ? (
            <ActivityIndicator color={colors.onAccent} />
          ) : (
            <Text style={styles.submitButtonText}>Envoyer le code</Text>
          )}
        </Pressable>
      </View>
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
  content: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg },
  hint: { fontSize: 13, color: colors.textSecondary, lineHeight: 19, marginBottom: spacing.lg },
  label: { fontSize: 12, color: colors.textSecondary, marginBottom: 6, marginTop: spacing.sm },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    fontSize: 14,
    color: colors.textPrimary,
    backgroundColor: colors.surface,
    marginBottom: spacing.md,
  },
  channelRow: { flexDirection: "row", gap: spacing.sm, marginBottom: spacing.sm },
  channelChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
  },
  channelChipActive: { backgroundColor: colors.accent },
  channelChipText: { fontSize: 13, color: colors.textSecondary, fontWeight: "600" },
  channelChipTextActive: { color: colors.onAccent },
  smsWarning: { fontSize: 11, color: colors.secondary, marginBottom: spacing.md },
  errorText: { fontSize: 12, color: colors.danger, marginBottom: spacing.md },
  submitButton: {
    backgroundColor: colors.accent,
    borderRadius: radius.sm,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: spacing.md,
  },
  submitButtonDisabled: { backgroundColor: colors.borderStrong },
  submitButtonText: { fontSize: 15, fontWeight: "600", color: colors.onAccent },
});