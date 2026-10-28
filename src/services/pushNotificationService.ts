import { Platform } from "react-native";
import * as Device from "expo-device";
import Constants from "expo-constants";
import { isRunningInExpoGo } from "expo";
import api from "@/store/services/api";
import storage from "@/utils/storage";
import { navigateFromNotificationData, NotificationPayloadData } from "@/utils/notificationRouter";

const TOKEN_STORAGE_KEY = "bhansa_registered_push_token";

export const NOTIFICATION_CHANNELS = {
  ORDERS: "bhansamart_orders_v1",
  DELIVERY: "bhansamart_delivery_v1",
  BROADCASTS: "bhansamart_broadcasts_v1",
  ALERTS: "bhansamart_alerts_v1",
  DEFAULT: "bhansamart_default_v1",
} as const;

export type NotificationChannelId =
  | "bhansamart_orders_v1"
  | "bhansamart_delivery_v1"
  | "bhansamart_broadcasts_v1"
  | "bhansamart_alerts_v1"
  | "bhansamart_default_v1"
  | "orders"
  | "delivery"
  | "broadcasts"
  | "alerts"
  | "default";

/**
 * Lazy / resilient resolver for expo-notifications.
 * In Expo Go, native push notification modules (e.g. ExpoTopicSubscriptionModule) are not included.
 * In development builds (npx expo run:android) and production standalone APKs, native push notifications are fully supported.
 */
let notificationsModuleCache: typeof import("expo-notifications") | null = null;
export const getNotificationsModule = (): typeof import("expo-notifications") | null => {
  if (Platform.OS === "web") return null;
  if (isRunningInExpoGo()) {
    return null;
  }
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
 * Displays Heads-Up pop-up banner, plays sound, updates badge,
 * and maintains the notification in the device's system tray & lockscreen.
 */
const configureForegroundHandler = () => {
  const Notifications = getNotificationsModule();
  if (Notifications?.setNotificationHandler) {
    try {
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowBanner: true,  // Drop-down heads-up banner on top of screen
          shouldShowList: true,    // Add to notification center / status bar tray
          shouldPlaySound: true,   // Play audible chime (REQUIRED by Android for heads-up alert)
          shouldSetBadge: true,    // Increment app badge number
          priority: Notifications.AndroidNotificationPriority?.MAX ?? "max",
        }),
      });
      console.log("[PushService] Foreground notification handler initialized with MAX priority and banner");
    } catch (e: any) {
      console.warn("[PushService] setNotificationHandler skipped:", e?.message);
    }
  }
};

configureForegroundHandler();

/**
 * 2. Setup High-Priority Android Notification Channels (Android 8.0+ / Android 13+)
 * Configures MAX importance (7 in Expo enum), vibration, light, and PUBLIC lockscreen visibility
 * so notifications drop down as Heads-Up pop-up banners and are readable on lock screens.
 */
export const setupNotificationChannelsAsync = async () => {
  if (Platform.OS !== "android") return;
  const Notifications = getNotificationsModule();
  if (!Notifications?.setNotificationChannelAsync) return;

  try {
    // Delete legacy channels so Android OS doesn't retain old low/default importance
    const legacyChannels = ["orders", "delivery", "broadcasts", "alerts", "default"];
    if (Notifications.deleteNotificationChannelAsync) {
      for (const legacyId of legacyChannels) {
        await Notifications.deleteNotificationChannelAsync(legacyId).catch(() => {});
      }
    }

    // In expo-notifications enum:
    // AndroidImportance: UNKNOWN=0, UNSPECIFIED=1, NONE=2, MIN=3, LOW=4, DEFAULT=5, HIGH=6, MAX=7
    const maxImportance = Notifications.AndroidImportance?.MAX ?? 7;
    const publicVisibility = Notifications.AndroidNotificationVisibility?.PUBLIC ?? 1;

    const audioAttributes = {
      usage: Notifications.AndroidAudioUsage?.NOTIFICATION ?? 5,
      contentType: Notifications.AndroidAudioContentType?.SONIFICATION ?? 4,
    };

    // A. Orders Channel (Heads-up pop-up, MAX priority, audible & vibrating)
    await Notifications.setNotificationChannelAsync(NOTIFICATION_CHANNELS.ORDERS, {
      name: "Orders & Fulfillment",
      description: "Live alerts for new customer orders, status changes, and fulfillment updates",
      importance: maxImportance,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#0284C7",
      enableVibrate: true,
      enableLights: true,
      showBadge: true,
      lockscreenVisibility: publicVisibility,
      audioAttributes,
    });

    // B. Delivery Channel (Heads-up pop-up, MAX priority for rider dispatches)
    await Notifications.setNotificationChannelAsync(NOTIFICATION_CHANNELS.DELIVERY, {
      name: "Delivery Tasks & Navigation",
      description: "Real-time task offers, navigation, and customer delivery coordination",
      importance: maxImportance,
      vibrationPattern: [0, 300, 200, 300],
      lightColor: "#10B981",
      enableVibrate: true,
      enableLights: true,
      showBadge: true,
      lockscreenVisibility: publicVisibility,
      audioAttributes,
    });

    // C. Announcements & Broadcasts (Heads-up pop-up, MAX priority)
    await Notifications.setNotificationChannelAsync(NOTIFICATION_CHANNELS.BROADCASTS, {
      name: "Announcements & Broadcasts",
      description: "Store broadcasts, promotions, offers, and general announcements",
      importance: maxImportance,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#EC4899",
      enableVibrate: true,
      enableLights: true,
      showBadge: true,
      lockscreenVisibility: publicVisibility,
      audioAttributes,
    });

    // D. Staff & Security Alerts (Heads-up pop-up, MAX priority)
    await Notifications.setNotificationChannelAsync(NOTIFICATION_CHANNELS.ALERTS, {
      name: "Staff & System Alerts",
      description: "High-priority administrative notices and operational alerts",
      importance: maxImportance,
      vibrationPattern: [0, 350, 250, 350],
      lightColor: "#EF4444",
      enableVibrate: true,
      enableLights: true,
      showBadge: true,
      lockscreenVisibility: publicVisibility,
      audioAttributes,
    });

    // E. General Updates (Heads-up pop-up, MAX priority)
    await Notifications.setNotificationChannelAsync(NOTIFICATION_CHANNELS.DEFAULT, {
      name: "General Updates",
      description: "Standard account notifications and updates",
      importance: maxImportance,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#6366F1",
      enableVibrate: true,
      enableLights: true,
      showBadge: true,
      lockscreenVisibility: publicVisibility,
      audioAttributes,
    });

    // Also re-create legacy channel IDs pointing to maxImportance for backwards-compatibility
    for (const legacyId of legacyChannels) {
      await Notifications.setNotificationChannelAsync(legacyId, {
        name: `BhansaMart ${legacyId}`,
        importance: maxImportance,
        enableVibrate: true,
        showBadge: true,
        lockscreenVisibility: publicVisibility,
        audioAttributes,
      }).catch(() => {});
    }

    console.log("[PushService] Notification channels initialized with MAX importance for heads-up alerts");
  } catch (err: any) {
    console.warn("[PushService] Notification channels setup note:", err?.message);
  }
};

// Initialize channels on boot
setupNotificationChannelsAsync().catch(() => {});

/**
 * Triggers an immediate local Heads-Up Notification on device
 * (Useful for testing heads-up banner & tray display)
 */
export const presentLocalHeadsUpNotificationAsync = async ({
  title,
  body,
  data = {},
  channelId = NOTIFICATION_CHANNELS.ORDERS,
}: {
  title: string;
  body: string;
  data?: NotificationPayloadData;
  channelId?: string;
}) => {
  const Notifications = getNotificationsModule();
  if (!Notifications?.scheduleNotificationAsync) return null;
  try {
    return await Notifications.scheduleNotificationAsync({
      content: {
        title: title || "BhansaMart",
        body: body || "",
        data: data as Record<string, unknown>,
        priority: Notifications.AndroidNotificationPriority?.MAX ?? "max",
        sound: true,
      },
      trigger: {
        channelId,
      } as any, // Triggers immediately on the specified high-priority channel
    });
  } catch (err: any) {
    console.warn("[PushService] Local heads-up notification trigger note:", err?.message);
    return null;
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
      if (isRunningInExpoGo()) {
        console.log("[PushService] Runtime: Expo Go detected. Remote FCM push tokens are unavailable in Expo Go from SDK 53+. Please use an Expo Development Build (npx expo run:android / eas build) to receive remote push notifications.");
      } else {
        console.warn("[PushService] Notifications native module unavailable in current environment.");
      }
      return null;
    }

    console.log(`[PushService] Runtime: ${__DEV__ ? "Development Build (expo-dev-client)" : "Production Build"}. Initializing push notifications for ${role}.`);

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
      "847bae5a-0ac2-4562-b0ad-da3d3b49babc";

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
  presentLocalHeadsUpNotificationAsync,
};
