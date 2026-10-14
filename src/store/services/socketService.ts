import storage from "@/utils/storage";
import { io, Socket } from "socket.io-client";
import { API_BASE_URL } from "./api";

/**
 * Resolve Socket.IO base URL from API_BASE_URL
 */
const getSocketUrl = () => {
  if (process.env.EXPO_PUBLIC_SOCKET_URL) {
    return process.env.EXPO_PUBLIC_SOCKET_URL;
  }
  // Strip trailing /api from API_BASE_URL (e.g., http://192.168.29.235:5000/api -> http://192.168.29.235:5000)
  return API_BASE_URL.replace(/\/api\/?$/, "");
};

class SocketService {
  private socket: Socket | null = null;
  private isConnecting: boolean = false;
  private activeSubscriptions: Set<string> = new Set();

  /**
   * Connect socket with authentication token from storage
   */
  public async connect(
    roleOrIsVendor: boolean | "vendor" | "delivery" | "customer" = "customer"
  ): Promise<Socket | null> {
    if (this.socket && this.socket.connected) {
      return this.socket;
    }

    if (this.isConnecting) {
      return null;
    }

    try {
      this.isConnecting = true;
      const customerToken = await storage.getItem("bhansa_token");
      const vendorToken = await storage.getItem("bhansa_vendor_token");
      const deliveryToken = await storage.getItem("bhansa_delivery_token");

      let token = customerToken;
      const roleStr =
        typeof roleOrIsVendor === "boolean"
          ? roleOrIsVendor
            ? "vendor"
            : "customer"
          : roleOrIsVendor;

      if (roleStr === "delivery") {
        token = deliveryToken;
      } else if (roleStr === "vendor") {
        token = vendorToken || customerToken;
      } else {
        token = customerToken || vendorToken;
      }

      if (!token) {
        console.log(`[SocketService] No auth token found for role '${roleStr}'; skipping socket connection`);
        this.isConnecting = false;
        return null;
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
      console.log(`[SocketService] Connecting to ${socketUrl} (Role: ${roleStr})`);

      this.socket = io(socketUrl, {
        auth: {
          token,
        },
        transports: ["websocket", "polling"],
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 2000,
        timeout: 15000,
      });

      this.socket.on("connect", () => {
        console.log(`[SocketService] Connected successfully! ID: ${this.socket?.id}`);
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

      this.socket.on("connect_error", (err) => {
        console.warn("[SocketService Connect Error]:", err.message);
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
      this.activeSubscriptions.clear();
      console.log("[SocketService] Disconnected and cleared subscriptions");
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
          console.warn(`[SocketService] Subscription to order ${orderId} rejected:`, res?.message);
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
      console.log(`[SocketService] Received vendor:order:new:`, order?.orderNumber);
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
      console.log(`[SocketService] Received status update for Order:`, update?.orderNumber, update?.orderStatus);
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
      console.log(`[SocketService] Received vendor:notification:`, notif?.title);
      handler(notif);
    };

    this.socket?.on("vendor:notification", wrappedHandler);
    return () => {
      this.socket?.off("vendor:notification", wrappedHandler);
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

      this.socket.emit("vendor:order:reject", { orderId, reason }, (response: any) => {
        if (response?.success) {
          resolve(response.order);
        } else {
          reject(new Error(response?.message || "Failed to reject order"));
        }
      });
    });
  }

  /**
   * Listen for incoming delivery order offer requests (45s window)
   */
  public onDeliveryOrderRequest(handler: (offer: any) => void): () => void {
    const wrappedHandler = (offer: any) => {
      console.log(`[SocketService] Received delivery order request:`, offer?.orderNumber);
      handler(offer);
    };

    this.socket?.on("delivery:order:request", wrappedHandler);
    return () => {
      this.socket?.off("delivery:order:request", wrappedHandler);
    };
  }

  /**
   * Emit real-time GPS location from delivery partner mobile device
   */
  public emitDeliveryLocation(
    latitude: number,
    longitude: number,
    heading: number = 0,
    speed: number = 0
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
        }
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

  public getSocket(): Socket | null {
    return this.socket;
  }
}

export const socketService = new SocketService();
export default socketService;
