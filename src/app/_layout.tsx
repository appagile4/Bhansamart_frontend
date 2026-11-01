import { CartProvider } from "@/context/cart-context";
import store from "@/store";
import { useAppDispatch } from "@/store/hooks";
import { initializeAuth } from "@/store/slices/authSlice";
import { initializeVendorAuth } from "@/store/slices/vendorAuthSlice";
import {
  initializeDeliveryAuth,
  setIncomingOffer,
  clearIncomingOffer,
  fetchActiveAssignment,
} from "@/store/slices/deliverySlice";
import {
  fetchWishlist,
  loadWishlistFromStorage,
} from "@/store/slices/wishlistSlice";
import { Stack } from "expo-router";
import { useEffect, useState } from "react";
import { LogBox } from "react-native";
import { Provider } from "react-redux";
import InAppNotificationBanner, { InAppBannerMessage } from "@/components/common/InAppNotificationBanner";
import {
  initPushNotificationListeners,
  registerForPushNotificationsAsync,
} from "@/services/pushNotificationService";
import socketService from "@/store/services/socketService";
import { incrementUnread } from "@/utils/notificationSync";

// Suppress internal React Navigation / Expo Router development-only reconciliation warnings
LogBox.ignoreLogs([
  "The action 'ROUTE_NAMES_CHANGED'",
]);

function AppContent() {
  const dispatch = useAppDispatch();
  const [bannerMessage, setBannerMessage] = useState<InAppBannerMessage | null>(null);

  useEffect(() => {
    // 1. Attempt automatic session restoration on boot
    dispatch(initializeAuth());
    dispatch(initializeVendorAuth());
    dispatch(initializeDeliveryAuth());
    dispatch(loadWishlistFromStorage());
    dispatch(fetchWishlist());

    // 2. Register for Mobile Push Notifications & create Android channels
    registerForPushNotificationsAsync("customer");

    // 3. Initialize Notification Listeners (handles foreground popup + background tap + cold-start)
    const cleanupPushListeners = initPushNotificationListeners((foregroundNotif) => {
      const data = foregroundNotif.data as any;
      const targetRole = data?.targetRole || data?.role || "customer";
      if (targetRole === "vendor") incrementUnread("vendor");
      else if (targetRole === "admin" || targetRole === "staff") incrementUnread("admin");
      else if (targetRole === "delivery_boy") {
        incrementUnread("delivery");
        dispatch(fetchActiveAssignment());
      } else {
        incrementUnread("customer");
      }

      if (
        targetRole === "delivery_boy" ||
        data?.screen === "DeliveryMain" ||
        data?.type === "delivery_request_received"
      ) {
        dispatch(fetchActiveAssignment());
      }

      setBannerMessage({
        id: `push_${Date.now()}`,
        title: foregroundNotif.title,
        body: foregroundNotif.body,
        data: foregroundNotif.data,
      });
    });

    // 4. Socket foreground notification listener (vendor & store notifications)
    const unsubVendor = socketService.onVendorNotification((notif) => {
      incrementUnread("vendor");
      setBannerMessage({
        id: `vendor_${Date.now()}`,
        title: notif.title || "Vendor Notification",
        body: notif.message || "",
        data: { ...notif.data, targetRole: "vendor", type: "VENDOR_NOTIFICATION" },
      });
    });

    // 5. Global delivery partner socket listeners
    const unsubDeliveryOffer = socketService.onDeliveryOrderRequest((offer) => {
      console.log("[RootLayout] Delivery order request received:", offer?.orderNumber);
      dispatch(setIncomingOffer(offer));
    });

    const unsubDeliveryExpired = socketService.onDeliveryOrderExpired(() => {
      console.log("[RootLayout] Delivery order expired");
      dispatch(clearIncomingOffer());
    });

    const unsubDeliveryNotif = socketService.onDeliveryNotification((notif) => {
      incrementUnread("delivery");
      if (notif?.type === "delivery_request_received") {
        dispatch(fetchActiveAssignment());
      }
    });

    return () => {
      cleanupPushListeners();
      unsubVendor();
      unsubDeliveryOffer();
      unsubDeliveryExpired();
      unsubDeliveryNotif();
    };
  }, [dispatch]);

  return (
    <CartProvider>
      <InAppNotificationBanner
        message={bannerMessage}
        onDismiss={() => setBannerMessage(null)}
        durationMs={3000}
      />
      <Stack
        screenOptions={{
          headerShown: false,
          gestureEnabled: false,
        }}
      >
        <Stack.Screen name="index" options={{ gestureEnabled: false }} />
        <Stack.Screen name="(auth)" options={{ gestureEnabled: false }} />
        <Stack.Screen name="customerMain" options={{ gestureEnabled: false }} />
        <Stack.Screen name="StaffAdminMain" options={{ gestureEnabled: false }} />
        <Stack.Screen name="AdminMain" options={{ gestureEnabled: false }} />
        <Stack.Screen name="VendorMain" options={{ gestureEnabled: false }} />
        <Stack.Screen name="DeliveryMain" options={{ gestureEnabled: false }} />
      </Stack>
    </CartProvider>
  );
}

export default function RootLayout() {
  return (
    <Provider store={store}>
      <AppContent />
    </Provider>
  );
}
