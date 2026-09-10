import React, { useEffect, useState } from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "@/theme/colors";
import { HomeScreen } from "@/screens/Home/HomeScreen";
import { DeliveryRequestScreen } from "@/screens/Delivery/DeliveryRequestScreen";
import { MessagingListScreen } from "@/screens/Messaging/MessagingListScreen";
import { ProfileScreen } from "@/screens/Profile/ProfileScreen";
import { getUnreadCount } from "@/services/messaging.service";
import { RootTabParamList } from "./types";

const Tab = createBottomTabNavigator<RootTabParamList>();

const iconByRoute: Record<keyof RootTabParamList, keyof typeof Ionicons.glyphMap> = {
  Accueil: "home-outline",
  Livraison: "car-outline",
  Messagerie: "chatbubble-outline",
  Profil: "person-outline",
};

export function BottomTabNavigator() {
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function poll() {
      try {
        const result = await getUnreadCount();
        if (!cancelled) setUnreadCount(result.count);
      } catch {
        // échec silencieux — le badge reste simplement inchangé
      }
    }

    poll();
    // Rafraîchit toutes les 20 secondes — un compromis simple entre
    // réactivité et charge serveur, en l'absence de connexion temps
    // réel (WebSocket) pour l'instant.
    const interval = setInterval(poll, 20000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: { borderTopColor: colors.border },
        tabBarIcon: ({ color, size }) => (
          <Ionicons name={iconByRoute[route.name as keyof RootTabParamList]} size={size} color={color} />
        ),
      })}
    >
      <Tab.Screen name="Accueil" component={HomeScreen} />
      <Tab.Screen name="Livraison" component={DeliveryRequestScreen} />
      <Tab.Screen
        name="Messagerie"
        component={MessagingListScreen}
        options={{
          tabBarBadge: unreadCount > 0 ? (unreadCount > 9 ? "9+" : unreadCount) : undefined,
        }}
      />
      <Tab.Screen name="Profil" component={ProfileScreen} />
    </Tab.Navigator>
  );
}