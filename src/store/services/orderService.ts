import api from "./api";

export interface CreateOrderPayload {
  items: {
    productId: string;
    quantity: number;
    price?: number;
    name?: string;
    imageUrl?: string;
    weight?: string;
  }[];
  deliveryAddress: {
    addressLine: string;
    city?: string;
    street?: string;
    houseNo?: string;
    landmark?: string;
    phone: string;
    type?: string;
  };
  addressId?: string;
  paymentMethod?: string;
  couponCode?: string;
  idempotencyKey?: string;
}

export interface UpdateOrderStatusPayload {
  orderId: string;
  status:
    | "ACCEPTED"
    | "PREPARING"
    | "READY_FOR_PICKUP"
    | "OUT_FOR_DELIVERY"
    | "DELIVERED"
    | "CANCELLED"
    | "REJECTED";
  reason?: string;
}

/**
 * Place a new customer order
 */
export const createOrderApi = async (payload: CreateOrderPayload) => {
  const response = await api.post("/orders", payload);
  return response.data;
};

/**
 * Fetch customer's order history
 */
export const fetchCustomerOrdersApi = async (params?: {
  page?: number;
  limit?: number;
}) => {
  const response = await api.get("/orders/my-orders", { params });
  return response.data;
};

/**
 * Fetch single order details by ID or orderNumber
 */
export const fetchOrderByIdApi = async (orderId: string) => {
  const response = await api.get(`/orders/${orderId}`);
  return response.data;
};

/**
 * Fetch live and pending orders for the authenticated vendor
 */
export const fetchVendorOrdersApi = async (params?: {
  status?: string;
  page?: number;
  limit?: number;
}) => {
  const response = await api.get("/orders/vendor/live", { params });
  return response.data;
};

/**
 * Vendor updates order status atomically
 */
export const updateOrderStatusApi = async (
  orderId: string,
  payload: { status: string; reason?: string }
) => {
  const response = await api.patch(`/orders/${orderId}/status`, payload);
  return response.data;
};
