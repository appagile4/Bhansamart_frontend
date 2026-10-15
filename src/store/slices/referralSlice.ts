import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import {
  referralService,
  ReferralSummary,
  ReferredHistoryItem,
  WalletSummary,
  RewardTransactionItem,
  CustomerNotificationItem,
} from "../services/referralService";

export interface ReferralState {
  summary: ReferralSummary | null;
  summaryLoading: boolean;

  history: ReferredHistoryItem[];
  historyTotal: number;
  historyPage: number;
  historyTotalPages: number;
  historyLoading: boolean;

  wallet: WalletSummary | null;
  walletLoading: boolean;

  transactions: RewardTransactionItem[];
  transactionsTotal: number;
  transactionsPage: number;
  transactionsTotalPages: number;
  transactionsLoading: boolean;

  notifications: CustomerNotificationItem[];
  unreadNotificationsCount: number;
  notificationsLoading: boolean;

  error: string | null;
}

const initialState: ReferralState = {
  summary: null,
  summaryLoading: false,

  history: [],
  historyTotal: 0,
  historyPage: 1,
  historyTotalPages: 1,
  historyLoading: false,

  wallet: null,
  walletLoading: false,

  transactions: [],
  transactionsTotal: 0,
  transactionsPage: 1,
  transactionsTotalPages: 1,
  transactionsLoading: false,

  notifications: [],
  unreadNotificationsCount: 0,
  notificationsLoading: false,

  error: null,
};

// ── Async Thunks ─────────────────────────────────────────────────────────────

export const fetchMyReferral = createAsyncThunk(
  "referral/fetchMyReferral",
  async (_, { rejectWithValue }) => {
    try {
      return await referralService.getMyReferral();
    } catch (err: any) {
      return rejectWithValue(
        err.response?.data?.message || err.message || "Failed to load referral summary"
      );
    }
  }
);

export const fetchMyReferralsHistory = createAsyncThunk(
  "referral/fetchMyReferralsHistory",
  async (params: { page?: number; limit?: number } | undefined, { rejectWithValue }) => {
    try {
      const page = params?.page || 1;
      const limit = params?.limit || 20;
      return await referralService.getMyReferralsHistory(page, limit);
    } catch (err: any) {
      return rejectWithValue(
        err.response?.data?.message || err.message || "Failed to load referrals history"
      );
    }
  }
);

export const fetchRewardsWallet = createAsyncThunk(
  "referral/fetchRewardsWallet",
  async (_, { rejectWithValue }) => {
    try {
      return await referralService.getRewardsWallet();
    } catch (err: any) {
      return rejectWithValue(
        err.response?.data?.message || err.message || "Failed to load rewards wallet"
      );
    }
  }
);

export const fetchRewardTransactions = createAsyncThunk(
  "referral/fetchRewardTransactions",
  async (
    params: { page?: number; limit?: number; type?: string } | undefined,
    { rejectWithValue }
  ) => {
    try {
      const page = params?.page || 1;
      const limit = params?.limit || 20;
      return await referralService.getRewardTransactions(page, limit, params?.type);
    } catch (err: any) {
      return rejectWithValue(
        err.response?.data?.message || err.message || "Failed to load reward transactions"
      );
    }
  }
);

export const fetchCustomerNotifications = createAsyncThunk(
  "referral/fetchCustomerNotifications",
  async (
    params: { page?: number; limit?: number; isRead?: boolean } | undefined,
    { rejectWithValue }
  ) => {
    try {
      const page = params?.page || 1;
      const limit = params?.limit || 20;
      return await referralService.getCustomerNotifications(page, limit, params?.isRead);
    } catch (err: any) {
      return rejectWithValue(
        err.response?.data?.message || err.message || "Failed to load notifications"
      );
    }
  }
);

export const markCustomerNotificationRead = createAsyncThunk(
  "referral/markNotificationRead",
  async (id: string, { rejectWithValue }) => {
    try {
      return await referralService.markNotificationRead(id);
    } catch (err: any) {
      return rejectWithValue(
        err.response?.data?.message || err.message || "Failed to mark notification read"
      );
    }
  }
);

export const markAllCustomerNotificationsRead = createAsyncThunk(
  "referral/markAllNotificationsRead",
  async (_, { rejectWithValue }) => {
    try {
      return await referralService.markAllNotificationsRead();
    } catch (err: any) {
      return rejectWithValue(
        err.response?.data?.message || err.message || "Failed to mark all as read"
      );
    }
  }
);

// ── Slice ────────────────────────────────────────────────────────────────────

export const referralSlice = createSlice({
  name: "referral",
  initialState,
  reducers: {
    clearReferralError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // ── My Referral Summary ──
    builder
      .addCase(fetchMyReferral.pending, (state) => {
        state.summaryLoading = true;
        state.error = null;
      })
      .addCase(fetchMyReferral.fulfilled, (state, action) => {
        state.summaryLoading = false;
        state.summary = action.payload;
      })
      .addCase(fetchMyReferral.rejected, (state, action) => {
        state.summaryLoading = false;
        state.error = action.payload as string;
      });

    // ── Referrals History ──
    builder
      .addCase(fetchMyReferralsHistory.pending, (state) => {
        state.historyLoading = true;
      })
      .addCase(fetchMyReferralsHistory.fulfilled, (state, action) => {
        state.historyLoading = false;
        state.history = action.payload.data;
        state.historyTotal = action.payload.total;
        state.historyPage = action.payload.currentPage;
        state.historyTotalPages = action.payload.totalPages;
      })
      .addCase(fetchMyReferralsHistory.rejected, (state, action) => {
        state.historyLoading = false;
        state.error = action.payload as string;
      });

    // ── Rewards Wallet ──
    builder
      .addCase(fetchRewardsWallet.pending, (state) => {
        state.walletLoading = true;
      })
      .addCase(fetchRewardsWallet.fulfilled, (state, action) => {
        state.walletLoading = false;
        state.wallet = action.payload;
      })
      .addCase(fetchRewardsWallet.rejected, (state, action) => {
        state.walletLoading = false;
        state.error = action.payload as string;
      });

    // ── Reward Transactions ──
    builder
      .addCase(fetchRewardTransactions.pending, (state) => {
        state.transactionsLoading = true;
      })
      .addCase(fetchRewardTransactions.fulfilled, (state, action) => {
        state.transactionsLoading = false;
        state.transactions = action.payload.data;
        state.transactionsTotal = action.payload.total;
        state.transactionsPage = action.payload.currentPage;
        state.transactionsTotalPages = action.payload.totalPages;
      })
      .addCase(fetchRewardTransactions.rejected, (state, action) => {
        state.transactionsLoading = false;
        state.error = action.payload as string;
      });

    // ── Notifications ──
    builder
      .addCase(fetchCustomerNotifications.pending, (state) => {
        state.notificationsLoading = true;
      })
      .addCase(fetchCustomerNotifications.fulfilled, (state, action) => {
        state.notificationsLoading = false;
        state.notifications = action.payload.data;
        state.unreadNotificationsCount = action.payload.unreadCount;
      })
      .addCase(fetchCustomerNotifications.rejected, (state, action) => {
        state.notificationsLoading = false;
        state.error = action.payload as string;
      });

    builder.addCase(markCustomerNotificationRead.fulfilled, (state, action) => {
      const idx = state.notifications.findIndex((n) => n._id === action.payload._id);
      if (idx !== -1) {
        state.notifications[idx].isRead = true;
      }
      state.unreadNotificationsCount = Math.max(
        0,
        state.unreadNotificationsCount - 1
      );
    });

    builder.addCase(markAllCustomerNotificationsRead.fulfilled, (state) => {
      state.notifications.forEach((n) => {
        n.isRead = true;
      });
      state.unreadNotificationsCount = 0;
    });
  },
});

export const { clearReferralError } = referralSlice.actions;
export default referralSlice.reducer;
