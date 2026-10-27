import "@/utils/expoPolyfills";
import { Platform } from "react-native";
import * as Device from "expo-device";
import Constants from "expo-constants";
import api from "@/store/services/api";
import storage from "@/utils/storage";
import { navigateFromNotificationData, NotificationPayloadData } from "@/utils/notificationRouter";

const TOKEN_STORAGE_KEY = "bhansa_registered_push_token";

/**
 * Lazy / resilient resolver for expo-notifications.
 * Ensures the app never crashes if native notification modules are missing (e.g. Expo Go).
 */
let notificationsModuleCache: typeof import("expo-notifications") | null = null;
export const getNotificationsModule = (): typeof import("expo-notifications") | null => {
  if (notificationsModuleCache) return notificationsModuleCache;
  try {
    notificationsModuleCache = require("expo-notifications");
    return notificationsModuleCache;
  } catch (err: any) {
    console.warn(
      "[PushService] Push notifications module unavailable in this environment:",
      err?.message || err
    );
    return null;
  }
};

/**
 * 1. Configure Foreground Notification Behavior:
 * Suppress system tray notification while app is actively FOREGROUNDED,
 * allowing the in-app animated banner to display without double notification.
 */
const configureForegroundHandler = () => {
  const Notifications = getNotificationsModule();
  if (Notifications?.setNotificationHandler) {
    try {
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: false, // Suppress OS tray notification in foreground
          shouldPlaySound: false,
          shouldSetBadge: false,
          shouldShowBanner: false,
          shouldShowList: false,
        }),
      });
    } catch (e: any) {
      console.warn("[PushService] setNotificationHandler skipped:", e?.message);
    }
  }
};

configureForegroundHandler();

/**
 * 2. Setup High-Priority Android Notification Channels
 */
export const setupNotificationChannelsAsync = async () => {
  if (Platform.OS !== "android") return;
  const Notifications = getNotificationsModule();
  if (!Notifications?.setNotificationChannelAsync) return;

  try {
    await Notifications.setNotificationChannelAsync("orders", {
      name: "Orders & Fulfillment",
      importance: Notifications.AndroidImportance?.MAX ?? 5,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#0284C7",
      sound: "default",
      enableVibrate: true,
      showBadge: true,
    });

    await Notifications.setNotificationChannelAsync("delivery", {
      name: "Delivery Tasks & Navigation",
      importance: Notifications.AndroidImportance?.MAX ?? 5,
      vibrationPattern: [0, 300, 200, 300],
      lightColor: "#10B981",
      sound: "default",
      enableVibrate: true,
      showBadge: true,
    });

    await Notifications.setNotificationChannelAsync("broadcasts", {
      name: "Announcements & Broadcasts",
      importance: Notifications.AndroidImportance?.HIGH ?? 4,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#EC4899",
      sound: "default",
      enableVibrate: true,
      showBadge: true,
    });

    await Notifications.setNotificationChannelAsync("default", {
      name: "General Updates",
      importance: Notifications.AndroidImportance?.DEFAULT ?? 3,
      sound: "default",
      showBadge: true,
    });
  } catch (err: any) {
    console.warn("[PushService] Notification channels setup note:", err?.message);
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

    const Notifications = getNotificationsModule();
    if (!Notifications) {
      console.log("[PushService] Native push module not active in this runtime (e.g. Expo Go limitation)");
      return null;
    }

    // Configure notification channels on Android
    await setupNotificationChannelsAsync();

    // Check device capabilities
    if (!Device.isDevice) {
      console.log("[PushService] Running on simulator/emulator; push notification registration simulated");
    }

    // Check existing permissions
    let finalStatus = "undetermined";
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      finalStatus = existingStatus;

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
    } catch (permErr: any) {
      console.warn("[PushService] Permissions check skipped:", permErr?.message);
    }

    if (finalStatus !== "granted") {
      console.log("[PushService] Push notification permissions not granted by user");
      return null;
    }

    // Resolve Expo EAS Project ID
    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId ||
      Constants.easConfig?.projectId ||
      process.env.EXPO_PUBLIC_EAS_PROJECT_ID ||
      "8b938f2a-7c91-4d32-9c44-bhansamart01";

    // Retrieve Expo Push Token
    let token: string | null = null;
    try {
      const pushTokenData = await Notifications.getExpoPushTokenAsync({
        projectId,
      });
      token = pushTokenData?.data || null;
    } catch (tokenErr: any) {
      console.warn(
        "[PushService] Note: Expo Push token retrieval requires a development build (run:android / eas build) in Expo SDK 52+.",
        tokenErr?.message
      );
      return null;
    }

    if (!token) {
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
    console.warn("[PushService] Push notification registration ended gracefully:", err.message);
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
  const Notifications = getNotificationsModule();
  if (!Notifications || !Notifications.addNotificationReceivedListener) {
    return () => {};
  }

  let foregroundSubscription: any = null;
  let responseSubscription: any = null;

  try {
    // A. Listen for incoming notifications while the app is actively FOREGROUNDED
    foregroundSubscription = Notifications.addNotificationReceivedListener((notification) => {
      const title = notification.request.content.title || "BhansaMart";
      const body = notification.request.content.body || "";
      const data = (notification.request.content.data as NotificationPayloadData) || {};

      console.log("[PushService] Foreground notification received:", { title, body, data });

      if (onForegroundNotification) {
        onForegroundNotification({ title, body, data });
      }
    });

    // B. Listen for user tapping a notification (from tray, lock screen, or background)
    if (Notifications.addNotificationResponseReceivedListener) {
      responseSubscription = Notifications.addNotificationResponseReceivedListener((response) => {
        const data = response.notification.request.content.data as NotificationPayloadData;
        console.log("[PushService] Notification response tapped with data:", data);
        navigateFromNotificationData(data);
      });
    }

    // C. Check if app was cold-launched from a tapped notification
    if (Notifications.getLastNotificationResponseAsync) {
      Notifications.getLastNotificationResponseAsync().then((response) => {
        if (response) {
          const data = response.notification.request.content.data as NotificationPayloadData;
          console.log("[PushService] App cold-started from notification tap:", data);
          setTimeout(() => {
            navigateFromNotificationData(data);
          }, 800);
        }
      }).catch(() => {});
    }
  } catch (err: any) {
    console.warn("[PushService] Could not initialize notification listeners:", err?.message);
  }

  return () => {
    try {
      foregroundSubscription?.remove?.();
      responseSubscription?.remove?.();
    } catch (_) {}
  };
};

export default {
  registerForPushNotificationsAsync,
  unregisterDevicePushTokenAsync,
  initPushNotificationListeners,
  setupNotificationChannelsAsync,
};
