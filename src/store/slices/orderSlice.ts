import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import {
  createOrderApi,
  CreateOrderPayload,
  fetchCustomerOrdersApi,
  fetchOrderByIdApi,
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
    latitude?: number;
    longitude?: number;
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
  refundStatus?: string;
  refundDetails?: any;
  financialLedger?: any;
  paymentDetails?: any;
  codDetails?: any;
  createdAt: string;
  updatedAt?: string;
}

export interface OrderState {
  customerOrders: OrderRecord[];
  currentOrder: OrderRecord | null;
  customerLoading: boolean;
  actionLoading: boolean;
  error: string | null;
}

const initialState: OrderState = {
  customerOrders: [],
  currentOrder: null,
  customerLoading: false,
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
      return response?.data !== undefined ? response.data : response;
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

export const orderSlice = createSlice({
  name: "order",
  initialState,
  reducers: {
    clearCurrentOrder: (state) => {
      state.currentOrder = null;
    },
    // Real-time listener: Order status updated (Customer)
    orderStatusUpdatedRealtime: (state, action: PayloadAction<any>) => {
      const {
        _id,
        orderStatus,
        refundStatus,
        refundDetails,
        rejectionReason,
        statusHistory,
      } = action.payload;
      if (!_id) return;

      // Update currentOrder if open
      if (state.currentOrder && String(state.currentOrder._id) === String(_id)) {
        if (orderStatus) state.currentOrder.orderStatus = orderStatus;
        if (refundStatus !== undefined) state.currentOrder.refundStatus = refundStatus;
        if (refundDetails !== undefined) state.currentOrder.refundDetails = refundDetails;
        if (rejectionReason) state.currentOrder.rejectionReason = rejectionReason;
        if (statusHistory) state.currentOrder.statusHistory = statusHistory;
      }

      // Update in customerOrders
      const custIdx = state.customerOrders.findIndex(
        (o) => String(o._id) === String(_id)
      );
      if (custIdx !== -1) {
        if (orderStatus) state.customerOrders[custIdx].orderStatus = orderStatus;
        if (refundStatus !== undefined) state.customerOrders[custIdx].refundStatus = refundStatus;
        if (refundDetails !== undefined) state.customerOrders[custIdx].refundDetails = refundDetails;
        if (rejectionReason) state.customerOrders[custIdx].rejectionReason = rejectionReason;
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
      const payload = action.payload;
      if (Array.isArray(payload)) {
        state.customerOrders = payload;
      } else if (payload && Array.isArray(payload.data)) {
        state.customerOrders = payload.data;
      } else if (payload && Array.isArray(payload.orders)) {
        state.customerOrders = payload.orders;
      } else {
        state.customerOrders = [];
      }
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
  },
});

export const { clearCurrentOrder, orderStatusUpdatedRealtime } =
  orderSlice.actions;

export default orderSlice.reducer;
