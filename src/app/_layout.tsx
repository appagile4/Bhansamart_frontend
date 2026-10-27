import "@/utils/expoPolyfills";
import { CartProvider } from "@/context/cart-context";
import store from "@/store";
import { useAppDispatch } from "@/store/hooks";
import { initializeAuth } from "@/store/slices/authSlice";
import { initializeVendorAuth } from "@/store/slices/vendorAuthSlice";
import {
  fetchWishlist,
  loadWishlistFromStorage,
} from "@/store/slices/wishlistSlice";
import { Stack } from "expo-router";
import { useEffect, useState } from "react";
import { Provider } from "react-redux";
import InAppNotificationBanner, { InAppBannerMessage } from "@/components/common/InAppNotificationBanner";
import {
  initPushNotificationListeners,
  registerForPushNotificationsAsync,
} from "@/services/pushNotificationService";
import socketService from "@/store/services/socketService";

function AppContent() {
  const dispatch = useAppDispatch();
  const [bannerMessage, setBannerMessage] = useState<InAppBannerMessage | null>(null);

  useEffect(() => {
    // 1. Attempt automatic session restoration on boot
    dispatch(initializeAuth());
    dispatch(initializeVendorAuth());
    dispatch(loadWishlistFromStorage());
    dispatch(fetchWishlist());

    // 2. Register for Mobile Push Notifications & create Android channels
    registerForPushNotificationsAsync("customer");

    // 3. Initialize Notification Listeners (handles foreground popup + background tap + cold-start)
    const cleanupPushListeners = initPushNotificationListeners((foregroundNotif) => {
      setBannerMessage({
        id: `push_${Date.now()}`,
        title: foregroundNotif.title,
        body: foregroundNotif.body,
        data: foregroundNotif.data,
      });
    });

    // 4. Socket foreground notification listener (vendor & store notifications)
    const unsubVendor = socketService.onVendorNotification((notif) => {
      setBannerMessage({
        id: `vendor_${Date.now()}`,
        title: notif.title || "Vendor Notification",
        body: notif.message || "",
        data: { ...notif.data, targetRole: "vendor", type: "VENDOR_NOTIFICATION" },
      });
    });

    return () => {
      cleanupPushListeners();
      unsubVendor();
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
