import storage from "@/utils/storage";
import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import deliveryService, {
  DeliveryLoginPayload,
  DeliveryRegisterPayload,
  DocumentUploadPayload,
} from "../services/deliveryService";

export interface DeliveryState {
  partner: any | null;
  isAuthenticated: boolean;
  isInitialized: boolean;
  token: string | null;
  availability: "ONLINE" | "OFFLINE" | "BUSY";
  canGoOnline: boolean;
  documentsVerified: boolean;
  activeOrder: any | null;
  offeredAssignment: any | null;
  earnings: {
    wallet: { currentBalance: number; totalEarned: number };
    today: { earnings: number; deliveriesCount: number };
    week: { earnings: number; deliveriesCount: number };
    transactions: any[];
  };
  securityDeposit: {
    status: "PENDING" | "PAID" | "REFUND_REQUESTED" | "REFUNDED";
    paidAmount: number;
    requiredAmount: number;
    history: any[];
  };
  documents: {
    summary: Record<string, string>;
    items: Record<string, any>;
  };
  loading: boolean;
  actionLoading: boolean;
  error: string | null;
}

const initialState: DeliveryState = {
  partner: null,
  isAuthenticated: false,
  isInitialized: false,
  token: null,
  availability: "OFFLINE",
  canGoOnline: false,
  documentsVerified: false,
  activeOrder: null,
  offeredAssignment: null,
  earnings: {
    wallet: { currentBalance: 0, totalEarned: 0 },
    today: { earnings: 0, deliveriesCount: 0 },
    week: { earnings: 0, deliveriesCount: 0 },
    transactions: [],
  },
  securityDeposit: {
    status: "PENDING",
    paidAmount: 0,
    requiredAmount: 1000,
    history: [],
  },
  documents: {
    summary: {},
    items: {},
  },
  loading: false,
  actionLoading: false,
  error: null,
};

// ── Async Thunks ───────────────────────────────────────────────────────

export const initializeDeliveryAuth = createAsyncThunk(
  "delivery/initializeAuth",
  async (_, { rejectWithValue }) => {
    try {
      const token = await storage.getItem("bhansa_delivery_token");
      if (!token) {
        return { isAuthenticated: false, partner: null, token: null };
      }
      const data = await deliveryService.getMe();
      return {
        isAuthenticated: true,
        partner: data.deliveryBoy,
        canGoOnline: data.canGoOnline,
        documentsVerified: data.documentsVerified,
        token,
      };
    } catch (error: any) {
      await storage.removeItem("bhansa_delivery_token");
      return rejectWithValue(error.message || "Failed to initialize delivery session");
    }
  }
);

export const registerDeliveryPartner = createAsyncThunk(
  "delivery/register",
  async (payload: DeliveryRegisterPayload, { rejectWithValue }) => {
    try {
      const res = await deliveryService.register(payload);
      if (res.token) {
        await storage.setItem("bhansa_delivery_token", res.token);
      }
      return res;
    } catch (error: any) {
      return rejectWithValue(error.message || "Registration failed");
    }
  }
);

export const loginDeliveryPartner = createAsyncThunk(
  "delivery/login",
  async (payload: DeliveryLoginPayload, { rejectWithValue }) => {
    try {
      const res = await deliveryService.login(payload);
      if (res.token) {
        await storage.setItem("bhansa_delivery_token", res.token);
      }
      return res;
    } catch (error: any) {
      return rejectWithValue(error.message || "Login failed");
    }
  }
);

export const fetchDeliveryProfile = createAsyncThunk(
  "delivery/fetchProfile",
  async (_, { rejectWithValue }) => {
    try {
      const res = await deliveryService.getMe();
      return res;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch profile");
    }
  }
);

export const togglePartnerAvailability = createAsyncThunk(
  "delivery/toggleAvailability",
  async (status: "ONLINE" | "OFFLINE" | undefined, { rejectWithValue }) => {
    try {
      const res = await deliveryService.toggleAvailability(status);
      return res;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to toggle availability");
    }
  }
);

export const fetchActiveAssignment = createAsyncThunk(
  "delivery/fetchActiveAssignment",
  async (_, { rejectWithValue }) => {
    try {
      const res = await deliveryService.getActiveAssignment();
      return res;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch active assignment");
    }
  }
);

export const acceptOfferedOrder = createAsyncThunk(
  "delivery/acceptOrder",
  async (assignmentId: string, { rejectWithValue }) => {
    try {
      const res = await deliveryService.acceptAssignment(assignmentId);
      return res;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to accept order");
    }
  }
);

export const rejectOfferedOrder = createAsyncThunk(
  "delivery/rejectOrder",
  async (
    { assignmentId, reason }: { assignmentId: string; reason?: string },
    { rejectWithValue }
  ) => {
    try {
      const res = await deliveryService.rejectAssignment(assignmentId, reason);
      return res;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to reject order");
    }
  }
);

export const markOrderArrivedStore = createAsyncThunk(
  "delivery/arrivedStore",
  async (orderId: string, { rejectWithValue }) => {
    try {
      const res = await deliveryService.markArrivedStore(orderId);
      return res;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to update arrival");
    }
  }
);

export const verifyOrderPickupOtp = createAsyncThunk(
  "delivery/verifyPickupOtp",
  async ({ orderId, otp }: { orderId: string; otp: string }, { rejectWithValue }) => {
    try {
      const res = await deliveryService.verifyPickupOtp(orderId, otp);
      return res;
    } catch (error: any) {
      return rejectWithValue(error.message || "Invalid Pickup OTP");
    }
  }
);

export const markOrderArrivedCustomer = createAsyncThunk(
  "delivery/arrivedCustomer",
  async (orderId: string, { rejectWithValue }) => {
    try {
      const res = await deliveryService.markArrivedCustomer(orderId);
      return res;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to update arrival");
    }
  }
);

export const verifyOrderDeliveryOtp = createAsyncThunk(
  "delivery/verifyDeliveryOtp",
  async ({ orderId, otp }: { orderId: string; otp: string }, { rejectWithValue }) => {
    try {
      const res = await deliveryService.verifyDeliveryOtp(orderId, otp);
      return res;
    } catch (error: any) {
      return rejectWithValue(error.message || "Invalid Delivery OTP");
    }
  }
);

export const cancelOrderDelivery = createAsyncThunk(
  "delivery/cancelOrderDelivery",
  async (
    { orderId, reason, notes }: { orderId: string; reason: string; notes?: string },
    { rejectWithValue }
  ) => {
    try {
      const res = await deliveryService.cancelDelivery(orderId, reason, notes);
      return res;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to cancel delivery");
    }
  }
);

export const fetchEarningsSummary = createAsyncThunk(
  "delivery/fetchEarnings",
  async (_, { rejectWithValue }) => {
    try {
      const res = await deliveryService.getEarningsSummary();
      return res;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch earnings");
    }
  }
);

export const fetchDepositStatus = createAsyncThunk(
  "delivery/fetchDeposit",
  async (_, { rejectWithValue }) => {
    try {
      const res = await deliveryService.getDepositStatus();
      return res;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch deposit status");
    }
  }
);

export const paySecurityDeposit = createAsyncThunk(
  "delivery/payDeposit",
  async (_, { rejectWithValue }) => {
    try {
      const initRes = await deliveryService.initiateDeposit("MockGateway");
      if (initRes.transactionId) {
        // Complete mock webhook payment
        const confirmRes = await deliveryService.simulateDepositWebhook(initRes.transactionId);
        return confirmRes;
      }
      return initRes;
    } catch (error: any) {
      return rejectWithValue(error.message || "Deposit payment failed");
    }
  }
);

export const submitDocument = createAsyncThunk(
  "delivery/submitDocument",
  async (payload: DocumentUploadPayload, { rejectWithValue }) => {
    try {
      const res = await deliveryService.uploadDocument(payload);
      return res;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to upload document");
    }
  }
);

export const fetchDocumentStatus = createAsyncThunk(
  "delivery/fetchDocumentStatus",
  async (_, { rejectWithValue }) => {
    try {
      const res = await deliveryService.getDocumentStatus();
      return res;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch document status");
    }
  }
);

export const logoutDeliveryPartner = createAsyncThunk(
  "delivery/logout",
  async () => {
    await storage.removeItem("bhansa_delivery_token");
    return true;
  }
);

// ── Slice Definition ───────────────────────────────────────────────────

export const deliverySlice = createSlice({
  name: "delivery",
  initialState,
  reducers: {
    setIncomingOffer: (state, action: PayloadAction<any>) => {
      state.offeredAssignment = action.payload;
    },
    clearIncomingOffer: (state) => {
      state.offeredAssignment = null;
    },
    updateActiveOrderStatus: (state, action: PayloadAction<string>) => {
      if (state.activeOrder) {
        state.activeOrder.orderStatus = action.payload;
      }
    },
    clearDeliveryError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // initializeDeliveryAuth
    builder
      .addCase(initializeDeliveryAuth.fulfilled, (state, action) => {
        state.isInitialized = true;
        state.isAuthenticated = action.payload.isAuthenticated;
        state.partner = action.payload.partner;
        state.token = action.payload.token;
        state.canGoOnline = !!action.payload.canGoOnline;
        state.documentsVerified = !!action.payload.documentsVerified;
        state.availability = action.payload.partner?.availability || "OFFLINE";
      })
      .addCase(initializeDeliveryAuth.rejected, (state) => {
        state.isInitialized = true;
        state.isAuthenticated = false;
        state.partner = null;
        state.token = null;
      });

    // registerDeliveryPartner
    builder
      .addCase(registerDeliveryPartner.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(registerDeliveryPartner.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.partner = action.payload.deliveryBoy;
        state.token = action.payload.token;
      })
      .addCase(registerDeliveryPartner.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // loginDeliveryPartner
    builder
      .addCase(loginDeliveryPartner.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginDeliveryPartner.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.partner = action.payload.deliveryBoy;
        state.token = action.payload.token;
        state.availability = action.payload.deliveryBoy?.availability || "OFFLINE";
      })
      .addCase(loginDeliveryPartner.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // fetchDeliveryProfile
    builder.addCase(fetchDeliveryProfile.fulfilled, (state, action) => {
      state.partner = action.payload.deliveryBoy;
      state.canGoOnline = !!action.payload.canGoOnline;
      state.documentsVerified = !!action.payload.documentsVerified;
      state.availability = action.payload.deliveryBoy?.availability || "OFFLINE";
    });

    // togglePartnerAvailability
    builder
      .addCase(togglePartnerAvailability.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(togglePartnerAvailability.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.availability = action.payload.availability;
      })
      .addCase(togglePartnerAvailability.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload as string;
      });

    // fetchActiveAssignment
    builder.addCase(fetchActiveAssignment.fulfilled, (state, action) => {
      state.activeOrder = action.payload.hasActiveOrder ? action.payload.order : null;
      if (state.activeOrder) {
        state.availability = "BUSY";
      }
    });

    // acceptOfferedOrder
    builder
      .addCase(acceptOfferedOrder.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(acceptOfferedOrder.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.offeredAssignment = null;
        state.availability = "BUSY";
      })
      .addCase(acceptOfferedOrder.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload as string;
      });

    // rejectOfferedOrder
    builder.addCase(rejectOfferedOrder.fulfilled, (state) => {
      state.offeredAssignment = null;
    });

    // verifyOrderPickupOtp
    builder
      .addCase(verifyOrderPickupOtp.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(verifyOrderPickupOtp.fulfilled, (state, action) => {
        state.actionLoading = false;
        if (state.activeOrder) {
          state.activeOrder.orderStatus = "OUT_FOR_DELIVERY";
          state.activeOrder.pickedUpAt = action.payload.pickedUpAt;
        }
      })
      .addCase(verifyOrderPickupOtp.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload as string;
      });

    // verifyOrderDeliveryOtp
    builder
      .addCase(verifyOrderDeliveryOtp.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(verifyOrderDeliveryOtp.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.activeOrder = null;
        state.availability = "ONLINE";
        state.earnings.wallet.currentBalance = action.payload.walletBalance;
      })
      .addCase(verifyOrderDeliveryOtp.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload as string;
      });

    // cancelOrderDelivery
    builder
      .addCase(cancelOrderDelivery.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(cancelOrderDelivery.fulfilled, (state) => {
        state.actionLoading = false;
        state.activeOrder = null;
        state.availability = "ONLINE";
      })
      .addCase(cancelOrderDelivery.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload as string;
      });

    // fetchEarningsSummary
    builder.addCase(fetchEarningsSummary.fulfilled, (state, action) => {
      state.earnings = {
        wallet: action.payload.wallet || { currentBalance: 0, totalEarned: 0 },
        today: action.payload.today || { earnings: 0, deliveriesCount: 0 },
        week: action.payload.week || { earnings: 0, deliveriesCount: 0 },
        transactions: action.payload.transactions || [],
      };
    });

    // fetchDepositStatus
    builder.addCase(fetchDepositStatus.fulfilled, (state, action) => {
      state.securityDeposit = {
        status: action.payload.securityDeposit?.status || "PENDING",
        paidAmount: action.payload.securityDeposit?.paidAmount || 0,
        requiredAmount: action.payload.securityDeposit?.requiredAmount || 1000,
        history: action.payload.history || [],
      };
    });

    // paySecurityDeposit
    builder
      .addCase(paySecurityDeposit.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(paySecurityDeposit.fulfilled, (state) => {
        state.actionLoading = false;
        state.securityDeposit.status = "PAID";
        state.securityDeposit.paidAmount = 1000;
      })
      .addCase(paySecurityDeposit.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload as string;
      });

    // submitDocument & fetchDocumentStatus
    builder.addCase(fetchDocumentStatus.fulfilled, (state, action) => {
      state.documents = {
        summary: action.payload.summary || {},
        items: action.payload.documents || {},
      };
      state.documentsVerified = !!action.payload.allVerified;
    });

    builder.addCase(submitDocument.fulfilled, (state, action) => {
      state.documentsVerified = !!action.payload.allVerified;
      state.documents.items = action.payload.documents || {};
    });

    // logoutDeliveryPartner
    builder.addCase(logoutDeliveryPartner.fulfilled, (state) => {
      state.isAuthenticated = false;
      state.partner = null;
      state.token = null;
      state.activeOrder = null;
      state.offeredAssignment = null;
      state.availability = "OFFLINE";
    });
  },
});

export const {
  setIncomingOffer,
  clearIncomingOffer,
  updateActiveOrderStatus,
  clearDeliveryError,
} = deliverySlice.actions;

export default deliverySlice.reducer;
