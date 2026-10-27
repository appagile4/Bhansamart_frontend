import storage from "@/utils/storage";
import axios from "axios";

/**
 * Configure dynamic backend URL:
 * - Defaults to LAN IP: http://169.58.31.214:5001/api (works for Physical Devices, Web, and Emulators)
 * - Can be overridden dynamically with process.env.EXPO_PUBLIC_API_URL
 */
const LIVE_API_URL = "http://169.58.31.214:5001/api";

const getDefaultApiUrl = () => {
  const envUrl = process.env.EXPO_PUBLIC_API_URL;
  if (envUrl && !envUrl.includes("192.168.") && !envUrl.includes("localhost:5000")) {
    return envUrl;
  }
  return LIVE_API_URL;
};

export const API_BASE_URL = getDefaultApiUrl();

console.log(`[BhansaMart API] Base URL configured to: ${API_BASE_URL}`);

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 30000,
});

// Request interceptor: Attach JWT token from resilient universal storage
api.interceptors.request.use(
  async (config) => {
    try {
      const customerToken = await storage.getItem("bhansa_token");
      const vendorToken = await storage.getItem("bhansa_vendor_token");
      const deliveryToken = await storage.getItem("bhansa_delivery_token");
      const adminToken = await storage.getItem("bhansa_admin_token");

      // Prioritize token based on target endpoint
      let token = customerToken;
      if (config.url?.includes("/admin")) {
        token = adminToken || customerToken || vendorToken;
      } else if (config.url?.includes("/delivery")) {
        token = deliveryToken || vendorToken || customerToken;
      } else if (
        config.url?.includes("/vendor") ||
        config.url?.includes("/auth/vendor") ||
        config.url?.includes("/brands") ||
        config.url?.includes("/attributes")
      ) {
        token = vendorToken || customerToken;
      } else {
        token = customerToken || adminToken || deliveryToken || vendorToken;
      }

      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }

      // Attach customer delivery coordinates only if the user explicitly has stored coordinates
      if (
        config.method?.toLowerCase() === "get" &&
        (config.url === "/products" ||
          config.url?.startsWith("/products?") ||
          config.url?.startsWith("/products/")) &&
        !config.url.includes("/my-products")
      ) {
        config.params = config.params || {};
        if (config.params.lat == null && config.params.latitude == null) {
          const storedCoords = await storage.getItem("bhansa_user_coords");
          if (storedCoords) {
            try {
              const parsed = JSON.parse(storedCoords);
              if (parsed?.lat != null && parsed?.lng != null) {
                config.params.lat = parsed.lat;
                config.params.lng = parsed.lng;
              }
            } catch {}
          }
        }
      }
    } catch (error) {
      console.warn(
        "[API Interceptor] Failed to read token/coords from storage",
        error,
      );
    }
    return config;
  },
  (error) => Promise.reject(error),
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
  },
);

export default api;
