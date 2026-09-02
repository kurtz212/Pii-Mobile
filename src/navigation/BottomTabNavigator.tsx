import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "@/theme/colors";
import { HomeScreen } from "@/screens/Home/HomeScreen";
import { DeliveryRequestScreen } from "@/screens/Delivery/DeliveryRequestScreen";
import { MessagingListScreen } from "@/screens/Messaging/MessagingListScreen";
import { ProfileScreen } from "@/screens/Profile/ProfileScreen";
import { RootTabParamList } from "./types";

const Tab = createBottomTabNavigator<RootTabParamList>();

const iconByRoute: Record<keyof RootTabParamList, keyof typeof Ionicons.glyphMap> = {
  Accueil: "home-outline",
  Livraison: "car-outline",
  Messagerie: "chatbubble-outline",
  Profil: "person-outline",
};

export function BottomTabNavigator() {
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
      <Tab.Screen name="Messagerie" component={MessagingListScreen} />
      <Tab.Screen name="Profil" component={ProfileScreen} />
    </Tab.Navigator>
  );
}
