import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { colors, spacing } from "@/theme/colors";
import { RootStackParamList } from "@/navigation/types";

type Nav = NativeStackNavigationProp<RootStackParamList>;

export function PrivacyPolicyScreen() {
  const navigation = useNavigation<Nav>();

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.headerRow}>
        <Ionicons name="arrow-back" size={20} color={colors.textSecondary} onPress={() => navigation.goBack()} />
        <Text style={styles.headerTitle}>Politique de confidentialité</Text>
        <View style={{ width: 20 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.updated}>Dernière mise à jour : Septembre 2026</Text>

        <Text style={styles.sectionTitle}>1. Données que nous collectons</Text>
        <Text style={styles.paragraph}>
          Pii collecte les informations que tu fournis directement : nom, numéro de téléphone,
          email (optionnel), photo de profil, ainsi que le contenu que tu publies (publications,
          messages, commandes, avis).
        </Text>

        <Text style={styles.sectionTitle}>2. Localisation</Text>
        <Text style={styles.paragraph}>
          Ta position n'est utilisée que lorsque tu choisis explicitement de la partager (par
          exemple dans un message, ou pour une adresse de livraison). Pii ne suit pas ta position
          en arrière-plan.
        </Text>

        <Text style={styles.sectionTitle}>3. Contacts</Text>
        <Text style={styles.paragraph}>
          L'accès à tes contacts n'est demandé que lorsque tu choisis explicitement de partager un
          contact dans une conversation. Pii ne stocke ni ne consulte ta liste de contacts en
          dehors de cette action.
        </Text>

        <Text style={styles.sectionTitle}>4. Partage avec des tiers</Text>
        <Text style={styles.paragraph}>
          Tes données ne sont jamais vendues. Certaines informations (nom, téléphone) sont
          partagées avec l'autre partie d'une transaction (livreur, agence, client) uniquement
          lorsque nécessaire à la réalisation de cette transaction.
        </Text>

        <Text style={styles.sectionTitle}>5. Conservation des données</Text>
        <Text style={styles.paragraph}>
          Tes données sont conservées tant que ton compte est actif. Tu peux demander la
          suppression complète de ton compte et de tes données à tout moment depuis les
          Paramètres.
        </Text>

        <Text style={styles.sectionTitle}>6. Sécurité</Text>
        <Text style={styles.paragraph}>
          Nous mettons en œuvre des mesures raisonnables pour protéger tes données, notamment le
          chiffrement des mots de passe et des connexions sécurisées.
        </Text>

        <Text style={styles.sectionTitle}>7. Tes droits</Text>
        <Text style={styles.paragraph}>
          Tu peux à tout moment consulter, modifier ou supprimer tes informations personnelles
          depuis ton profil et les paramètres de l'application.
        </Text>

        <Text style={styles.sectionTitle}>8. Contact</Text>
        <Text style={styles.paragraph}>
          Pour toute question concernant cette politique, contacte-nous via les moyens indiqués
          dans l'application.
        </Text>
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
  headerTitle: { fontSize: 15, fontWeight: "600", color: colors.textPrimary, flex: 1, textAlign: "center" },
  content: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xl },
  updated: { fontSize: 11, color: colors.textMuted, marginBottom: spacing.lg },
  sectionTitle: { fontSize: 14, fontWeight: "700", color: colors.textPrimary, marginTop: spacing.lg, marginBottom: spacing.sm },
  paragraph: { fontSize: 13, color: colors.textSecondary, lineHeight: 20 },
});