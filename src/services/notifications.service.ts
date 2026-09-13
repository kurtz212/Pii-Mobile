import Constants from "expo-constants";
import { Platform } from "react-native";
import { api } from "./api";

// Les notifications push Android ne fonctionnent plus du tout dans
// Expo Go depuis le SDK 53 — il faut un vrai build compilé (EAS
// Build) pour les tester sur Android. Sur iOS, Expo Go les supporte
// encore. On détecte Expo Go pour éviter de charger le module natif
// dans ce cas précis, sinon l'app plante au démarrage sur Android.
const isExpoGo = Constants.appOwnership === "expo";

export async function registerForPushNotifications(): Promise<void> {
  if (isExpoGo && Platform.OS === "android") {
    // Notifications indisponibles dans Expo Go sur Android — rien à
    // faire, l'app continue normalement sans notifications push.
    return;
  }

  try {
    const Notifications = await import("expo-notifications");
    const Device = await import("expo-device");

    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });

    if (!Device.isDevice) {
      return;
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

    const tokenData = await Notifications.getExpoPushTokenAsync();
    await api.patch("/users/me/push-token", { pushToken: tokenData.data }, true);
  } catch {
    // échec silencieux — l'utilisateur peut continuer normalement sans notifications
  }
}