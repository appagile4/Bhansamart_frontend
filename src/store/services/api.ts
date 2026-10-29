import storage from "@/utils/storage";
import axios, { AxiosInstance } from "axios";

/**
 * Normalizes any backend URL format provided in .env:
 * - Trims whitespace
 * - Strips any trailing slashes
 * - Automatically appends "/api" if omitted (e.g. "http://192.168.1.100:5000" -> "http://192.168.1.100:5000/api")
 */
export const normalizeApiUrl = (rawUrl?: string): string => {
  const fallback = "http://192.168.29.235:5000/api";
  if (!rawUrl) return fallback;
  const trimmed = rawUrl.trim().replace(/\/+$/, "");
  if (!trimmed) return fallback;

  if (trimmed.endsWith("/api")) {
    return trimmed;
  }
  return `${trimmed}/api`;
};

/**
 * Extracts the base server origin URL without the /api suffix (useful for Socket.IO)
 */
export const getBaseServerUrl = (apiUrl: string = API_BASE_URL): string => {
  return apiUrl.replace(/\/api\/?$/, "");
};

/**
 * Read environment variable from process.env (EXPO_PUBLIC_* variables are bundled by Expo)
 */
const resolveEnvApiUrl = (): string => {
  const envUrl =
    process.env.EXPO_PUBLIC_API_URL ||
    process.env.EXPO_PUBLIC_BACKEND_URL ||
    process.env.EXPO_PUBLIC_API_BASE_URL;

  return normalizeApiUrl(envUrl);
};

export let API_BASE_URL: string = resolveEnvApiUrl();

console.log(`[BhansaMart API] Base URL configured to: ${API_BASE_URL}`);

const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 30000,
});

/**
 * Helper to dynamically reconfigure the API base URL at runtime if needed
 */
export const setApiBaseUrl = (newUrl: string) => {
  API_BASE_URL = normalizeApiUrl(newUrl);
  api.defaults.baseURL = API_BASE_URL;
  console.log(`[BhansaMart API] Base URL updated dynamically to: ${API_BASE_URL}`);
};

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
