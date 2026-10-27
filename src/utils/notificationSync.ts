import { useEffect, useState } from "react";
import api from "@/store/services/api";
import socketService from "@/store/services/socketService";

export type NotificationRole = "admin" | "staff" | "vendor" | "customer";

// Centralized in-memory unread counts across all active headers/components
const unreadState: Record<NotificationRole, number> = {
  admin: 0,
  staff: 0,
  vendor: 0,
  customer: 0,
};

type Listener = (count: number) => void;
const listeners: Record<NotificationRole, Set<Listener>> = {
  admin: new Set(),
  staff: new Set(),
  vendor: new Set(),
  customer: new Set(),
};

const notifyRole = (role: NotificationRole) => {
  const count = unreadState[role];
  listeners[role].forEach((fn) => {
    try {
      fn(count);
    } catch (_) {}
  });
};

/**
 * Increment unread count for a role (e.g. when socket notification arrives)
 */
export const incrementUnread = (role: NotificationRole, amount: number = 1) => {
  unreadState[role] = Math.max(0, (unreadState[role] || 0) + amount);
  notifyRole(role);
};

/**
 * Decrement unread count for a role (e.g. when user marks notification as read)
 */
export const decrementUnread = (role: NotificationRole, amount: number = 1) => {
  unreadState[role] = Math.max(0, (unreadState[role] || 0) - amount);
  notifyRole(role);
};

/**
 * Directly set the unread count for a role
 */
export const setUnread = (role: NotificationRole, count: number) => {
  unreadState[role] = Math.max(0, count);
  notifyRole(role);
};

/**
 * Fetch fresh unread count from backend API for a role
 */
export const fetchUnreadCount = async (role: NotificationRole): Promise<number> => {
  try {
    if (role === "admin" || role === "staff") {
      const res = await api.get("/admin/staff-operations/notifications", {
        params: { unreadOnly: true, limit: 1 },
      });
      const count =
        res.data?.unreadCount !== undefined
          ? res.data.unreadCount
          : res.data?.total !== undefined
          ? res.data.total
          : 0;
      setUnread(role, count);
      return count;
    } else if (role === "vendor") {
      const res = await api.get("/notifications/unread-count", {
        params: { role: "vendor" },
      });
      const count = res.data?.unreadCount || 0;
      setUnread("vendor", count);
      return count;
    } else {
      const res = await api.get("/notifications/unread-count");
      const count = res.data?.unreadCount || 0;
      setUnread("customer", count);
      return count;
    }
  } catch (err) {
    return unreadState[role];
  }
};

/**
 * React hook for any Notification Bell icon or badge:
 * - Provides live unread count
 * - Automatically registers socket listeners for real-time increments
 * - Syncs immediately when marked as read from any screen
 */
export const useUnreadNotifications = (role: NotificationRole) => {
  const [unreadCount, setCount] = useState<number>(unreadState[role]);

  useEffect(() => {
    let isMounted = true;

    // 1. Subscribe to shared state updates
    const listener: Listener = (newCount) => {
      if (isMounted) {
        setCount(newCount);
      }
    };
    listeners[role].add(listener);

    // 2. Initial fetch
    fetchUnreadCount(role).then((count) => {
      if (isMounted) setCount(count);
    });

    // 3. Connect real-time socket events for live count increments
    let socketUnsub: (() => void) | null = null;
    const socketRole = role === "staff" ? "admin" : role;

    socketService.connect(socketRole).then(() => {
      if (!isMounted) return;
      if (role === "admin" || role === "staff") {
        socketUnsub = socketService.onStaffNotification(() => {
          incrementUnread(role);
        });
      } else if (role === "vendor") {
        socketUnsub = socketService.onVendorNotification(() => {
          incrementUnread("vendor");
        });
      } else if (role === "customer") {
        socketUnsub = socketService.onCustomerNotification(() => {
          incrementUnread("customer");
        });
      }
    });

    return () => {
      isMounted = false;
      listeners[role].delete(listener);
      socketUnsub?.();
    };
  }, [role]);

  return {
    unreadCount,
    refresh: () => fetchUnreadCount(role),
    markOneRead: () => decrementUnread(role, 1),
    markAllRead: () => setUnread(role, 0),
    setCount: (count: number) => setUnread(role, count),
  };
};

export default {
  incrementUnread,
  decrementUnread,
  setUnread,
  fetchUnreadCount,
  useUnreadNotifications,
};
