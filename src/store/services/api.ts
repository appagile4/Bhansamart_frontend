import storage from "@/utils/storage";
import axios from "axios";

/**
 * Configure dynamic backend URL:
 * - Defaults to LAN IP: http://192.168.29.235:5000/api (works for Physical Devices, Web, and Emulators)
 * - Can be overridden dynamically with process.env.EXPO_PUBLIC_API_URL
 */
const getDefaultApiUrl = () => {
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }
  // Host IP for local development & physical device testing
  return "http://192.168.29.235:5000/api";
};

export const API_BASE_URL = getDefaultApiUrl();

console.log(`[BhansaMart API] Base URL configured to: ${API_BASE_URL}`);

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 15000,
});

// Request interceptor: Attach JWT token from resilient universal storage
api.interceptors.request.use(
  async (config) => {
    try {
      const customerToken = await storage.getItem("bhansa_token");
      const vendorToken = await storage.getItem("bhansa_vendor_token");

      // Prioritize vendorToken for vendor endpoints or if only vendorToken exists
      const isVendorEndpoint =
        config.url?.includes("/vendor") || config.url?.includes("/auth/vendor");
      const token = isVendorEndpoint
        ? vendorToken || customerToken
        : customerToken || vendorToken;

      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.warn("[API Interceptor] Failed to read token from storage", error);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: Extract message & format error
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const customError = {
      message:
        error.response?.data?.message ||
        error.response?.data?.errors?.[0]?.message ||
        error.message ||
        "An unexpected error occurred. Please check your internet connection.",
      statusCode: error.response?.status || 500,
      errors: error.response?.data?.errors || [],
      raw: error.response?.data,
    };
    return Promise.reject(customError);
  }
);

export default api;
