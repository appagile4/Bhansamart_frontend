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

    // 1. Direct deep link override if provided
    if (data.deepLink && typeof data.deepLink === "string") {
      router.navigate(data.deepLink as any);
      return;
    }

    const screenTarget = String(data.screen || "").toLowerCase();
    const notifType = String(data.type || "").toUpperCase();

    // 2. Delivery partner target
    if (
      data.targetRole === "delivery_boy" ||
      screenTarget.includes("delivery") ||
      notifType.includes("DELIVERY")
    ) {
      router.navigate("/DeliveryMain" as any);
      return;
    }

    // 3. Order related notifications (Customer)
    if (data.orderId || notifType.includes("ORDER") || screenTarget.includes("order")) {
      router.navigate("/Screens/Profile/your-orders" as any);
      return;
    }

    // 4. Support tickets (Customer)
    if (data.ticketId || notifType.includes("TICKET")) {
      router.navigate("/Screens/Profile/support" as any);
      return;
    }

    // 5. Refunds & Claims (Customer)
    if (data.refundId || notifType.includes("REFUND")) {
      router.navigate("/Screens/Profile/your-orders" as any);
      return;
    }

    // 6. Announcements & Broadcasts or General Fallback
    router.navigate("/Screens/Profile/notifications" as any);
  } catch (err: any) {
    console.warn("[NotificationRouter] Navigation failed gracefully:", err.message);
  }
};
