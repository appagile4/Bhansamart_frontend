import api from "./api";

export interface BrandItem {
  _id: string;
  name: string;
  slug: string;
  logo?: string;
  categories: string[];
  description?: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  createdByVendor?: string;
  isGlobal?: boolean;
  rejectionReason?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface AttributeItem {
  _id: string;
  name: string;
  slug: string;
  categories: string[];
  values: string[];
  type?: "single" | "multiple" | "text";
  status?: "ACTIVE" | "INACTIVE";
  createdByVendor?: string;
  isGlobal?: boolean;
}

export interface BrandLogoResult {
  name: string;
  logo: string;
  domain?: string;
  source?: string;
}

/**
 * Fetch approved brands, optionally filtered by category and search
 */
export const fetchBrandsApi = async (params?: {
  category?: string;
  search?: string;
  page?: number;
  limit?: number;
}) => {
  const response = await api.get("/brands", { params });
  return response.data;
};

/**
 * Quick search for brands
 */
export const searchBrandsApi = async (q: string, category?: string) => {
  const response = await api.get("/brands/search", {
    params: { q, category },
  });
  return response.data;
};

/**
 * Search curated & domain brand logos
 */
export const searchBrandLogosApi = async (q: string) => {
  const response = await api.get("/brands/logos", {
    params: { q },
  });
  return response.data;
};

/**
 * Submit a new brand request (vendor)
 */
export const createBrandRequestApi = async (data: FormData | {
  name: string;
  categories: string[];
  description?: string;
  logoUrl?: string;
}) => {
  const isFormData = typeof FormData !== "undefined" && data instanceof FormData;
  const response = await api.post("/vendor/brand-requests", data, {
    headers: isFormData ? { "Content-Type": "multipart/form-data" } : undefined,
  });
  return response.data;
};

/**
 * Fetch current vendor's brand requests with status tracking
 */
export const fetchMyBrandRequestsApi = async (params?: {
  status?: string;
  page?: number;
  limit?: number;
}) => {
  const response = await api.get("/vendor/brand-requests", { params });
  return response.data;
};

/**
 * Fetch attributes by category
 */
export const fetchAttributesApi = async (params?: {
  category?: string;
  search?: string;
}) => {
  const response = await api.get("/attributes", { params });
  return response.data;
};

/**
 * Create a new attribute request
 */
export const createAttributeApi = async (data: {
  name: string;
  categories?: string[];
  values: string[];
  type?: "single" | "multiple" | "text";
}) => {
  const response = await api.post("/vendor/attributes", data);
  return response.data;
};
