import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import {
  fetchAdminDashboardStatsApi,
  fetchAdminDashboardChartsApi,
  fetchAdminVendorsApi,
  fetchAdminVendorDetailsApi,
  updateAdminVendorVerificationApi,
  fetchAdminAdminsApi,
  createAdminAccountApi,
  updateAdminAccountApi,
  fetchAdminCustomersApi,
  fetchAdminDeliveryBoysApi,
  fetchAdminCategoriesApi,
  createAdminCategoryApi,
  updateAdminCategoryApi,
  fetchAdminProductsApi,
  moderateAdminProductApi,
  fetchAdminTransactionsApi,
  fetchAdminWithdrawalsApi,
  reviewAdminWithdrawalApi,
  fetchPlatformPaymentConfigApi,
  updatePlatformPaymentConfigApi,
  fetchAdminTicketsApi,
  fetchAdminTicketDetailsApi,
  replyAdminTicketApi,
  sendAdminTargetedNotificationApi,
  fetchAdminLiveMapDataApi,
  fetchAdminAuditLogsApi,
} from "../services/adminService";

export interface AdminState {
  stats: any | null;
  charts: any | null;
  vendors: any[];
  vendorsTotal: number;
  currentVendor: any | null;
  admins: any[];
  customers: any[];
  customersTotal: number;
  deliveryBoys: any[];
  categories: {
    all: any[];
    root: any[];
    subs: any[];
  };
  products: any[];
  productsTotal: number;
  transactions: any[];
  transactionsTotal: number;
  withdrawals: any[];
  paymentConfig: any | null;
  tickets: any[];
  ticketsTotal: number;
  currentTicket: any | null;
  mapData: {
    vendors: any[];
    riders: any[];
  };
  auditLogs: any[];
  auditLogsTotal: number;
  loading: boolean;
  actionLoading: boolean;
  error: string | null;
}

const initialState: AdminState = {
  stats: null,
  charts: null,
  vendors: [],
  vendorsTotal: 0,
  currentVendor: null,
  admins: [],
  customers: [],
  customersTotal: 0,
  deliveryBoys: [],
  categories: { all: [], root: [], subs: [] },
  products: [],
  productsTotal: 0,
  transactions: [],
  transactionsTotal: 0,
  withdrawals: [],
  paymentConfig: null,
  tickets: [],
  ticketsTotal: 0,
  currentTicket: null,
  mapData: { vendors: [], riders: [] },
  auditLogs: [],
  auditLogsTotal: 0,
  loading: false,
  actionLoading: false,
  error: null,
};

// ── Async Thunks ──────────────────────────────────────────────────────

export const fetchAdminDashboardStats = createAsyncThunk(
  "admin/fetchStats",
  async (params?: { timeframe?: string; startDate?: string; endDate?: string }) => {
    const res = await fetchAdminDashboardStatsApi(params);
    return res.data;
  }
);

export const fetchAdminDashboardCharts = createAsyncThunk(
  "admin/fetchCharts",
  async (days: number = 7) => {
    const res = await fetchAdminDashboardChartsApi(days);
    return res.data;
  }
);

export const fetchAdminVendors = createAsyncThunk(
  "admin/fetchVendors",
  async (params?: any) => {
    const res = await fetchAdminVendorsApi(params);
    return res;
  }
);

export const fetchAdminVendorDetails = createAsyncThunk(
  "admin/fetchVendorDetails",
  async (id: string) => {
    const res = await fetchAdminVendorDetailsApi(id);
    return res.data;
  }
);

export const updateAdminVendorVerification = createAsyncThunk(
  "admin/updateVendorVerification",
  async ({ id, verificationStatus, reason }: { id: string; verificationStatus: string; reason?: string }) => {
    const res = await updateAdminVendorVerificationApi(id, { verificationStatus, reason });
    return res.data;
  }
);

export const fetchAdminAdmins = createAsyncThunk(
  "admin/fetchAdmins",
  async () => {
    const res = await fetchAdminAdminsApi();
    return res.data;
  }
);

export const createAdminAccount = createAsyncThunk(
  "admin/createAdmin",
  async (payload: any) => {
    const res = await createAdminAccountApi(payload);
    return res.data;
  }
);

export const updateAdminAccount = createAsyncThunk(
  "admin/updateAdmin",
  async ({ id, payload }: { id: string; payload: any }) => {
    const res = await updateAdminAccountApi(id, payload);
    return res.data;
  }
);

export const fetchAdminCustomers = createAsyncThunk(
  "admin/fetchCustomers",
  async (params?: any) => {
    const res = await fetchAdminCustomersApi(params);
    return res;
  }
);

export const fetchAdminDeliveryBoys = createAsyncThunk(
  "admin/fetchDeliveryBoys",
  async (params?: any) => {
    const res = await fetchAdminDeliveryBoysApi(params);
    return res.data;
  }
);

export const fetchAdminCategories = createAsyncThunk(
  "admin/fetchCategories",
  async () => {
    const res = await fetchAdminCategoriesApi();
    return res.data;
  }
);

export const createAdminCategory = createAsyncThunk(
  "admin/createCategory",
  async (payload: any) => {
    const res = await createAdminCategoryApi(payload);
    return res.data;
  }
);

export const updateAdminCategory = createAsyncThunk(
  "admin/updateCategory",
  async ({ id, payload }: { id: string; payload: any }) => {
    const res = await updateAdminCategoryApi(id, payload);
    return res.data;
  }
);

export const fetchAdminProducts = createAsyncThunk(
  "admin/fetchProducts",
  async (params?: any) => {
    const res = await fetchAdminProductsApi(params);
    return res;
  }
);

export const moderateAdminProduct = createAsyncThunk(
  "admin/moderateProduct",
  async ({ id, payload }: { id: string; payload: any }) => {
    const res = await moderateAdminProductApi(id, payload);
    return res.data;
  }
);

export const fetchAdminTransactions = createAsyncThunk(
  "admin/fetchTransactions",
  async (params?: any) => {
    const res = await fetchAdminTransactionsApi(params);
    return res;
  }
);

export const fetchAdminWithdrawals = createAsyncThunk(
  "admin/fetchWithdrawals",
  async (params?: any) => {
    const res = await fetchAdminWithdrawalsApi(params);
    return res.data;
  }
);

export const reviewAdminWithdrawal = createAsyncThunk(
  "admin/reviewWithdrawal",
  async ({ id, action, payoutReference, reason }: { id: string; action: "APPROVE" | "REJECT"; payoutReference?: string; reason?: string }) => {
    const res = await reviewAdminWithdrawalApi(id, { action, payoutReference, reason });
    return res.data;
  }
);

export const fetchPlatformPaymentConfig = createAsyncThunk(
  "admin/fetchPaymentConfig",
  async () => {
    const res = await fetchPlatformPaymentConfigApi();
    return res.data;
  }
);

export const updatePlatformPaymentConfig = createAsyncThunk(
  "admin/updatePaymentConfig",
  async (payload: any) => {
    const res = await updatePlatformPaymentConfigApi(payload);
    return res.data;
  }
);

export const fetchAdminTickets = createAsyncThunk(
  "admin/fetchTickets",
  async (params?: any) => {
    const res = await fetchAdminTicketsApi(params);
    return res;
  }
);

export const fetchAdminTicketDetails = createAsyncThunk(
  "admin/fetchTicketDetails",
  async (id: string) => {
    const res = await fetchAdminTicketDetailsApi(id);
    return res.data;
  }
);

export const replyAdminTicket = createAsyncThunk(
  "admin/replyTicket",
  async ({ id, message, status }: { id: string; message: string; status?: string }) => {
    const res = await replyAdminTicketApi(id, { message, status });
    return res.data;
  }
);

export const sendAdminTargetedNotification = createAsyncThunk(
  "admin/sendNotification",
  async (payload: any) => {
    const res = await sendAdminTargetedNotificationApi(payload);
    return res.data;
  }
);

export const fetchAdminLiveMapData = createAsyncThunk(
  "admin/fetchMapData",
  async () => {
    const res = await fetchAdminLiveMapDataApi();
    return res.data;
  }
);

export const fetchAdminAuditLogs = createAsyncThunk(
  "admin/fetchAuditLogs",
  async (params?: any) => {
    const res = await fetchAdminAuditLogsApi(params);
    return res;
  }
);

export const adminSlice = createSlice({
  name: "admin",
  initialState,
  reducers: {
    clearCurrentVendor: (state) => {
      state.currentVendor = null;
    },
    clearCurrentTicket: (state) => {
      state.currentTicket = null;
    },
  },
  extraReducers: (builder) => {
    // Stats
    builder.addCase(fetchAdminDashboardStats.pending, (state) => {
      state.loading = true;
    });
    builder.addCase(fetchAdminDashboardStats.fulfilled, (state, action) => {
      state.loading = false;
      state.stats = action.payload;
    });
    builder.addCase(fetchAdminDashboardStats.rejected, (state, action) => {
      state.loading = false;
      state.error = action.error.message || null;
    });

    // Charts
    builder.addCase(fetchAdminDashboardCharts.fulfilled, (state, action) => {
      state.charts = action.payload;
    });

    // Vendors
    builder.addCase(fetchAdminVendors.fulfilled, (state, action) => {
      const page = action.payload.currentPage || (action as any).meta?.arg?.page || 1;
      if (page > 1) {
        const existingIds = new Set(state.vendors.map((v) => v._id));
        const newVendors = (action.payload.data || []).filter(
          (v: any) => !existingIds.has(v._id),
        );
        state.vendors = [...state.vendors, ...newVendors];
      } else {
        state.vendors = action.payload.data || [];
      }
      state.vendorsTotal = action.payload.total ?? state.vendors.length;
    });
    builder.addCase(fetchAdminVendorDetails.fulfilled, (state, action) => {
      state.currentVendor = action.payload;
    });
    builder.addCase(updateAdminVendorVerification.fulfilled, (state, action) => {
      const updated = action.payload;
      const idx = state.vendors.findIndex((v) => v._id === updated._id);
      if (idx !== -1) state.vendors[idx] = { ...state.vendors[idx], ...updated };
      if (state.currentVendor?.vendor?._id === updated._id) {
        state.currentVendor.vendor = { ...state.currentVendor.vendor, ...updated };
      }
    });

    // Admins
    builder.addCase(fetchAdminAdmins.fulfilled, (state, action) => {
      state.admins = action.payload;
    });
    builder.addCase(createAdminAccount.fulfilled, (state, action) => {
      state.admins.unshift(action.payload);
    });

    // Customers
    builder.addCase(fetchAdminCustomers.fulfilled, (state, action) => {
      const page = (action as any).meta?.arg?.page || action.payload.currentPage || 1;
      const incoming = action.payload.data || [];
      if (page > 1) {
        const existingIds = new Set(state.customers.map((c) => c._id));
        const uniqueIncoming = incoming.filter((c: any) => !existingIds.has(c._id));
        state.customers = [...state.customers, ...uniqueIncoming];
      } else {
        state.customers = incoming;
      }
      state.customersTotal = action.payload.total ?? state.customers.length;
    });

    // Delivery Boys
    builder.addCase(fetchAdminDeliveryBoys.fulfilled, (state, action) => {
      state.deliveryBoys = action.payload;
    });

    // Categories
    builder.addCase(fetchAdminCategories.fulfilled, (state, action) => {
      state.categories = action.payload;
    });

    // Products
    builder.addCase(fetchAdminProducts.fulfilled, (state, action) => {
      const page = action.meta.arg?.page || 1;
      const incoming = action.payload.data || [];
      if (page > 1) {
        const existingIds = new Set(state.products.map((p) => p._id));
        const uniqueIncoming = incoming.filter((p: any) => !existingIds.has(p._id));
        state.products = [...state.products, ...uniqueIncoming];
      } else {
        state.products = incoming;
      }
      state.productsTotal = action.payload.total || 0;
    });

    // Transactions
    builder.addCase(fetchAdminTransactions.fulfilled, (state, action) => {
      const page = (action as any).meta?.arg?.page || action.payload.currentPage || 1;
      const incoming = action.payload.data || [];
      if (page > 1) {
        const existingIds = new Set(state.transactions.map((t) => t._id));
        const uniqueIncoming = incoming.filter((t: any) => !existingIds.has(t._id));
        state.transactions = [...state.transactions, ...uniqueIncoming];
      } else {
        state.transactions = incoming;
      }
      state.transactionsTotal = action.payload.total ?? state.transactions.length;
    });

    // Withdrawals
    builder.addCase(fetchAdminWithdrawals.fulfilled, (state, action) => {
      state.withdrawals = action.payload;
    });
    builder.addCase(reviewAdminWithdrawal.fulfilled, (state, action) => {
      const updated = action.payload;
      state.withdrawals = state.withdrawals.filter((w) => w._id !== updated._id);
    });

    // Payment Config
    builder.addCase(fetchPlatformPaymentConfig.fulfilled, (state, action) => {
      state.paymentConfig = action.payload;
    });
    builder.addCase(updatePlatformPaymentConfig.fulfilled, (state, action) => {
      state.paymentConfig = action.payload;
    });

    // Tickets
    builder.addCase(fetchAdminTickets.fulfilled, (state, action) => {
      state.tickets = action.payload.data;
      state.ticketsTotal = action.payload.total;
    });
    builder.addCase(fetchAdminTicketDetails.fulfilled, (state, action) => {
      state.currentTicket = action.payload;
    });
    builder.addCase(replyAdminTicket.fulfilled, (state, action) => {
      state.currentTicket = action.payload;
    });

    // Map Data
    builder.addCase(fetchAdminLiveMapData.fulfilled, (state, action) => {
      state.mapData = action.payload;
    });

    // Audit Logs
    builder.addCase(fetchAdminAuditLogs.fulfilled, (state, action) => {
      state.auditLogs = action.payload.data;
      state.auditLogsTotal = action.payload.total;
    });
  },
});

export const { clearCurrentVendor, clearCurrentTicket } = adminSlice.actions;

export default adminSlice.reducer;
