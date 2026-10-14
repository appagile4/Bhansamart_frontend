import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import {
  createOrderApi,
  CreateOrderPayload,
  fetchCustomerOrdersApi,
  fetchOrderByIdApi,
  fetchVendorOrdersApi,
  updateOrderStatusApi,
  UpdateOrderStatusPayload,
} from "../services/orderService";

export type OrderStatus =
  | "PLACED"
  | "ACCEPTED"
  | "PREPARING"
  | "READY_FOR_PICKUP"
  | "OUT_FOR_DELIVERY"
  | "DELIVERED"
  | "CANCELLED"
  | "REJECTED";

export interface OrderItem {
  _id?: string;
  product?: string;
  productId: string;
  name: string;
  price: number;
  originalPrice?: number;
  quantity: number;
  imageUrl?: string;
  weight?: string;
  category?: string;
}

export interface OrderRecord {
  _id: string;
  orderNumber: string;
  customer: any;
  vendor: any;
  items: OrderItem[];
  totalCount: number;
  itemsTotal: number;
  handlingCharge: number;
  deliveryCharge: number;
  discount: number;
  totalAmount: number;
  deliveryAddress: {
    addressLine: string;
    city?: string;
    street?: string;
    houseNo?: string;
    landmark?: string;
    phone: string;
    type?: string;
  };
  paymentMethod: string;
  paymentStatus: string;
  orderStatus: OrderStatus;
  statusHistory?: {
    status: string;
    timestamp: string;
    reason?: string;
  }[];
  rejectionReason?: string;
  estimatedDeliveryTime?: string;
  customerDeliveryOtp?: string;
  vendorPickupOtp?: string;
  assignedDeliveryBoy?: any;
  deliveryBoyLocation?: any;
  createdAt: string;
  updatedAt?: string;
}

export interface OrderState {
  customerOrders: OrderRecord[];
  currentOrder: OrderRecord | null;
  customerLoading: boolean;
  vendorOrders: OrderRecord[];
  vendorPendingCount: number;
  vendorLoading: boolean;
  actionLoading: boolean;
  error: string | null;
}

const initialState: OrderState = {
  customerOrders: [],
  currentOrder: null,
  customerLoading: false,
  vendorOrders: [],
  vendorPendingCount: 0,
  vendorLoading: false,
  actionLoading: false,
  error: null,
};

// ── Async Thunks ──────────────────────────────────────────────────────

export const createOrder = createAsyncThunk(
  "order/createOrder",
  async (payload: CreateOrderPayload, { rejectWithValue }) => {
    try {
      const response = await createOrderApi(payload);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.message || "Failed to place order. Please try again."
      );
    }
  }
);

export const fetchCustomerOrders = createAsyncThunk(
  "order/fetchCustomerOrders",
  async (params: { page?: number; limit?: number } | undefined, { rejectWithValue }) => {
    try {
      const response = await fetchCustomerOrdersApi(params);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.message || "Failed to fetch orders."
      );
    }
  }
);

export const fetchCustomerOrderById = createAsyncThunk(
  "order/fetchCustomerOrderById",
  async (orderId: string, { rejectWithValue }) => {
    try {
      const response = await fetchOrderByIdApi(orderId);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.message || "Failed to fetch order details."
      );
    }
  }
);

export const fetchVendorOrders = createAsyncThunk(
  "order/fetchVendorOrders",
  async (params: { status?: string; page?: number; limit?: number } | undefined, { rejectWithValue }) => {
    try {
      const response = await fetchVendorOrdersApi(params);
      return {
        orders: response.data,
        pendingCount: response.pendingCount || 0,
      };
    } catch (error: any) {
      return rejectWithValue(
        error.message || "Failed to fetch vendor orders."
      );
    }
  }
);

export const updateVendorOrderStatus = createAsyncThunk(
  "order/updateVendorOrderStatus",
  async (
    payload: { orderId: string; status: string; reason?: string },
    { rejectWithValue }
  ) => {
    try {
      const response = await updateOrderStatusApi(payload.orderId, {
        status: payload.status,
        reason: payload.reason,
      });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.message || "Failed to update order status."
      );
    }
  }
);

export const orderSlice = createSlice({
  name: "order",
  initialState,
  reducers: {
    clearCurrentOrder: (state) => {
      state.currentOrder = null;
    },
    // Real-time listener: New Order received by vendor
    vendorOrderNewRealtime: (state, action: PayloadAction<any>) => {
      const incoming = action.payload;
      if (!incoming || !incoming._id) return;

      const exists = state.vendorOrders.some(
        (o) => String(o._id) === String(incoming._id)
      );

      if (!exists) {
        state.vendorOrders.unshift(incoming);
        state.vendorPendingCount += 1;
      }
    },
    // Real-time listener: Order status updated (Both Customer and Vendor)
    orderStatusUpdatedRealtime: (state, action: PayloadAction<any>) => {
      const { _id, orderStatus, rejectionReason, statusHistory } = action.payload;
      if (!_id) return;

      // Update currentOrder if open
      if (state.currentOrder && String(state.currentOrder._id) === String(_id)) {
        state.currentOrder.orderStatus = orderStatus;
        if (rejectionReason) state.currentOrder.rejectionReason = rejectionReason;
        if (statusHistory) state.currentOrder.statusHistory = statusHistory;
      }

      // Update in customerOrders
      const custIdx = state.customerOrders.findIndex(
        (o) => String(o._id) === String(_id)
      );
      if (custIdx !== -1) {
        state.customerOrders[custIdx].orderStatus = orderStatus;
        if (rejectionReason) state.customerOrders[custIdx].rejectionReason = rejectionReason;
      }

      // Update in vendorOrders
      const vendIdx = state.vendorOrders.findIndex(
        (o) => String(o._id) === String(_id)
      );
      if (vendIdx !== -1) {
        const oldStatus = state.vendorOrders[vendIdx].orderStatus;
        state.vendorOrders[vendIdx].orderStatus = orderStatus;
        if (rejectionReason) state.vendorOrders[vendIdx].rejectionReason = rejectionReason;

        if (oldStatus === "PLACED" && orderStatus !== "PLACED") {
          state.vendorPendingCount = Math.max(0, state.vendorPendingCount - 1);
        }
      }
    },
  },
  extraReducers: (builder) => {
    // ── Create Order ──────────────────────────────────────────────────
    builder.addCase(createOrder.pending, (state) => {
      state.customerLoading = true;
      state.error = null;
    });
    builder.addCase(createOrder.fulfilled, (state, action) => {
      state.customerLoading = false;
      state.currentOrder = action.payload;
      const exists = state.customerOrders.some(
        (o) => String(o._id) === String(action.payload._id)
      );
      if (!exists) {
        state.customerOrders.unshift(action.payload);
      }
    });
    builder.addCase(createOrder.rejected, (state, action) => {
      state.customerLoading = false;
      state.error = action.payload as string;
    });

    // ── Customer Orders ───────────────────────────────────────────────
    builder.addCase(fetchCustomerOrders.pending, (state) => {
      state.customerLoading = true;
      state.error = null;
    });
    builder.addCase(fetchCustomerOrders.fulfilled, (state, action) => {
      state.customerLoading = false;
      state.customerOrders = action.payload;
    });
    builder.addCase(fetchCustomerOrders.rejected, (state, action) => {
      state.customerLoading = false;
      state.error = action.payload as string;
    });

    // ── Fetch Order By ID ─────────────────────────────────────────────
    builder.addCase(fetchCustomerOrderById.pending, (state) => {
      state.customerLoading = true;
    });
    builder.addCase(fetchCustomerOrderById.fulfilled, (state, action) => {
      state.customerLoading = false;
      state.currentOrder = action.payload;
    });
    builder.addCase(fetchCustomerOrderById.rejected, (state, action) => {
      state.customerLoading = false;
      state.error = action.payload as string;
    });

    // ── Vendor Orders ─────────────────────────────────────────────────
    builder.addCase(fetchVendorOrders.pending, (state) => {
      state.vendorLoading = true;
      state.error = null;
    });
    builder.addCase(fetchVendorOrders.fulfilled, (state, action) => {
      state.vendorLoading = false;
      state.vendorOrders = action.payload.orders;
      state.vendorPendingCount = action.payload.pendingCount;
    });
    builder.addCase(fetchVendorOrders.rejected, (state, action) => {
      state.vendorLoading = false;
      state.error = action.payload as string;
    });

    // ── Update Order Status (Vendor) ──────────────────────────────────
    builder.addCase(updateVendorOrderStatus.pending, (state) => {
      state.actionLoading = true;
      state.error = null;
    });
    builder.addCase(updateVendorOrderStatus.fulfilled, (state, action) => {
      state.actionLoading = false;
      const updated = action.payload;
      const idx = state.vendorOrders.findIndex(
        (o) => String(o._id) === String(updated._id)
      );
      if (idx !== -1) {
        state.vendorOrders[idx] = updated;
      }
      if (state.currentOrder && String(state.currentOrder._id) === String(updated._id)) {
        state.currentOrder = updated;
      }
    });
    builder.addCase(updateVendorOrderStatus.rejected, (state, action) => {
      state.actionLoading = false;
      state.error = action.payload as string;
    });
  },
});

export const {
  clearCurrentOrder,
  vendorOrderNewRealtime,
  orderStatusUpdatedRealtime,
} = orderSlice.actions;

export default orderSlice.reducer;
