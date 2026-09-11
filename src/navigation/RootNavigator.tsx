import React, { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { BottomTabNavigator } from "./BottomTabNavigator";
import { WelcomeScreen } from "../screens/Auth/WelcomeScreen";
import { LoginScreen } from "../screens/Auth/LoginScreen";
import { RegisterScreen } from "../screens/Auth/RegisterScreen";
import { AnnuaireScreen } from "../screens/Home/AnnuaireScreen";
import { MobileMoneyScreen } from "../screens/Profile/MobileMoneyScreen";
import { CreatePublicationScreen } from "@/screens/Publication/CreatePublicationScreen";
import { EspaceTypeSelectionScreen } from "../screens/Espaces/EspaceTypeSelectionScreen";
import { CreateBoutiqueScreen } from "../screens/Espaces/CreateBoutiqueScreen";
import { CreateEntrepreneurScreen } from "../screens/Espaces/CreateEntrepreneurScreen";
import { CreateAgenceLivraisonScreen } from "../screens/Espaces/CreateAgenceLivraisonScreen";
import { CreateAgenceCargoScreen } from "../screens/Espaces/CreateAgenceCargoScreen";
import { CreateTransitaireScreen } from "../screens/Espaces/CreateTransitaireScreen";
import { BoutiqueDashboardScreen } from "../screens/Espaces/BoutiqueDashboardScreen";
import { EntrepreneurDashboardScreen } from "../screens/Espaces/EntrepreneurDashboardScreen";
import { AgenceLivraisonDashboardScreen } from "../screens/Espaces/AgenceLivraisonDashboardScreen";
import { AgenceCargoDashboardScreen } from "../screens/Espaces/AgenceCargoDashboardScreen";
import { TransitaireDashboardScreen } from "../screens/Espaces/TransitaireDashboardScreen";
import { TrackingScreen } from "../screens/Tracking/TrackingScreen";
import { ConversationScreen } from "../screens/Messaging/ConversationScreen";
import { GroupListScreen } from "../screens/Groups/GroupListScreen";
import { CreateGroupScreen } from "../screens/Groups/CreateGroupScreen";
import { LiveViewerScreen } from "../screens/Live/LiveViewerScreen";
import { TontineListScreen } from "../screens/Tontine/TontineListScreen";
import { CreateTontineScreen } from "../screens/Tontine/CreateTontineScreen";
import { getToken } from "../services/api";
import { registerForPushNotifications } from "../services/notifications.service";
import { colors } from "@/theme/colors";
import { RootStackParamList } from "./types";
import { OrderScreen } from "../screens/Publication/OrderScreen";
import { GroupMessagesScreen } from "../screens/Groups/GroupMessagesScreen";
import { TontineDetailScreen } from "../screens/Tontine/TontineDetailScreen";
import { KycScreen } from "../screens/Profile/KycScreen";
import { MyOrdersScreen } from "../screens/Publication/MyOrdersScreen";
import { TeamInvitesScreen } from "../screens/Delivery/TeamInvitesScreen";
import { NewMessageScreen } from "../screens/Messaging/NewMessageScreen";
import { ManagePublicationsScreen } from "../screens/Publication/ManagePublicationsScreen";
import { EspaceProfileScreen } from "../screens/Espaces/EspaceProfileScreen";
import { RequestTypeSelectionScreen } from "../screens/Delivery/RequestTypeSelectionScreen";
import { MyQuotesScreen } from "../screens/Quotes/MyQuotesScreen";
import { ReceivedQuotesScreen } from "../screens/Quotes/ReceivedQuotesScreen";
import { RequestQuoteCargoScreen } from "../screens/Delivery/RequestQuoteCargoScreen";
import { RequestQuoteTransitaireScreen } from "../screens/Delivery/RequestQuoteTransitaireScreen";
import { QuoteRequestDetailScreen } from "../screens/Quotes/QuoteRequestDetailScreen";
import { GroupedDeliveryScreen } from "../screens/Delivery/GroupedDeliveryScreen";
import { ForgotPasswordScreen } from "../screens/Auth/ForgotPasswordScreen";
import { ResetPasswordScreen } from "../screens/Auth/ResetPasswordScreen";
import { EditEspaceScreen } from "../screens/Espaces/EditEspaceScreen";
import { LanguageSettingsScreen } from "../screens/Profile/LanguageSettingsScreen";
import { SettingsScreen } from "../screens/Profile/SettingsScreen";
import { PrivacyPolicyScreen } from "../screens/Profile/PrivacyPolicyScreen";
const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  const [isReady, setIsReady] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    (async () => {
      const token = await getToken();
      setIsAuthenticated(!!token);
      setIsReady(true);
      if (token) {
        registerForPushNotifications();
      }
    })();
  }, []);

  if (!isReady) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.background }}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{ headerShown: false }}
        initialRouteName={isAuthenticated ? "Tabs" : "Welcome"}
      >
        <Stack.Screen name="Welcome" component={WelcomeScreen} />
              <Stack.Screen name="LangueMessages" component={LanguageSettingsScreen} />
        <Stack.Screen name="Tabs" component={BottomTabNavigator} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="Annuaire" component={AnnuaireScreen} />
        <Stack.Screen name="MonAffiliation" component={MobileMoneyScreen} />
        <Stack.Screen name="MesCommandes" component={MyOrdersScreen} />
        <Stack.Screen name="InvitationsEquipe" component={TeamInvitesScreen} />
        <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
        <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
        <Stack.Screen name="LivraisonGroupee" component={GroupedDeliveryScreen} />
              <Stack.Screen name="Parametres" component={SettingsScreen} />
        <Stack.Screen name="PolitiqueConfidentialite" component={PrivacyPolicyScreen} />
              <Stack.Screen name="ModifierEspace" component={EditEspaceScreen} />
              <Stack.Screen name="QuoteRequestDetail" component={QuoteRequestDetailScreen} />
        <Stack.Screen
          name="NouveauMessage"
          component={NewMessageScreen}
          options={{ presentation: "modal" }}
        />
        <Stack.Screen name="GererPublications" component={ManagePublicationsScreen} />
        <Stack.Screen name="ProfilEspace" component={EspaceProfileScreen} />
              <Stack.Screen
          name="SelectionTypeDemande"
          component={RequestTypeSelectionScreen}
          options={{ presentation: "modal" }}
        />
              <Stack.Screen name="DemandeDevisCargo" component={RequestQuoteCargoScreen} />
        <Stack.Screen name="DemandeDevisTransitaire" component={RequestQuoteTransitaireScreen} />
        <Stack.Screen name="MesDevis" component={MyQuotesScreen} />
        <Stack.Screen name="DevisRecus" component={ReceivedQuotesScreen} />
        <Stack.Screen name="VerificationIdentite" component={KycScreen} />
        <Stack.Screen
          name="CreerPublication"
          component={CreatePublicationScreen}
          options={{ presentation: "modal" }}
        />
        <Stack.Screen
          name="SelectionnerTypeEspace"
          component={EspaceTypeSelectionScreen}
          options={{ presentation: "modal" }}
        />
        <Stack.Screen
          name="CreerBoutique"
          component={CreateBoutiqueScreen}
          options={{ presentation: "modal" }}
        />
        <Stack.Screen
          name="CreerEntrepreneur"
          component={CreateEntrepreneurScreen}
          options={{ presentation: "modal" }}
        />
        <Stack.Screen
          name="CreerAgenceLivraison"
          component={CreateAgenceLivraisonScreen}
          options={{ presentation: "modal" }}
        />
        <Stack.Screen
          name="CreerAgenceCargo"
          component={CreateAgenceCargoScreen}
          options={{ presentation: "modal" }}
        />
        <Stack.Screen
          name="CreerTransitaire"
          component={CreateTransitaireScreen}
          options={{ presentation: "modal" }}
        />
        <Stack.Screen
          name="Commander"
          component={OrderScreen}
          options={{ presentation: "modal" }}
        />
        <Stack.Screen name="BoutiqueDashboard" component={BoutiqueDashboardScreen} />
        <Stack.Screen name="EntrepreneurDashboard" component={EntrepreneurDashboardScreen} />
        <Stack.Screen name="AgenceLivraisonDashboard" component={AgenceLivraisonDashboardScreen} />
        <Stack.Screen name="AgenceCargoDashboard" component={AgenceCargoDashboardScreen} />
        <Stack.Screen name="TransitaireDashboard" component={TransitaireDashboardScreen} />
        <Stack.Screen
          name="SuiviColis"
          component={TrackingScreen}
          options={{ presentation: "modal" }}
        />

        <Stack.Screen name="Conversation" component={ConversationScreen} />
        <Stack.Screen name="Groupes" component={GroupListScreen} />
        <Stack.Screen
          name="CreerGroupe"
          component={CreateGroupScreen}
          options={{ presentation: "modal" }}
        />
        <Stack.Screen name="GroupeMessages" component={GroupMessagesScreen} />
        <Stack.Screen
          name="LiveViewer"
          component={LiveViewerScreen}
          options={{ presentation: "fullScreenModal" }}
        />
        <Stack.Screen name="Tontines" component={TontineListScreen} />
        <Stack.Screen
          name="CreerTontine"
          component={CreateTontineScreen}
          options={{ presentation: "modal" }}
        />
        <Stack.Screen name="TontineDetail" component={TontineDetailScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}