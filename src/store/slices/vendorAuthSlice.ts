import storage from "@/utils/storage";
import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import {
  vendorAuthService,
  VendorLoginPayload,
  VendorRegisterPayload,
  VendorSendOTPPayload,
  VendorVerifyOTPPayload,
} from "../services/vendorAuthService";

export interface VendorProfile {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  role: string;
  status: string;
}

export interface VendorDetails {
  _id?: string;
  businessDetails?: {
    businessName?: string;
    businessType?: string;
    gstNumber?: string;
    panNumber?: string;
    businessEmail?: string;
    businessPhone?: string;
    yearEstablished?: number | string;
    numberOfEmployees?: number | string;
    categories?: string[];
    retailChannel?: string;
  };
  sellerDetails?: {
    sellerName?: string;
    sellerEmail?: string;
    sellerPhone?: string;
    address?: string;
    city?: string;
    state?: string;
    pincode?: string;
  };
  brandDetails?: {
    brandName?: string;
    brandType?: string;
    trademarkNumber?: string;
    brandWebsite?: string;
    brandLogo?: string;
  };
  bankDetails?: {
    accountHolderName?: string;
    accountNumber?: string;
    ifscCode?: string;
    bankName?: string;
    branch?: string;
  };
  shippingLocations?: {
    warehouseAddress?: string;
    city?: string;
    state?: string;
    pincode?: string;
    latitude?: number | string;
    longitude?: number | string;
  };
  kycDetails?: {
    avatarUrl?: string;
    documents?: {
      aadhaar?: string;
      drivingLicence?: string;
    };
  };
  status?: string;
}

export interface VendorAuthState {
  vendorUser: VendorProfile | null;
  vendorDetails: VendorDetails | null;
  token: string | null;
  isVendorAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  successMessage: string | null;
  otpSent: boolean;
  otpEmail: string | null;
}

const initialState: VendorAuthState = {
  vendorUser: null,
  vendorDetails: null,
  token: null,
  isVendorAuthenticated: false,
  isLoading: false,
  error: null,
  successMessage: null,
  otpSent: false,
  otpEmail: null,
};

// Initialize Vendor Session
export const initializeVendorAuth = createAsyncThunk(
  "vendorAuth/initialize",
  async (_, { rejectWithValue }) => {
    try {
      const storedToken = await storage.getItem("bhansa_vendor_token");
      if (!storedToken) {
        return rejectWithValue("No stored vendor session");
      }

      let cachedUser: any = null;
      let cachedVendor: any = null;
      try {
        const rawU = await storage.getItem("bhansa_vendor_user");
        if (rawU) cachedUser = JSON.parse(rawU);
        const rawV = await storage.getItem("bhansa_vendor_details");
        if (rawV) cachedVendor = JSON.parse(rawV);
      } catch (e) {
        console.warn("[VendorAuth] Failed to parse vendor cache", e);
      }

      try {
        const res = await vendorAuthService.getMyProfile();
        if (res.user) {
          await storage.setItem("bhansa_vendor_user", JSON.stringify(res.user));
        }
        if (res.vendor) {
          await storage.setItem("bhansa_vendor_details", JSON.stringify(res.vendor));
        }
        return {
          token: storedToken,
          user: res.user || cachedUser,
          vendor: res.vendor || cachedVendor,
        };
      } catch (apiErr: any) {
        if (apiErr?.statusCode === 401 || apiErr?.statusCode === 403) {
          await storage.removeItem("bhansa_vendor_token");
          await storage.removeItem("bhansa_vendor_user");
          await storage.removeItem("bhansa_vendor_details");
          return rejectWithValue("Session expired");
        }
        if (cachedUser || cachedVendor) {
          return {
            token: storedToken,
            user: cachedUser,
            vendor: cachedVendor,
          };
        }
        return {
          token: storedToken,
          user: { _id: "", name: "Vendor", email: "", role: "vendor", status: "pending" },
          vendor: { status: "pending" },
        };
      }
    } catch (err: any) {
      return rejectWithValue(err.message || "Failed to initialize vendor auth");
    }
  }
);

// Register Vendor
export const registerVendorAction = createAsyncThunk(
  "vendorAuth/register",
  async (payload: VendorRegisterPayload, { rejectWithValue }) => {
    try {
      const data = await vendorAuthService.register(payload);
      if (data.token) {
        await storage.setItem("bhansa_vendor_token", data.token);
      }
      if (data.user) {
        await storage.setItem("bhansa_vendor_user", JSON.stringify(data.user));
      }
      if (data.vendor) {
        await storage.setItem("bhansa_vendor_details", JSON.stringify(data.vendor));
      }
      return data;
    } catch (err: any) {
      return rejectWithValue(
        err.response?.data?.message || "Vendor registration failed"
      );
    }
  }
);

// Login with Password
export const loginVendorPasswordAction = createAsyncThunk(
  "vendorAuth/loginPassword",
  async (payload: VendorLoginPayload, { rejectWithValue }) => {
    try {
      const data = await vendorAuthService.loginWithPassword(payload);
      if (data.token) {
        await storage.setItem("bhansa_vendor_token", data.token);
      }
      if (data.user) {
        await storage.setItem("bhansa_vendor_user", JSON.stringify(data.user));
      }
      if (data.vendor) {
        await storage.setItem("bhansa_vendor_details", JSON.stringify(data.vendor));
      }
      return data;
    } catch (err: any) {
      return rejectWithValue(
        err.response?.data?.message || "Invalid vendor credentials"
      );
    }
  }
);

// Send Vendor OTP
export const sendVendorOtpAction = createAsyncThunk(
  "vendorAuth/sendOTP",
  async (payload: VendorSendOTPPayload, { rejectWithValue }) => {
    try {
      const data = await vendorAuthService.sendOTP(payload);
      return {
        ...data,
        email: payload.email,
      };
    } catch (err: any) {
      return rejectWithValue(
        err.response?.data?.message || "Failed to send OTP to email"
      );
    }
  }
);

// Verify Vendor OTP & Login
export const verifyVendorOtpAction = createAsyncThunk(
  "vendorAuth/verifyOTP",
  async (payload: VendorVerifyOTPPayload, { rejectWithValue }) => {
    try {
      const data = await vendorAuthService.verifyOTP(payload);
      if (data.token) {
        await storage.setItem("bhansa_vendor_token", data.token);
      }
      if (data.user) {
        await storage.setItem("bhansa_vendor_user", JSON.stringify(data.user));
      }
      if (data.vendor) {
        await storage.setItem("bhansa_vendor_details", JSON.stringify(data.vendor));
      }
      return data;
    } catch (err: any) {
      return rejectWithValue(
        err.response?.data?.message || "Invalid or expired OTP"
      );
    }
  }
);

// Logout Vendor
export const logoutVendorAction = createAsyncThunk(
  "vendorAuth/logout",
  async () => {
    await storage.removeItem("bhansa_vendor_token");
    await storage.removeItem("bhansa_vendor_user");
    await storage.removeItem("bhansa_vendor_details");
    return true;
  }
);

export const vendorAuthSlice = createSlice({
  name: "vendorAuth",
  initialState,
  reducers: {
    clearVendorError: (state) => {
      state.error = null;
    },
    clearVendorSuccess: (state) => {
      state.successMessage = null;
    },
    resetOtpState: (state) => {
      state.otpSent = false;
      state.otpEmail = null;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // 1. Initialize
    builder
      .addCase(initializeVendorAuth.fulfilled, (state, action) => {
        state.token = action.payload.token;
        state.vendorUser = action.payload.user;
        state.vendorDetails = action.payload.vendor;
        state.isVendorAuthenticated = true;
      })
      .addCase(initializeVendorAuth.rejected, (state) => {
        state.token = null;
        state.vendorUser = null;
        state.vendorDetails = null;
        state.isVendorAuthenticated = false;
      });

    // 2. Register
    builder
      .addCase(registerVendorAction.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(registerVendorAction.fulfilled, (state, action) => {
        state.isLoading = false;
        state.token = action.payload.token;
        state.vendorUser = action.payload.user;
        state.vendorDetails = action.payload.vendor;
        state.isVendorAuthenticated = true;
        state.successMessage = action.payload.message;
      })
      .addCase(registerVendorAction.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // 3. Login with Password
    builder
      .addCase(loginVendorPasswordAction.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginVendorPasswordAction.fulfilled, (state, action) => {
        state.isLoading = false;
        state.token = action.payload.token;
        state.vendorUser = action.payload.user;
        state.vendorDetails = action.payload.vendor;
        state.isVendorAuthenticated = true;
        state.successMessage = action.payload.message;
      })
      .addCase(loginVendorPasswordAction.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // 4. Send OTP
    builder
      .addCase(sendVendorOtpAction.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(sendVendorOtpAction.fulfilled, (state, action) => {
        state.isLoading = false;
        state.otpSent = true;
        state.otpEmail = action.payload.email;
        state.successMessage = action.payload.message;
      })
      .addCase(sendVendorOtpAction.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // 5. Verify OTP
    builder
      .addCase(verifyVendorOtpAction.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(verifyVendorOtpAction.fulfilled, (state, action) => {
        state.isLoading = false;
        state.token = action.payload.token;
        state.vendorUser = action.payload.user;
        state.vendorDetails = action.payload.vendor;
        state.isVendorAuthenticated = true;
        state.otpSent = false;
        state.otpEmail = null;
        state.successMessage = action.payload.message;
      })
      .addCase(verifyVendorOtpAction.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // 6. Logout
    builder.addCase(logoutVendorAction.fulfilled, (state) => {
      state.vendorUser = null;
      state.vendorDetails = null;
      state.token = null;
      state.isVendorAuthenticated = false;
      state.isLoading = false;
      state.error = null;
      state.successMessage = null;
      state.otpSent = false;
      state.otpEmail = null;
    });
  },
});

export const { clearVendorError, clearVendorSuccess, resetOtpState } =
  vendorAuthSlice.actions;

export default vendorAuthSlice.reducer;
