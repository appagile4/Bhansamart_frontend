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

/**
 * Customer cancels order
 */
export const cancelOrderApi = async (
  orderId: string,
  reason: string = "Cancelled by customer"
) => {
  const response = await api.post(`/orders/${orderId}/cancel`, { reason });
  return response.data;
};

export interface RequestRefundPayload {
  orderId: string;
  claimType: "CANCELLATION" | "RETURN" | "REFUND" | "REPLACEMENT" | "EXCHANGE" | "DEFECTIVE" | "WRONG_ITEM";
  reason: string;
  description?: string;
  items?: {
    productId: string;
    quantity: number;
  }[];
  proofImages?: string[];
  customerPayoutDetails?: {
    method?: string;
    upiId?: string;
    accountNumber?: string;
    bankName?: string;
    accountHolderName?: string;
    ifscCode?: string;
  };
  exchangeDetails?: {
    exchangeProductId?: string;
    exchangeProductName?: string;
    priceDifference?: number;
  };
}

/**
 * Customer submits return / refund / replacement request
 */
export const requestRefundApi = async (payload: RequestRefundPayload) => {
  const response = await api.post("/refunds/request", payload);
  return response.data;
};

/**
 * Customer fetches their refunds
 */
export const fetchMyRefundsApi = async () => {
  const response = await api.get("/refunds/my-refunds");
  return response.data;
};

/**
 * Vendor fetches refund / return claims
 */
export const fetchVendorRefundsApi = async (params?: {
  status?: string;
  claimType?: string;
  page?: number;
  limit?: number;
}) => {
  const response = await api.get("/refunds/vendor", { params });
  return response.data;
};

/**
 * Vendor approves refund claim
 */
export const approveRefundApi = async (
  refundId: string,
  resolutionNotes?: string
) => {
  const response = await api.post(`/refunds/${refundId}/approve`, {
    resolutionNotes,
  });
  return response.data;
};

/**
 * Vendor rejects refund claim
 */
export const rejectRefundApi = async (
  refundId: string,
  rejectionReason: string
) => {
  const response = await api.post(`/refunds/${refundId}/reject`, {
    rejectionReason,
  });
  return response.data;
};


export const vendorAcknowledgeClaimApi = async (id: string, payload?: { notes?: string }) => {
  const response = await api.patch(`/refunds/${id}/vendor-acknowledge`, payload || {});
  return response.data;
};

export const vendorDirectRefundPayoutApi = async (
  id: string,
  payload: {
    transactionReference: string;
    paymentMethod?: string;
    proofImage?: string;
    notes?: string;
  }
) => {
  const response = await api.patch(`/refunds/${id}/vendor-direct-payout`, payload);
  return response.data;
};

export const superAdminProcessOnlineRefundApi = async (
  id: string,
  payload: {
    payoutReference?: string;
    payoutProofImage?: string;
    status?: "COMPLETED" | "PROCESSING";
    notes?: string;
  }
) => {
  const response = await api.patch(`/refunds/${id}/superadmin-online-payout`, payload);
  return response.data;
};

export const adminAssignReturnPickupApi = async (
  id: string,
  payload: { deliveryBoyId: string; notes?: string }
) => {
  const response = await api.patch(`/refunds/${id}/assign-pickup`, payload);
  return response.data;
};

export const deliveryBoySubmitReturnInspectionApi = async (
  id: string,
  payload: {
    otp?: string;
    condition: string;
    missingAccessories?: string;
    visibleDamage?: string;
    quantityCollected?: number;
    location?: string;
    proofImages?: string[];
    notes?: string;
    result: "PASSED" | "FAILED";
  }
) => {
  const response = await api.patch(`/refunds/${id}/delivery-inspection`, payload);
  return response.data;
};
