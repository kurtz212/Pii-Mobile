import React, { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { colors, radius, spacing } from "@/theme/colors";
import { RootStackParamList } from "@/navigation/types";
import { login } from "../../services/auth.service";
import { ApiRequestError } from "../../services/api";
import { registerForPushNotifications } from "../../services/notifications.service";
type Nav = NativeStackNavigationProp<RootStackParamList>;

export function LoginScreen() {
  const navigation = useNavigation<Nav>();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = phone.trim().length > 0 && password.trim().length > 0 && !loading;

  async function handleLogin() {
    setError(null);
    setLoading(true);
    try {
      await login(phone.trim(), password);
      navigation.reset({ index: 0, routes: [{ name: "Tabs" }] });
            registerForPushNotifications();
    } catch (err: unknown) {
      if (err instanceof ApiRequestError) {
        setError(err.message);
      } else {
        setError("Impossible de se connecter au serveur. Vérifie ta connexion.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <View style={styles.content}>
        <Text style={styles.logo}>Pii</Text>
        <Text style={styles.title}>Content de te revoir</Text>
        <Text style={styles.subtitle}>Connecte-toi pour continuer.</Text>

        <Text style={styles.label}>Numéro de téléphone</Text>
        <TextInput
          style={styles.input}
          placeholder="Ex. 70123456"
          placeholderTextColor={colors.textMuted}
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
          autoCapitalize="none"
        />

        <Text style={styles.label}>Mot de passe</Text>
        <TextInput
          style={styles.input}
          placeholder="••••••••"
          placeholderTextColor={colors.textMuted}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        {error && <Text style={styles.errorText}>{error}</Text>}

        <Pressable
          style={[styles.submitButton, !canSubmit && styles.submitButtonDisabled]}
          onPress={handleLogin}
          disabled={!canSubmit}
        >
          <Text style={styles.submitButtonText}>{loading ? "Connexion..." : "Se connecter"}</Text>
        </Pressable>

                <Text
          style={styles.forgotPasswordLink}
          onPress={() => navigation.navigate("ForgotPassword")}
        >
          Mot de passe oublié ?
        </Text>

        <View style={styles.footerRow}>
          <Text style={styles.footerText}>Pas encore de compte ?</Text>
          <Text style={styles.footerLink} onPress={() => navigation.navigate("Register")}>
            {" "}
            Créer un compte
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { flex: 1, paddingHorizontal: spacing.lg, justifyContent: "center" },
  logo: { fontSize: 28, fontWeight: "700", color: colors.accent, marginBottom: spacing.xl, textAlign: "center" },
  title: { fontSize: 22, fontWeight: "700", color: colors.textPrimary, textAlign: "center" },
  subtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: "center",
    marginTop: 4,
    marginBottom: spacing.xl,
  },
  label: { fontSize: 12, color: colors.textSecondary, marginBottom: 6 },
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
  errorText: { fontSize: 12, color: colors.danger, marginBottom: spacing.md },
  submitButton: {
    backgroundColor: colors.accent,
    borderRadius: radius.sm,
    paddingVertical: 14,
    alignItems: "center",
  },
  submitButtonDisabled: { backgroundColor: colors.borderStrong },
    forgotPasswordLink: {
    fontSize: 13,
    color: colors.accent,
    textAlign: "center",
    marginTop: spacing.md,
    fontWeight: "600",
  },
  submitButtonText: { fontSize: 15, fontWeight: "600", color: colors.onAccent },
  footerRow: { flexDirection: "row", justifyContent: "center", marginTop: spacing.lg },
  footerText: { fontSize: 13, color: colors.textSecondary },
  footerLink: { fontSize: 13, color: colors.accent, fontWeight: "600" },
});
