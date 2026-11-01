import storage from "@/utils/storage";
import { io, Socket } from "socket.io-client";
import { API_BASE_URL, getBaseServerUrl } from "./api";

/**
 * Resolve Socket.IO base URL from .env or automatically derived from API_BASE_URL
 */
const getSocketUrl = (): string => {
  const envSocket =
    process.env.EXPO_PUBLIC_SOCKET_URL ||
    process.env.EXPO_PUBLIC_WS_URL;

  if (envSocket && envSocket.trim()) {
    return envSocket.trim().replace(/\/+$/, "");
  }

  return getBaseServerUrl(API_BASE_URL);
};

class SocketService {
  private socket: Socket | null = null;
  private isConnecting: boolean = false;
  private connectPromise: Promise<Socket | null> | null = null;
  private activeSubscriptions: Set<string> = new Set();
  private currentRole: string | null = null;
  private currentToken: string | null = null;
  private persistentListeners: Map<string, Set<(data: any) => void>> = new Map();

  /**
   * Register a persistent listener that stays attached across reconnections and role switches
   */
  public registerListener(event: string, handler: (data: any) => void): () => void {
    if (!this.persistentListeners.has(event)) {
      this.persistentListeners.set(event, new Set());
    }
    this.persistentListeners.get(event)!.add(handler);

    if (this.socket) {
      this.socket.on(event, handler);
    }

    return () => {
      this.persistentListeners.get(event)?.delete(handler);
      if (this.persistentListeners.get(event)?.size === 0) {
        this.persistentListeners.delete(event);
      }
      this.socket?.off(event, handler);
    };
  }

  /**
   * Connect socket with authentication token from storage
   */
  public async connect(
    roleOrIsVendor:
      | boolean
      | "vendor"
      | "delivery"
      | "customer"
      | "admin" = "customer",
  ): Promise<Socket | null> {
    const roleStr =
      typeof roleOrIsVendor === "boolean"
        ? roleOrIsVendor
          ? "vendor"
          : "customer"
        : roleOrIsVendor;

    if (this.connectPromise) {
      if (this.currentRole === roleStr) {
        return this.connectPromise;
      }
      try {
        await this.connectPromise;
      } catch (_) {}
    }

    this.connectPromise = this.doConnect(roleStr);
    try {
      const res = await this.connectPromise;
      return res;
    } finally {
      this.connectPromise = null;
    }
  }

  private async doConnect(roleStr: string): Promise<Socket | null> {
    try {
      this.isConnecting = true;
      const adminToken = await storage.getItem("bhansa_admin_token");
      const customerToken = await storage.getItem("bhansa_token");
      const vendorToken = await storage.getItem("bhansa_vendor_token");
      const deliveryToken = await storage.getItem("bhansa_delivery_token");

      let token = customerToken;
      if (roleStr === "admin") {
        token = adminToken || customerToken;
      } else if (roleStr === "delivery") {
        token = deliveryToken;
        if (!token && customerToken) {
          try {
            const rawUser = await storage.getItem("bhansa_user");
            if (rawUser && JSON.parse(rawUser)?.role === "delivery_boy") {
              token = customerToken;
              await storage.setItem("bhansa_delivery_token", customerToken);
            }
          } catch (_) {}
        }
      } else if (roleStr === "vendor") {
        token = vendorToken || customerToken;
      } else {
        token = customerToken || vendorToken || adminToken;
      }

      if (!token) {
        console.log(
          `[SocketService] No auth token found for role '${roleStr}'; skipping socket connection`,
        );
        this.isConnecting = false;
        return null;
      }

      // If socket is already connected with the identical role and token, reuse it
      if (
        this.socket &&
        this.socket.connected &&
        this.currentRole === roleStr &&
        this.currentToken === token
      ) {
        return this.socket;
      }

      // If switching role or token while connected, cleanly disconnect previous socket
      if (this.socket) {
        try {
          console.log(
            `[SocketService] Role/token changed from '${this.currentRole}' to '${roleStr}', disconnecting previous socket...`,
          );
          this.socket.disconnect();
        } catch {}
        this.socket = null;
      }

      if (roleStr === "vendor") {
        // Clear old customer-specific order subscriptions when switching to vendor
        Array.from(this.activeSubscriptions).forEach((room) => {
          if (room.startsWith("order:")) {
            this.activeSubscriptions.delete(room);
          }
        });
      }

      const socketUrl = getSocketUrl();
      console.log(
        `[SocketService] Connecting to ${socketUrl} (Role: ${roleStr})`,
      );

      this.currentRole = roleStr;
      this.currentToken = token;

      this.socket = io(socketUrl, {
        auth: {
          token,
        },
        transports: ["polling", "websocket"],
        upgrade: true,
        reconnection: true,
        reconnectionAttempts: 15,
        reconnectionDelay: 2000,
        reconnectionDelayMax: 10000,
        timeout: 30000,
      });

      // Attach all registered persistent listeners to the new socket instance immediately
      this.persistentListeners.forEach((handlers, event) => {
        handlers.forEach((handler) => {
          this.socket?.on(event, handler);
        });
      });

      this.socket.on("connect", () => {
        console.log(
          `[SocketService] Connected successfully! ID: ${this.socket?.id} (Transport: ${this.socket?.io?.engine?.transport?.name}) [Role: ${this.currentRole}]`,
        );

        // Re-attach persistent listeners on connection/reconnection
        this.persistentListeners.forEach((handlers, event) => {
          handlers.forEach((handler) => {
            this.socket?.off(event, handler);
            this.socket?.on(event, handler);
          });
        });

        // Re-subscribe to active rooms after reconnection
        this.activeSubscriptions.forEach((room) => {
          if (room.startsWith("order:")) {
            const orderId = room.replace("order:", "");
            this.subscribeToOrder(orderId);
          } else if (room.startsWith("store:")) {
            const storeId = room.replace("store:", "");
            this.subscribeToVendorOrders(storeId);
          }
        });
      });

      this.socket.io?.engine?.on("upgrade", (transport) => {
        console.log(`[SocketService] Transport upgraded to ${transport.name}`);
      });

      this.socket.on("connect_error", (err) => {
        // If websocket upgrade fails, socket.io automatically remains on polling
        if (err.message !== "websocket error") {
          console.warn("[SocketService Connect Error]:", err.message);
        } else {
          console.log("[SocketService] WebSocket unavailable; operating via resilient HTTP polling transport.");
        }
      });

      this.socket.on("disconnect", (reason) => {
        console.log(`[SocketService] Disconnected. Reason: ${reason}`);
      });

      return this.socket;
    } catch (err) {
      console.error("[SocketService] Failed to establish connection:", err);
      return null;
    } finally {
      this.isConnecting = false;
    }
  }

  /**
   * Disconnect socket cleanly
   */
  public disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.currentRole = null;
      this.currentToken = null;
      this.activeSubscriptions.clear();
      console.log("[SocketService] Disconnected and cleared socket instance");
    }
  }

  /**
   * Check connection status
   */
  public isConnected(): boolean {
    return Boolean(this.socket && this.socket.connected);
  }

  /**
   * Customer subscribes to real-time order updates
   */
  public subscribeToOrder(orderId: string): void {
    if (!orderId) return;
    this.activeSubscriptions.add(`order:${orderId}`);

    if (this.socket && this.socket.connected) {
      this.socket.emit("customer:order:subscribe", { orderId }, (res: any) => {
        if (res?.success) {
          console.log(`[SocketService] Subscribed to order room: ${orderId}`);
        } else {
          console.warn(
            `[SocketService] Subscription to order ${orderId} rejected:`,
            res?.message,
          );
        }
      });
    }
  }

  /**
   * Vendor subscribes to real-time new orders room
   */
  public subscribeToVendorOrders(storeId?: string): void {
    const key = `store:${storeId || "my-store"}`;
    this.activeSubscriptions.add(key);

    if (this.socket && this.socket.connected) {
      this.socket.emit("vendor:orders:subscribe", { storeId }, (res: any) => {
        if (res?.success) {
          console.log(`[SocketService] Subscribed to vendor store orders`);
        }
      });
    }
  }

  /**
   * Register listener for new incoming orders (Vendor)
   */
  public onNewVendorOrder(handler: (order: any) => void): () => void {
    if (!this.socket) {
      this.connect(true);
    }

    const wrappedHandler = (order: any) => {
      console.log(
        `[SocketService] Received vendor:order:new:`,
        order?.orderNumber,
      );
      handler(order);
    };

    this.socket?.on("vendor:order:new", wrappedHandler);

    return () => {
      this.socket?.off("vendor:order:new", wrappedHandler);
    };
  }

  /**
   * Register listener for order status changes (Both Customer & Vendor)
   */
  public onOrderStatusUpdated(handler: (update: any) => void): () => void {
    const wrappedHandler = (update: any) => {
      console.log(
        `[SocketService] Received status update for Order:`,
        update?.orderNumber,
        update?.orderStatus,
      );
      handler(update);
    };

    this.socket?.on("customer:order:status_updated", wrappedHandler);
    this.socket?.on("vendor:order:status_updated", wrappedHandler);

    return () => {
      this.socket?.off("customer:order:status_updated", wrappedHandler);
      this.socket?.off("vendor:order:status_updated", wrappedHandler);
    };
  }

  /**
   * Register listener for real-time Vendor Notifications
   */
  public onVendorNotification(handler: (notif: any) => void): () => void {
    const wrappedHandler = (notif: any) => {
      console.log(
        `[SocketService] Received vendor:notification:`,
        notif?.title,
      );
      handler(notif);
    };

    this.socket?.on("vendor:notification", wrappedHandler);
    this.socket?.on("vendor:notification:broadcast", wrappedHandler);
    return () => {
      this.socket?.off("vendor:notification", wrappedHandler);
      this.socket?.off("vendor:notification:broadcast", wrappedHandler);
    };
  }

  /**
   * Register listener for real-time Customer / Direct User Notifications
   */
  public onCustomerNotification(handler: (notif: any) => void): () => void {
    const wrappedHandler = (notif: any) => {
      console.log(
        `[SocketService] Received customer notification:`,
        notif?.title,
      );
      handler(notif);
    };

    this.socket?.on("notification:direct", wrappedHandler);
    this.socket?.on("notification:broadcast", wrappedHandler);
    this.socket?.on("notification", wrappedHandler);
    return () => {
      this.socket?.off("notification:direct", wrappedHandler);
      this.socket?.off("notification:broadcast", wrappedHandler);
      this.socket?.off("notification", wrappedHandler);
    };
  }

  /**
   * Register listener for real-time COD custody updates
   */
  public onVendorCodUpdate(handler: (data: any) => void): () => void {
    const wrappedHandler = (data: any) => {
      handler(data);
    };

    this.socket?.on("vendor:cod:update", wrappedHandler);
    return () => {
      this.socket?.off("vendor:cod:update", wrappedHandler);
    };
  }

  /**
   * Register listener for real-time Vendor Wallet balance updates
   */
  public onVendorWalletUpdate(handler: (data: any) => void): () => void {
    const wrappedHandler = (data: any) => {
      handler(data);
    };

    this.socket?.on("vendor:wallet:update", wrappedHandler);
    return () => {
      this.socket?.off("vendor:wallet:update", wrappedHandler);
    };
  }

  /**
   * Vendor accepts order with acknowledgement
   */
  public acceptVendorOrder(orderId: string): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!this.socket || !this.socket.connected) {
        return reject(new Error("Socket is not connected. Reconnecting..."));
      }

      this.socket.emit("vendor:order:accept", { orderId }, (response: any) => {
        if (response?.success) {
          resolve(response.order);
        } else {
          reject(new Error(response?.message || "Failed to accept order"));
        }
      });
    });
  }

  /**
   * Vendor rejects order with acknowledgement
   */
  public rejectVendorOrder(orderId: string, reason?: string): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!this.socket || !this.socket.connected) {
        return reject(new Error("Socket is not connected. Reconnecting..."));
      }

      this.socket.emit(
        "vendor:order:reject",
        { orderId, reason },
        (response: any) => {
          if (response?.success) {
            resolve(response.order);
          } else {
            reject(new Error(response?.message || "Failed to reject order"));
          }
        },
      );
    });
  }

  /**
   * Listen for incoming delivery order offer requests (60s window)
   */
  public onDeliveryOrderRequest(handler: (offer: any) => void): () => void {
    const wrappedHandler = (offer: any) => {
      console.log(
        `[SocketService] Received delivery order request:`,
        offer?.orderNumber || offer?.assignmentId,
      );
      handler(offer);
    };

    return this.registerListener("delivery:order:request", wrappedHandler);
  }

  /**
   * Listen for real-time Delivery Partner Notifications
   */
  public onDeliveryNotification(handler: (notif: any) => void): () => void {
    const wrappedHandler = (notif: any) => {
      console.log(
        `[SocketService] Received delivery notification:`,
        notif?.title,
      );
      handler(notif);
    };

    const unsub1 = this.registerListener("delivery:notification", wrappedHandler);
    const unsub2 = this.registerListener("delivery:portal:announcement", wrappedHandler);
    return () => {
      unsub1();
      unsub2();
    };
  }

  /**
   * Listen for expired or cancelled delivery offer requests (when 60s countdown expires on server or order cancelled)
   */
  public onDeliveryOrderExpired(handler: (data: any) => void): () => void {
    const wrappedHandler = (data: any) => {
      console.log(
        `[SocketService] Delivery order request expired or cancelled:`,
        data?.orderNumber || data?.orderId,
      );
      handler(data);
    };

    const unsub1 = this.registerListener("delivery:order:expired", wrappedHandler);
    const unsub2 = this.registerListener("delivery:order:cancelled", wrappedHandler);
    return () => {
      unsub1();
      unsub2();
    };
  }

  /**
   * Emit real-time GPS location from delivery partner mobile device
   */
  public emitDeliveryLocation(
    latitude: number,
    longitude: number,
    heading: number = 0,
    speed: number = 0,
  ): Promise<any> {
    return new Promise((resolve) => {
      if (!this.socket || !this.socket.connected) {
        return resolve({ success: false, message: "Socket not connected" });
      }

      this.socket.emit(
        "delivery:location:update",
        { latitude, longitude, heading, speed },
        (res: any) => {
          resolve(res);
        },
      );
    });
  }

  /**
   * Listen for live delivery GPS coordinates updates (Customer & Vendor tracking active order)
   */
  public onDeliveryLocationUpdate(handler: (data: any) => void): () => void {
    const wrappedHandler = (data: any) => {
      handler(data);
    };

    this.socket?.on("delivery:location:update", wrappedHandler);
    return () => {
      this.socket?.off("delivery:location:update", wrappedHandler);
    };
  }

  /**
   * Listen for delivery partner assigned event on order
   */
  public onDeliveryPartnerAssigned(handler: (data: any) => void): () => void {
    const wrappedHandler = (data: any) => {
      handler(data);
    };

    this.socket?.on("delivery:partner:assigned", wrappedHandler);
    return () => {
      this.socket?.off("delivery:partner:assigned", wrappedHandler);
    };
  }

  /**
   * Emit customer current GPS coordinates for real-time proximity discovery
   */
  public emitCustomerLocation(
    latitude: number,
    longitude: number,
  ): Promise<any> {
    return new Promise((resolve) => {
      if (!this.socket || !this.socket.connected) {
        return resolve({ success: false, message: "Socket not connected" });
      }

      this.socket.emit(
        "customer:location:update",
        { latitude, longitude },
        (res: any) => {
          resolve(res);
        },
      );
    });
  }

  /**
   * Listen for real-time nearby eligible vendors updates
   */
  public onNearbyVendorsUpdate(handler: (data: any) => void): () => void {
    const wrappedHandler = (data: any) => {
      handler(data);
    };

    this.socket?.on("customer:nearby-vendors:update", wrappedHandler);
    return () => {
      this.socket?.off("customer:nearby-vendors:update", wrappedHandler);
    };
  }

  /**
   * Listen for broadcasted vendor delivery radius updates
   */
  public onDeliveryRadiusUpdated(handler: (data: any) => void): () => void {
    const wrappedHandler = (data: any) => {
      handler(data);
    };

    this.socket?.on("vendor:delivery-radius:updated", wrappedHandler);
    return () => {
      this.socket?.off("vendor:delivery-radius:updated", wrappedHandler);
    };
  }

  /**
   * Listen for broadcasted vendor store open/closed availability changes
   */
  public onVendorAvailabilityChanged(handler: (data: any) => void): () => void {
    const wrappedHandler = (data: any) => {
      handler(data);
    };

    this.socket?.on("vendor:availability:changed", wrappedHandler);
    return () => {
      this.socket?.off("vendor:availability:changed", wrappedHandler);
    };
  }

  /**
   * Listen for real-time StaffAdmin operational events
   */
  public onStaffNotification(
    handler: (event: string, data: any) => void,
  ): () => void {
    const events = [
      "staff_order",
      "staff_withdrawal:new",
      "staff_withdrawal:updated",
      "staff_brand:new",
      "staff_brand:updated",
      "staff_refund:new",
      "staff_refund:vendor_responded",
      "staff_refund:updated",
      "staff_cod:dispute",
      "staff_alert",
      "staff:notification",
    ];

    const listeners = events.map((evt) => {
      const fn = (data: any) => handler(evt, data);
      this.socket?.on(evt, fn);
      return { evt, fn };
    });

    return () => {
      listeners.forEach(({ evt, fn }) => {
        this.socket?.off(evt, fn);
      });
    };
  }

  /**
   * Listen for real-time delivery rider availability status & location updates
   */
  public onDeliveryRiderStatus(handler: (data: any) => void): () => void {
    const wrappedHandler = (data: any) => {
      handler(data);
    };

    this.socket?.on("delivery:rider:status", wrappedHandler);
    this.socket?.on("delivery:location:update", wrappedHandler);
    return () => {
      this.socket?.off("delivery:rider:status", wrappedHandler);
      this.socket?.off("delivery:location:update", wrappedHandler);
    };
  }

  public getSocket(): Socket | null {
    return this.socket;
  }
}

export const socketService = new SocketService();
export default socketService;
