import React, { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { colors, radius, spacing } from "@/theme/colors";
import { RootStackParamList } from "@/navigation/types";
import { register, login } from "../../services/auth.service";
import { ApiRequestError } from "../../services/api";

type Nav = NativeStackNavigationProp<RootStackParamList>;

export function RegisterScreen() {
  const navigation = useNavigation<Nav>();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const passwordsMatch = password.length > 0 && password === confirmPassword;
  const canSubmit =
    name.trim().length > 0 && phone.trim().length > 0 && passwordsMatch && !loading;

  async function handleRegister() {
    setError(null);
    setLoading(true);
    try {
      await register(name.trim(), phone.trim(), password, email.trim() || undefined);
      await login(phone.trim(), password);
      navigation.reset({ index: 0, routes: [{ name: "Tabs" }] });
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
      <View style={styles.headerRow}>
        <Ionicons
          name="arrow-back"
          size={20}
          color={colors.textSecondary}
          onPress={() => navigation.goBack()}
        />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Crée ton compte</Text>
        <Text style={styles.subtitle}>
          Un seul compte pour acheter, vendre, livrer ou proposer tes services sur Pii.
        </Text>

        <Text style={styles.label}>Nom complet</Text>
        <TextInput
          style={styles.input}
          placeholder="Ex. Aïcha Traoré"
          placeholderTextColor={colors.textMuted}
          value={name}
          onChangeText={setName}
        />

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

        <Text style={styles.label}>Email (optionnel)</Text>
        <TextInput
          style={styles.input}
          placeholder="Ex. aicha@exemple.com"
          placeholderTextColor={colors.textMuted}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
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

        <Text style={styles.label}>Confirmer le mot de passe</Text>
        <TextInput
          style={styles.input}
          placeholder="••••••••"
          placeholderTextColor={colors.textMuted}
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
        />
        {confirmPassword.length > 0 && !passwordsMatch && (
          <Text style={styles.errorText}>Les mots de passe ne correspondent pas.</Text>
        )}

        {error && <Text style={styles.errorText}>{error}</Text>}

        <Text style={styles.termsText}>
          En créant un compte, tu acceptes les conditions d'utilisation et la politique de
          confidentialité de Pii.
        </Text>

        <Pressable
          style={[styles.submitButton, !canSubmit && styles.submitButtonDisabled]}
          onPress={handleRegister}
          disabled={!canSubmit}
        >
          <Text style={styles.submitButtonText}>{loading ? "Création..." : "S'inscrire"}</Text>
        </Pressable>

        <View style={styles.footerRow}>
          <Text style={styles.footerText}>Déjà un compte ?</Text>
          <Text style={styles.footerLink} onPress={() => navigation.navigate("Login")}>
            {" "}
            Se connecter
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  headerRow: { paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
  content: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xl },
  title: { fontSize: 22, fontWeight: "700", color: colors.textPrimary },
  subtitle: { fontSize: 13, color: colors.textSecondary, marginTop: 4, marginBottom: spacing.xl, lineHeight: 19 },
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
  errorText: { fontSize: 11, color: colors.danger, marginTop: -8, marginBottom: spacing.md },
  termsText: {
    fontSize: 11,
    color: colors.textMuted,
    lineHeight: 16,
    marginBottom: spacing.lg,
  },
  submitButton: {
    backgroundColor: colors.accent,
    borderRadius: radius.sm,
    paddingVertical: 14,
    alignItems: "center",
  },
  submitButtonDisabled: { backgroundColor: colors.borderStrong },
  submitButtonText: { fontSize: 15, fontWeight: "600", color: colors.onAccent },
  footerRow: { flexDirection: "row", justifyContent: "center", marginTop: spacing.lg },
  footerText: { fontSize: 13, color: colors.textSecondary },
  footerLink: { fontSize: 13, color: colors.accent, fontWeight: "600" },
});