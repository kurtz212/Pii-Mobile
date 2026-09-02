import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { Platform } from "react-native";
import { api } from "./api";

// Affiche la notification même si l'app est ouverte au premier plan —
// sinon iOS/Android la masquent silencieusement pendant l'utilisation.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// Demande la permission, récupère le token Expo Push de cet appareil,
// et l'enregistre auprès du backend. Échoue silencieusement à chaque
// étape (pas de simulateur, permission refusée, backend injoignable)
// — ne doit jamais bloquer l'utilisation normale de l'app.
export async function registerForPushNotifications(): Promise<void> {
  if (!Device.isDevice) {
    return; // les simulateurs ne supportent pas les vraies notifications push
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== "granted") {
    return;
  }

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.MAX,
    });
  }

  try {
    const tokenData = await Notifications.getExpoPushTokenAsync();
    await api.patch("/users/me/push-token", { pushToken: tokenData.data }, true);
  } catch {
    // échec silencieux — l'utilisateur peut continuer normalement sans notifications
  }
}