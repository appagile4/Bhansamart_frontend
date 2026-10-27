import { router } from "expo-router";

export interface NotificationPayloadData {
  orderId?: string;
  orderNumber?: string;
  vendorId?: string;
  ticketId?: string;
  refundId?: string;
  broadcastId?: string;
  screen?: string;
  deepLink?: string;
  type?: string;
  targetRole?: string;
  [key: string]: any;
}

/**
 * Safely routes user to the destination screen based on notification payload metadata
 */
export const navigateFromNotificationData = (data?: NotificationPayloadData | null) => {
  try {
    if (!data) {
      console.log("[NotificationRouter] No payload data provided; staying on current screen");
      return;
    }

    console.log("[NotificationRouter] Navigating from payload data:", data);

    // 1. Direct deep link override if provided (e.g. /(tabs)/home or /customerMain/orders)
    if (data.deepLink && typeof data.deepLink === "string") {
      router.navigate(data.deepLink as any);
      return;
    }

    const screenTarget = String(data.screen || "").toLowerCase();
    const notifType = String(data.type || "").toUpperCase();

    // 2. Order related notifications
    if (data.orderId || notifType.includes("ORDER") || screenTarget.includes("order")) {
      // If vendor app target
      if (data.targetRole === "vendor" || screenTarget.includes("vendor")) {
        if (data.orderId) {
          router.navigate({
            pathname: "/Screens/vendorScreens/OrderDetailsScreen" as any,
            params: { orderId: data.orderId },
          });
        } else {
          router.navigate("/VendorMain/orders" as any);
        }
        return;
      }

      // If delivery partner target
      if (data.targetRole === "delivery_boy" || screenTarget.includes("delivery")) {
        router.navigate("/DeliveryMain/orders" as any);
        return;
      }

      // Default Customer Order Navigation
      router.navigate("/Screens/Profile/your-orders" as any);
      return;
    }

    // 3. Delivery partner tasks
    if (notifType.includes("DELIVERY") || screenTarget.includes("delivery")) {
      router.navigate("/DeliveryMain/orders" as any);
      return;
    }

    // 4. Vendor Broadcast / Announcement
    if (notifType.includes("BROADCAST") || notifType.includes("ANNOUNCEMENT")) {
      if (data.targetRole === "vendor") {
        router.navigate("/Screens/vendorScreens/notifications" as any);
      } else if (data.targetRole === "admin" || data.targetRole === "staff") {
        router.navigate("/Screens/staffadminScreens/BroadcastNotificationScreen" as any);
      } else {
        router.navigate("/Screens/Profile/notifications" as any);
      }
      return;
    }

    // 5. Support tickets
    if (data.ticketId || notifType.includes("TICKET")) {
      if (data.targetRole === "vendor") {
        router.navigate("/Screens/vendorScreens/tickets" as any);
      } else if (data.targetRole === "admin") {
        router.navigate("/Screens/adminScreens/support-tickets" as any);
      } else {
        router.navigate("/Screens/Profile/support" as any);
      }
      return;
    }

    // 6. Refunds & Claims
    if (data.refundId || notifType.includes("REFUND")) {
      if (data.targetRole === "admin") {
        router.navigate("/Screens/adminScreens/refunds-workflow" as any);
      } else {
        router.navigate("/Screens/Profile/your-orders" as any);
      }
      return;
    }

    // 7. General Fallback based on Role
    if (data.targetRole === "vendor") {
      router.navigate("/VendorMain" as any);
    } else if (data.targetRole === "delivery_boy") {
      router.navigate("/DeliveryMain" as any);
    } else if (data.targetRole === "admin") {
      router.navigate("/AdminMain" as any);
    } else {
      router.navigate("/Screens/Profile/notifications" as any);
    }
  } catch (err: any) {
    console.warn("[NotificationRouter] Navigation failed gracefully:", err.message);
  }
};
