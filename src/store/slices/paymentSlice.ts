import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import {
  addCardApi,
  addNetbankingApi,
  CardItem,
  deletePaymentMethodApi,
  fetchPaymentMethodsApi,
  linkWalletApi,
  NetbankingItem,
  PaymentMethodsData,
  unlinkWalletApi,
  WalletItem,
} from "../services/paymentService";

export interface PaymentState {
  cards: CardItem[];
  wallets: WalletItem[];
  netbanking: NetbankingItem[];
  loading: boolean;
  actionLoading: boolean;
  error: string | null;
  initialized: boolean;
}

const initialState: PaymentState = {
  cards: [],
  wallets: [],
  netbanking: [],
  loading: false,
  actionLoading: false,
  error: null,
  initialized: false,
};

/**
 * Fetch all saved payment methods
 */
export const fetchPaymentMethods = createAsyncThunk<
  PaymentMethodsData,
  void,
  { rejectValue: string }
>("payment/fetchPaymentMethods", async (_, { rejectWithValue }) => {
  try {
    const res = await fetchPaymentMethodsApi();
    if (res.success && res.data) {
      return res.data;
    }
    return rejectWithValue(res.message || "Failed to load payment methods");
  } catch (err: any) {
    return rejectWithValue(
      err.response?.data?.message || err.message || "Failed to load payment methods"
    );
  }
});

/**
 * Add a card
 */
export const addCard = createAsyncThunk<
  CardItem,
  {
    cardHolderName: string;
    cardNumber: string;
    expiryDate: string;
    nicknameType?: "Personal" | "Business" | "Other";
  },
  { rejectValue: string }
>("payment/addCard", async (payload, { rejectWithValue }) => {
  try {
    const res = await addCardApi(payload);
    if (res.success && res.data) {
      return res.data;
    }
    return rejectWithValue(res.message || "Failed to add card");
  } catch (err: any) {
    return rejectWithValue(
      err.response?.data?.message || err.message || "Failed to add card"
    );
  }
});

/**
 * Link wallet (eSewa / Khalti)
 */
export const linkWallet = createAsyncThunk<
  WalletItem,
  {
    walletType: "esewa" | "khalti";
    accountIdentifier: string;
  },
  { rejectValue: string }
>("payment/linkWallet", async (payload, { rejectWithValue }) => {
  try {
    const res = await linkWalletApi(payload);
    if (res.success && res.data) {
      return res.data;
    }
    return rejectWithValue(res.message || "Failed to link wallet");
  } catch (err: any) {
    return rejectWithValue(
      err.response?.data?.message || err.message || "Failed to link wallet"
    );
  }
});

/**
 * Unlink wallet
 */
export const unlinkWallet = createAsyncThunk<
  "esewa" | "khalti",
  "esewa" | "khalti",
  { rejectValue: string }
>("payment/unlinkWallet", async (walletType, { rejectWithValue }) => {
  try {
    const res = await unlinkWalletApi(walletType);
    if (res.success) {
      return walletType;
    }
    return rejectWithValue(res.message || "Failed to unlink wallet");
  } catch (err: any) {
    return rejectWithValue(
      err.response?.data?.message || err.message || "Failed to unlink wallet"
    );
  }
});

/**
 * Add Netbanking bank
 */
export const addNetbanking = createAsyncThunk<
  NetbankingItem,
  {
    bankId: string;
    bankName: string;
    shortCode?: string;
  },
  { rejectValue: string }
>("payment/addNetbanking", async (payload, { rejectWithValue }) => {
  try {
    const res = await addNetbankingApi(payload);
    if (res.success && res.data) {
      return res.data;
    }
    return rejectWithValue(res.message || "Failed to add netbanking");
  } catch (err: any) {
    return rejectWithValue(
      err.response?.data?.message || err.message || "Failed to add netbanking"
    );
  }
});

/**
 * Delete payment method by ID (card or netbanking)
 */
export const deletePaymentMethod = createAsyncThunk<
  string,
  string,
  { rejectValue: string }
>("payment/deletePaymentMethod", async (id, { rejectWithValue }) => {
  try {
    const res = await deletePaymentMethodApi(id);
    if (res.success) {
      return id;
    }
    return rejectWithValue(res.message || "Failed to delete payment method");
  } catch (err: any) {
    return rejectWithValue(
      err.response?.data?.message || err.message || "Failed to delete payment method"
    );
  }
});

export const paymentSlice = createSlice({
  name: "payment",
  initialState,
  reducers: {
    clearPaymentError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // fetchPaymentMethods
    builder.addCase(fetchPaymentMethods.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchPaymentMethods.fulfilled, (state, action) => {
      state.loading = false;
      state.initialized = true;
      state.cards = action.payload.cards || [];
      state.wallets = action.payload.wallets || [];
      state.netbanking = action.payload.netbanking || [];
    });
    builder.addCase(fetchPaymentMethods.rejected, (state, action) => {
      state.loading = false;
      state.initialized = true;
      state.error = action.payload || "Failed to load payment methods";
    });

    // addCard
    builder.addCase(addCard.pending, (state) => {
      state.actionLoading = true;
      state.error = null;
    });
    builder.addCase(addCard.fulfilled, (state, action) => {
      state.actionLoading = false;
      state.cards = [action.payload, ...state.cards];
    });
    builder.addCase(addCard.rejected, (state, action) => {
      state.actionLoading = false;
      state.error = action.payload || "Failed to add card";
    });

    // linkWallet
    builder.addCase(linkWallet.pending, (state) => {
      state.actionLoading = true;
      state.error = null;
    });
    builder.addCase(linkWallet.fulfilled, (state, action) => {
      state.actionLoading = false;
      const index = state.wallets.findIndex(
        (w) => w.walletType === action.payload.walletType
      );
      if (index >= 0) {
        state.wallets[index] = action.payload;
      } else {
        state.wallets.push(action.payload);
      }
    });
    builder.addCase(linkWallet.rejected, (state, action) => {
      state.actionLoading = false;
      state.error = action.payload || "Failed to link wallet";
    });

    // unlinkWallet
    builder.addCase(unlinkWallet.pending, (state) => {
      state.actionLoading = true;
      state.error = null;
    });
    builder.addCase(unlinkWallet.fulfilled, (state, action) => {
      state.actionLoading = false;
      state.wallets = state.wallets.filter((w) => w.walletType !== action.payload);
    });
    builder.addCase(unlinkWallet.rejected, (state, action) => {
      state.actionLoading = false;
      state.error = action.payload || "Failed to unlink wallet";
    });

    // addNetbanking
    builder.addCase(addNetbanking.pending, (state) => {
      state.actionLoading = true;
      state.error = null;
    });
    builder.addCase(addNetbanking.fulfilled, (state, action) => {
      state.actionLoading = false;
      // Replace if bankId exists, or add
      const index = state.netbanking.findIndex(
        (b) => b.bankId === action.payload.bankId
      );
      if (index >= 0) {
        state.netbanking[index] = action.payload;
      } else {
        state.netbanking.push(action.payload);
      }
    });
    builder.addCase(addNetbanking.rejected, (state, action) => {
      state.actionLoading = false;
      state.error = action.payload || "Failed to add netbanking";
    });

    // deletePaymentMethod
    builder.addCase(deletePaymentMethod.pending, (state) => {
      state.actionLoading = true;
      state.error = null;
    });
    builder.addCase(deletePaymentMethod.fulfilled, (state, action) => {
      state.actionLoading = false;
      state.cards = state.cards.filter((c) => c._id !== action.payload);
      state.netbanking = state.netbanking.filter((b) => b._id !== action.payload);
    });
    builder.addCase(deletePaymentMethod.rejected, (state, action) => {
      state.actionLoading = false;
      state.error = action.payload || "Failed to delete payment method";
    });
  },
});

export const { clearPaymentError } = paymentSlice.actions;
export default paymentSlice.reducer;
