import api from "./api";

export interface VendorRegisterPayload {
  name: string;
  email: string;
  password: string;
  phone?: string;
  storeName?: string;
  category?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
}

export interface VendorLoginPayload {
  email: string;
  password: string;
}

export interface VendorSendOTPPayload {
  email: string;
}

export interface VendorVerifyOTPPayload {
  email: string;
  otp: string;
}

export const vendorAuthService = {
  // Vendor Registration
  register: async (data: VendorRegisterPayload) => {
    const response = await api.post("/auth/vendor/register", data);
    return response.data;
  },

  // Vendor Password Login
  loginWithPassword: async (data: VendorLoginPayload) => {
    const response = await api.post("/auth/vendor/login", data);
    return response.data;
  },

  // Vendor OTP Request
  sendOTP: async (data: VendorSendOTPPayload) => {
    const response = await api.post("/auth/vendor/send-otp", data);
    return response.data;
  },

  // Vendor OTP Verify & Login
  verifyOTP: async (data: VendorVerifyOTPPayload) => {
    const response = await api.post("/auth/vendor/verify-otp", data);
    return response.data;
  },

  // Vendor Profile
  getMyProfile: async () => {
    const response = await api.get("/auth/vendor/me");
    return response.data;
  },
};
