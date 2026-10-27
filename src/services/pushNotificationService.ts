import { Platform } from "react-native";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import Constants from "expo-constants";
import api from "@/store/services/api";
import storage from "@/utils/storage";
import { navigateFromNotificationData, NotificationPayloadData } from "@/utils/notificationRouter";

const TOKEN_STORAGE_KEY = "bhansa_registered_push_token";

/**
 * 1. Configure Foreground Notification Behavior:
 * Suppress system tray notification while app is FOREGROUNDED,
 * allowing the in-app animated popup banner to display without double notification.
 */
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: false, // Suppress OS tray notification in foreground
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: false,
    shouldShowList: false,
  }),
});

/**
 * 2. Setup High-Priority Android Notification Channels
 */
export const setupNotificationChannelsAsync = async () => {
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("orders", {
      name: "Orders & Fulfillment",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#0284C7",
      sound: "default",
      enableVibrate: true,
      showBadge: true,
    });

    await Notifications.setNotificationChannelAsync("delivery", {
      name: "Delivery Tasks & Navigation",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 300, 200, 300],
      lightColor: "#10B981",
      sound: "default",
      enableVibrate: true,
      showBadge: true,
    });

    await Notifications.setNotificationChannelAsync("broadcasts", {
      name: "Announcements & Broadcasts",
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#EC4899",
      sound: "default",
      enableVibrate: true,
      showBadge: true,
    });

    await Notifications.setNotificationChannelAsync("default", {
      name: "General Updates",
      importance: Notifications.AndroidImportance.DEFAULT,
      sound: "default",
      showBadge: true,
    });
  }
};

/**
 * 3. Request OS Permissions & Register Device Push Token with Backend
 */
export const registerForPushNotificationsAsync = async (
  role: "customer" | "vendor" | "delivery_boy" | "admin" = "customer"
): Promise<string | null> => {
  try {
    // Web environment handling
    if (Platform.OS === "web") {
      if (typeof window !== "undefined" && "Notification" in window) {
        const permission = await window.Notification.requestPermission();
        console.log(`[PushService] Web notification permission: ${permission}`);
      }
      return null;
    }

    // Configure notification channels on Android
    await setupNotificationChannelsAsync();

    // Check device capabilities
    if (!Device.isDevice) {
      console.log("[PushService] Running on simulator/emulator; push notification registration simulated");
    }

    // Check existing permissions
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync({
        ios: {
          allowAlert: true,
          allowBadge: true,
          allowSound: true,
        },
      });
      finalStatus = status;
    }

    if (finalStatus !== "granted") {
      console.log("[PushService] Push notification permissions denied by user");
      return null;
    }

    // Resolve Expo EAS Project ID
    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId ||
      Constants.easConfig?.projectId ||
      process.env.EXPO_PUBLIC_EAS_PROJECT_ID ||
      "8b938f2a-7c91-4d32-9c44-bhansamart01";

    // Retrieve Expo Push Token
    const pushTokenData = await Notifications.getExpoPushTokenAsync({
      projectId,
    });

    const token = pushTokenData?.data;
    if (!token) {
      console.warn("[PushService] Failed to generate Expo push token");
      return null;
    }

    console.log(`[PushService] Acquired Expo Push Token for ${role}:`, token);

    // Register token with authenticated Backend API
    try {
      await api.post("/notifications/devices/register", {
        token,
        tokenType: "expo",
        platform: Platform.OS,
        role,
        deviceId: Device.modelId || Device.osInternalBuildId || "",
        deviceName: Device.deviceName || `${Device.brand || ""} ${Device.modelName || ""}`.trim(),
        appVersion: Constants.expoConfig?.version || "1.0.0",
      });

      await storage.setItem(TOKEN_STORAGE_KEY, token);
      console.log("[PushService] Device token registered successfully with backend");
    } catch (apiErr: any) {
      console.warn("[PushService] Backend device token registration note:", apiErr?.response?.data?.message || apiErr.message);
    }

    return token;
  } catch (err: any) {
    console.error("[PushService] Error registering for push notifications:", err.message);
    return null;
  }
};

/**
 * 4. Unregister Device Push Token on User Logout
 */
export const unregisterDevicePushTokenAsync = async (): Promise<void> => {
  try {
    const token = await storage.getItem(TOKEN_STORAGE_KEY);
    if (!token) return;

    await api.post("/notifications/devices/unregister", { token }).catch(() => {});
    await storage.removeItem(TOKEN_STORAGE_KEY);
    console.log("[PushService] Device push token unregistered successfully");
  } catch (err: any) {
    console.warn("[PushService] Error unregistering token:", err.message);
  }
};

/**
 * 5. Initialize Notification Listeners:
 * - Foreground notification reception -> triggers in-app animated banner
 * - Notification tap / response -> navigates to target screen
 * - Terminated / cold-start response check
 */
export const initPushNotificationListeners = (
  onForegroundNotification?: (notif: {
    title: string;
    body: string;
    data: NotificationPayloadData;
  }) => void
) => {
  // A. Listen for incoming notifications while the app is actively FOREGROUNDED
  const foregroundSubscription = Notifications.addNotificationReceivedListener((notification) => {
    const title = notification.request.content.title || "BhansaMart";
    const body = notification.request.content.body || "";
    const data = (notification.request.content.data as NotificationPayloadData) || {};

    console.log("[PushService] Foreground notification received:", { title, body, data });

    if (onForegroundNotification) {
      onForegroundNotification({ title, body, data });
    }
  });

  // B. Listen for user tapping a notification (from tray, lock screen, or background)
  const responseSubscription = Notifications.addNotificationResponseReceivedListener((response) => {
    const data = response.notification.request.content.data as NotificationPayloadData;
    console.log("[PushService] Notification response tapped with data:", data);
    navigateFromNotificationData(data);
  });

  // C. Check if app was cold-launched from a tapped notification
  Notifications.getLastNotificationResponseAsync().then((response) => {
    if (response) {
      const data = response.notification.request.content.data as NotificationPayloadData;
      console.log("[PushService] App cold-started from notification tap:", data);
      setTimeout(() => {
        navigateFromNotificationData(data);
      }, 800);
    }
  });

  return () => {
    foregroundSubscription.remove();
    responseSubscription.remove();
  };
};

export default {
  registerForPushNotificationsAsync,
  unregisterDevicePushTokenAsync,
  initPushNotificationListeners,
  setupNotificationChannelsAsync,
};
