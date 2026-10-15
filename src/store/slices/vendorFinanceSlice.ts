import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import api from "../services/api";

export interface VendorMetrics {
  totalOrders: number;
  pendingOrders: number;
  processingOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  totalSales: number;
  totalEarned: number;
  availableWithdrawalBalance: number;
  pendingSettlement: number;
  codCashWithDeliveryBoys: number;
  storeRating: number;
}

export interface VendorTransactionRecord {
  _id: string;
  vendor: string;
  order?: any;
  deliveryBoy?: any;
  type:
    | "ORDER_EARNING"
    | "COD_COLLECTION"
    | "COD_HANDOVER"
    | "WITHDRAWAL"
    | "PLATFORM_FEE"
    | "DIRECT_QR_PAYMENT";
  amount: number;
  grossAmount: number;
  commission: number;
  netAmount: number;
  paymentMethod: string;
  status:
    | "PENDING"
    | "SETTLED"
    | "CASH_IN_CUSTODY"
    | "SUBMITTED"
    | "COMPLETED"
    | "FAILED"
    | "DIRECT_SETTLED";
  idempotencyKey?: string;
  notes?: string;
  createdAt: string;
}

export interface VendorNotificationRecord {
  _id: string;
  vendor: string;
  type: string;
  title: string;
  message: string;
  order?: any;
  data?: any;
  isRead: boolean;
  readAt?: string;
  createdAt: string;
}

export interface CodDueRider {
  deliveryBoy: {
    _id: string;
    fullName: string;
    phone: string;
    vehicleDetails?: any;
    profilePhoto?: { url: string };
    codCashInCustody?: number;
  };
  totalDue: number;
  ordersCount: number;
  orders: {
    _id: string;
    orderNumber: string;
    totalAmount: number;
    deliveredAt: string;
    customerName: string;
  }[];
}

export interface CodHandoverReceipt {
  _id: string;
  receiptNumber: string;
  vendor: any;
  deliveryBoy: any;
  amountDue: number;
  amountSubmitted: number;
  remainingBalance: number;
  paymentMode: string;
  notes?: string;
  createdAt: string;
}

export interface PaymentQrSettings {
  qrCodeUrl: string;
  qrCodePublicId?: string;
  upiId: string;
  accountName: string;
  acceptQrPayments: boolean;
}

export interface VendorFinanceState {
  metrics: VendorMetrics;
  recentOrders: any[];
  recentNotifications: VendorNotificationRecord[];
  unreadCount: number;

  transactions: VendorTransactionRecord[];
  transactionsLoading: boolean;

  notifications: VendorNotificationRecord[];
  notificationsLoading: boolean;

  codDueRiders: CodDueRider[];
  recentHandovers: CodHandoverReceipt[];
  codLoading: boolean;

  paymentQr: PaymentQrSettings;
  qrLoading: boolean;

  // Store Operations & Delivery Radius
  deliveryRadiusKm: number;
  isStoreOpen: boolean;
  shippingLocations: any;

  dashboardLoading: boolean;
  actionLoading: boolean;
  error: string | null;

  // Real-time Popup for incoming orders
  newOrderAlert: any | null;
}

const initialMetrics: VendorMetrics = {
  totalOrders: 0,
  pendingOrders: 0,
  processingOrders: 0,
  completedOrders: 0,
  cancelledOrders: 0,
  totalSales: 0,
  totalEarned: 0,
  availableWithdrawalBalance: 0,
  pendingSettlement: 0,
  codCashWithDeliveryBoys: 0,
  storeRating: 4.9,
};

const initialState: VendorFinanceState = {
  metrics: initialMetrics,
  recentOrders: [],
  recentNotifications: [],
  unreadCount: 0,

  transactions: [],
  transactionsLoading: false,

  notifications: [],
  notificationsLoading: false,

  codDueRiders: [],
  recentHandovers: [],
  codLoading: false,

  paymentQr: {
    qrCodeUrl: "",
    upiId: "",
    accountName: "",
    acceptQrPayments: false,
  },
  qrLoading: false,

  deliveryRadiusKm: 5,
  isStoreOpen: true,
  shippingLocations: null,

  dashboardLoading: false,
  actionLoading: false,
  error: null,

  newOrderAlert: null,
};

// ── Async Thunks ─────────────────────────────────────────────────────────────

export const fetchDashboardStats = createAsyncThunk(
  "vendorFinance/fetchDashboardStats",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get("/vendor/dashboard/stats");
      return response.data.data;
    } catch (err: any) {
      return rejectWithValue(err.message || "Failed to fetch dashboard metrics");
    }
  }
);

export const fetchTransactions = createAsyncThunk(
  "vendorFinance/fetchTransactions",
  async (params: { type?: string; status?: string } | undefined, { rejectWithValue }) => {
    try {
      const response = await api.get("/vendor/transactions", { params });
      return response.data.data;
    } catch (err: any) {
      return rejectWithValue(err.message || "Failed to fetch transactions");
    }
  }
);

export const requestWithdrawal = createAsyncThunk(
  "vendorFinance/requestWithdrawal",
  async (payload: { amount: number; notes?: string }, { rejectWithValue }) => {
    try {
      const response = await api.post("/vendor/wallet/withdraw", payload);
      return response.data;
    } catch (err: any) {
      return rejectWithValue(err.message || "Failed to submit withdrawal request");
    }
  }
);

export const fetchNotifications = createAsyncThunk(
  "vendorFinance/fetchNotifications",
  async (params: { type?: string; isRead?: string } | undefined, { rejectWithValue }) => {
    try {
      const response = await api.get("/vendor/notifications", { params });
      return response.data.data;
    } catch (err: any) {
      return rejectWithValue(err.message || "Failed to fetch notifications");
    }
  }
);

export const markNotificationAsRead = createAsyncThunk(
  "vendorFinance/markNotificationAsRead",
  async (notificationId: string, { rejectWithValue }) => {
    try {
      const response = await api.patch(`/vendor/notifications/${notificationId}/read`);
      return response.data.data;
    } catch (err: any) {
      return rejectWithValue(err.message || "Failed to mark notification as read");
    }
  }
);

export const markAllNotificationsAsRead = createAsyncThunk(
  "vendorFinance/markAllNotificationsAsRead",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.patch("/vendor/notifications/read-all");
      return response.data;
    } catch (err: any) {
      return rejectWithValue(err.message || "Failed to mark all as read");
    }
  }
);

export const fetchCodDueRiders = createAsyncThunk(
  "vendorFinance/fetchCodDueRiders",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get("/vendor/cod/due-by-riders");
      return response.data.data;
    } catch (err: any) {
      return rejectWithValue(err.message || "Failed to fetch COD riders");
    }
  }
);

export const confirmCodHandover = createAsyncThunk(
  "vendorFinance/confirmCodHandover",
  async (
    payload: {
      deliveryBoyId: string;
      amountSubmitted: number;
      paymentMode?: string;
      notes?: string;
    },
    { rejectWithValue }
  ) => {
    try {
      const response = await api.post("/vendor/cod/confirm-handover", payload);
      return response.data.data;
    } catch (err: any) {
      return rejectWithValue(err.message || "Failed to confirm cash handover");
    }
  }
);

export const fetchPaymentQr = createAsyncThunk(
  "vendorFinance/fetchPaymentQr",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get("/vendor/payment-qr");
      return response.data.data;
    } catch (err: any) {
      return rejectWithValue(err.message || "Failed to fetch payment QR");
    }
  }
);

export const updatePaymentQr = createAsyncThunk(
  "vendorFinance/updatePaymentQr",
  async (payload: Partial<PaymentQrSettings>, { rejectWithValue }) => {
    try {
      const response = await api.put("/vendor/payment-qr", payload);
      return response.data.data;
    } catch (err: any) {
      return rejectWithValue(err.message || "Failed to update payment QR settings");
    }
  }
);

export const uploadPaymentQrImageAction = createAsyncThunk(
  "vendorFinance/uploadPaymentQrImage",
  async (imageUri: string, { rejectWithValue }) => {
    try {
      const formData = new FormData();
      const filename = imageUri.split("/").pop() || "payment_qr.jpg";
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : `image/jpeg`;

      formData.append("qrCode", {
        uri: imageUri,
        name: filename,
        type,
      } as any);

      const response = await api.post("/vendor/payment-qr/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return response.data.data;
    } catch (err: any) {
      return rejectWithValue(
        err.response?.data?.message || err.message || "Failed to upload payment QR code"
      );
    }
  }
);

export const removePaymentQrImageAction = createAsyncThunk(
  "vendorFinance/removePaymentQrImage",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.put("/vendor/payment-qr", { qrCodeUrl: "" });
      return response.data.data;
    } catch (err: any) {
      return rejectWithValue(
        err.response?.data?.message || err.message || "Failed to remove payment QR code"
      );
    }
  }
);

export const updateVendorDeliveryRadius = createAsyncThunk(
  "vendorFinance/updateVendorDeliveryRadius",
  async (deliveryRadiusKm: number, { rejectWithValue }) => {
    try {
      const response = await api.put("/vendor/delivery-radius", { deliveryRadiusKm });
      return response.data;
    } catch (err: any) {
      return rejectWithValue(
        err.response?.data?.message || err.message || "Failed to update delivery radius"
      );
    }
  }
);

export const updateVendorStoreStatus = createAsyncThunk(
  "vendorFinance/updateVendorStoreStatus",
  async (isStoreOpen: boolean, { rejectWithValue }) => {
    try {
      const response = await api.put("/vendor/store-status", { isStoreOpen });
      return response.data;
    } catch (err: any) {
      return rejectWithValue(
        err.response?.data?.message || err.message || "Failed to update store status"
      );
    }
  }
);

// ── Slice ────────────────────────────────────────────────────────────────────

const vendorFinanceSlice = createSlice({
  name: "vendorFinance",
  initialState,
  reducers: {
    // Real-Time Socket Emitters Handlers
    setNewOrderAlert: (state, action: PayloadAction<any>) => {
      state.newOrderAlert = action.payload;
      state.metrics.totalOrders += 1;
      state.metrics.pendingOrders += 1;
      // Prepend to recent orders
      if (action.payload) {
        state.recentOrders = [action.payload, ...state.recentOrders.slice(0, 4)];
      }
    },
    dismissNewOrderAlert: (state) => {
      state.newOrderAlert = null;
    },
    onNotificationReceived: (state, action: PayloadAction<any>) => {
      const notif = action.payload?.notification || action.payload;
      if (!notif || !notif._id) return;
      state.unreadCount = (state.unreadCount || 0) + 1;
      const currentList = Array.isArray(state.recentNotifications)
        ? state.recentNotifications.filter(Boolean)
        : [];
      state.recentNotifications = [
        notif,
        ...currentList.filter((n) => n && n._id !== notif._id).slice(0, 4),
      ];
      const fullList = Array.isArray(state.notifications)
        ? state.notifications.filter(Boolean)
        : [];
      state.notifications = [
        notif,
        ...fullList.filter((n) => n && n._id !== notif._id),
      ];
    },
    onCodUpdated: (state, action: PayloadAction<any>) => {
      if (action.payload?.codCashWithDeliveryBoys !== undefined) {
        state.metrics.codCashWithDeliveryBoys = action.payload.codCashWithDeliveryBoys;
      }
      if (action.payload?.remainingCodWithRiders !== undefined) {
        state.metrics.codCashWithDeliveryBoys = action.payload.remainingCodWithRiders;
      }
    },
    onWalletUpdated: (state, action: PayloadAction<any>) => {
      if (action.payload?.currentBalance !== undefined) {
        state.metrics.availableWithdrawalBalance = action.payload.currentBalance;
      }
      if (action.payload?.totalEarned !== undefined) {
        state.metrics.totalEarned = action.payload.totalEarned;
      }
      if (action.payload?.pendingSettlement !== undefined) {
        state.metrics.pendingSettlement = action.payload.pendingSettlement;
      }
    },
  },
  extraReducers: (builder) => {
    // Dashboard Stats
    builder
      .addCase(fetchDashboardStats.pending, (state) => {
        state.dashboardLoading = true;
        state.error = null;
      })
      .addCase(fetchDashboardStats.fulfilled, (state, action) => {
        state.dashboardLoading = false;
        state.metrics = action.payload.metrics || state.metrics;
        state.recentOrders = action.payload.recentOrders || [];
        state.recentNotifications = action.payload.recentNotifications || [];
        state.unreadCount = action.payload.unreadNotificationsCount ?? 0;
        if (action.payload.deliveryRadiusKm !== undefined) {
          state.deliveryRadiusKm = action.payload.deliveryRadiusKm;
        }
        if (action.payload.isStoreOpen !== undefined) {
          state.isStoreOpen = action.payload.isStoreOpen;
        }
        if (action.payload.shippingLocations) {
          state.shippingLocations = action.payload.shippingLocations;
        }
      })
      .addCase(fetchDashboardStats.rejected, (state, action) => {
        state.dashboardLoading = false;
        state.error = action.payload as string;
      });

    // Transactions
    builder
      .addCase(fetchTransactions.pending, (state) => {
        state.transactionsLoading = true;
      })
      .addCase(fetchTransactions.fulfilled, (state, action) => {
        state.transactionsLoading = false;
        state.transactions = action.payload.transactions || [];
        if (action.payload.wallet) {
          state.metrics.availableWithdrawalBalance = action.payload.wallet.withdrawableBalance;
          state.metrics.totalEarned = action.payload.wallet.totalEarned;
          state.metrics.pendingSettlement = action.payload.wallet.pendingSettlement;
          state.metrics.codCashWithDeliveryBoys = action.payload.wallet.codCashWithDeliveryBoys;
        }
      })
      .addCase(fetchTransactions.rejected, (state, action) => {
        state.transactionsLoading = false;
        state.error = action.payload as string;
      });

    // Withdrawal
    builder
      .addCase(requestWithdrawal.pending, (state) => {
        state.actionLoading = true;
      })
      .addCase(requestWithdrawal.fulfilled, (state, action) => {
        state.actionLoading = false;
        if (action.payload.data?.remainingBalance !== undefined) {
          state.metrics.availableWithdrawalBalance = action.payload.data.remainingBalance;
        }
      })
      .addCase(requestWithdrawal.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload as string;
      });

    // Notifications
    builder
      .addCase(fetchNotifications.pending, (state) => {
        state.notificationsLoading = true;
      })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.notificationsLoading = false;
        state.notifications = action.payload.notifications || [];
        state.unreadCount = action.payload.unreadCount ?? 0;
      })
      .addCase(fetchNotifications.rejected, (state, action) => {
        state.notificationsLoading = false;
        state.error = action.payload as string;
      });

    // Mark as read
    builder.addCase(markNotificationAsRead.fulfilled, (state, action) => {
      const updated = action.payload.notification;
      if (updated) {
        state.notifications = state.notifications.map((n) =>
          n._id === updated._id ? { ...n, isRead: true } : n
        );
        state.recentNotifications = state.recentNotifications.map((n) =>
          n._id === updated._id ? { ...n, isRead: true } : n
        );
      }
      state.unreadCount = action.payload.unreadCount ?? Math.max(0, state.unreadCount - 1);
    });

    // Mark all read
    builder.addCase(markAllNotificationsAsRead.fulfilled, (state) => {
      state.notifications = state.notifications.map((n) => ({ ...n, isRead: true }));
      state.recentNotifications = state.recentNotifications.map((n) => ({ ...n, isRead: true }));
      state.unreadCount = 0;
    });

    // COD Due
    builder
      .addCase(fetchCodDueRiders.pending, (state) => {
        state.codLoading = true;
      })
      .addCase(fetchCodDueRiders.fulfilled, (state, action) => {
        state.codLoading = false;
        state.codDueRiders = action.payload.ridersDue || [];
        state.recentHandovers = action.payload.recentHandovers || [];
        if (action.payload.totalCodPendingSubmission !== undefined) {
          state.metrics.codCashWithDeliveryBoys = action.payload.totalCodPendingSubmission;
        }
      })
      .addCase(fetchCodDueRiders.rejected, (state, action) => {
        state.codLoading = false;
        state.error = action.payload as string;
      });

    // Confirm Handover
    builder
      .addCase(confirmCodHandover.pending, (state) => {
        state.actionLoading = true;
      })
      .addCase(confirmCodHandover.fulfilled, (state, action) => {
        state.actionLoading = false;
        if (action.payload?.handover) {
          state.recentHandovers = [action.payload.handover, ...state.recentHandovers];
        }
        if (action.payload?.vendorCodPending !== undefined) {
          state.metrics.codCashWithDeliveryBoys = action.payload.vendorCodPending;
        }
      })
      .addCase(confirmCodHandover.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload as string;
      });

    // Payment QR
    builder
      .addCase(fetchPaymentQr.fulfilled, (state, action) => {
        state.paymentQr = action.payload;
      })
      .addCase(updatePaymentQr.fulfilled, (state, action) => {
        state.paymentQr = action.payload;
      })
      .addCase(uploadPaymentQrImageAction.pending, (state) => {
        state.qrLoading = true;
        state.error = null;
      })
      .addCase(uploadPaymentQrImageAction.fulfilled, (state, action) => {
        state.qrLoading = false;
        state.paymentQr = action.payload;
      })
      .addCase(uploadPaymentQrImageAction.rejected, (state, action) => {
        state.qrLoading = false;
        state.error = action.payload as string;
      })
      .addCase(removePaymentQrImageAction.pending, (state) => {
        state.qrLoading = true;
        state.error = null;
      })
      .addCase(removePaymentQrImageAction.fulfilled, (state, action) => {
        state.qrLoading = false;
        state.paymentQr = action.payload;
      })
      .addCase(removePaymentQrImageAction.rejected, (state, action) => {
        state.qrLoading = false;
        state.error = action.payload as string;
      });

    // Delivery Radius
    builder
      .addCase(updateVendorDeliveryRadius.pending, (state) => {
        state.actionLoading = true;
      })
      .addCase(updateVendorDeliveryRadius.fulfilled, (state, action) => {
        state.actionLoading = false;
        if (action.payload.deliveryRadiusKm !== undefined) {
          state.deliveryRadiusKm = action.payload.deliveryRadiusKm;
        }
      })
      .addCase(updateVendorDeliveryRadius.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload as string;
      });

    // Store Status
    builder
      .addCase(updateVendorStoreStatus.pending, (state) => {
        state.actionLoading = true;
      })
      .addCase(updateVendorStoreStatus.fulfilled, (state, action) => {
        state.actionLoading = false;
        if (action.payload.isStoreOpen !== undefined) {
          state.isStoreOpen = action.payload.isStoreOpen;
        }
      })
      .addCase(updateVendorStoreStatus.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const {
  setNewOrderAlert,
  dismissNewOrderAlert,
  onNotificationReceived,
  onCodUpdated,
  onWalletUpdated,
} = vendorFinanceSlice.actions;

export default vendorFinanceSlice.reducer;
