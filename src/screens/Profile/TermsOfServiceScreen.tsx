import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { colors, spacing } from "@/theme/colors";
import { RootStackParamList } from "@/navigation/types";

type Nav = NativeStackNavigationProp<RootStackParamList>;

export function TermsOfServiceScreen() {
  const navigation = useNavigation<Nav>();

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.headerRow}>
        <Ionicons name="arrow-back" size={20} color={colors.textSecondary} onPress={() => navigation.goBack()} />
        <Text style={styles.headerTitle}>Conditions d'utilisation</Text>
        <View style={{ width: 20 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.updated}>Dernière mise à jour : Septembre 2026</Text>

        <Text style={styles.sectionTitle}>1. Objet de l'application</Text>
        <Text style={styles.paragraph}>
          Pii est une plateforme de mise en relation et de coordination entre particuliers,
          boutiques, entrepreneurs et prestataires (livraison, cargo, transit). Pii facilite les
          échanges (publications, messagerie, commandes, demandes de livraison et de devis,
          coordination de tontines) mais n'est pas partie prenante des accords conclus entre
          utilisateurs.
        </Text>

        <Text style={styles.sectionTitle}>2. Aucune transaction financière sur la plateforme</Text>
        <Text style={styles.paragraph}>
          Pii ne traite, ne détient et ne transfère aucun paiement. Tous les paiements (achats,
          livraisons, cotisations de tontine, commissions d'affiliation) sont effectués
          directement entre les utilisateurs concernés, par les moyens de leur choix (mobile
          money, espèces, ou autre), en dehors de l'application. Pii n'est ni un établissement de
          paiement, ni une institution financière.
        </Text>

        <Text style={styles.sectionTitle}>3. Responsabilité entre utilisateurs</Text>
        <Text style={styles.paragraph}>
          Pii met à disposition des outils de coordination (publications, commandes, livraisons,
          devis, tontines) mais ne garantit pas la bonne exécution des accords pris entre
          utilisateurs. Chaque utilisateur reste seul responsable des engagements qu'il prend
          envers d'autres utilisateurs, notamment le paiement d'une commande, d'une livraison, ou
          d'une cotisation de tontine. Pii décline toute responsabilité en cas de non-respect de
          ces engagements par un utilisateur.
        </Text>

        <Text style={styles.sectionTitle}>4. Tontines</Text>
        <Text style={styles.paragraph}>
          La fonctionnalité tontine est un outil d'organisation (calendrier, suivi des tours,
          suivi déclaratif des cotisations) mis à disposition des utilisateurs qui choisissent de
          former un groupe. Pii ne collecte, ne détient et ne redistribue aucune somme d'argent
          dans le cadre des tontines. Le suivi des cotisations affiché dans l'application repose
          sur les déclarations des utilisateurs eux-mêmes et ne constitue pas une preuve de
          paiement réel.
        </Text>

        <Text style={styles.sectionTitle}>5. Contenu publié par les utilisateurs</Text>
        <Text style={styles.paragraph}>
          Les utilisateurs sont seuls responsables du contenu qu'ils publient (publications,
          messages, photos, descriptions). Pii se réserve le droit de retirer tout contenu
          contraire à la loi, trompeur, ou contraire à ces conditions, et de suspendre ou
          supprimer un compte en cas d'abus répété.
        </Text>

        <Text style={styles.sectionTitle}>6. Compte utilisateur</Text>
        <Text style={styles.paragraph}>
          Chaque utilisateur est responsable de la confidentialité de son mot de passe et de
          l'activité de son compte. Un compte peut être supprimé à tout moment par l'utilisateur
          depuis les Paramètres.
        </Text>

        <Text style={styles.sectionTitle}>7. Disponibilité du service</Text>
        <Text style={styles.paragraph}>
          Pii est fourni "tel quel", sans garantie de disponibilité continue. Le service peut être
          interrompu temporairement pour maintenance, mise à jour, ou pour toute autre raison
          technique.
        </Text>

        <Text style={styles.sectionTitle}>8. Modification des conditions</Text>
        <Text style={styles.paragraph}>
          Ces conditions peuvent être modifiées à tout moment. Les utilisateurs seront informés
          des changements significatifs via l'application.
        </Text>

        <Text style={styles.sectionTitle}>9. Contact</Text>
        <Text style={styles.paragraph}>
          Pour toute question concernant ces conditions, contacte-nous via les moyens indiqués
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