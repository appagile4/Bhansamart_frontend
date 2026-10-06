import api from "./api";

export interface CreateProductPayload {
  name: string;
  description?: string;
  shortDescription?: string;
  category: string;
  subCategory?: string;
  supplierName?: string;
  brand?: string;
  expirationDate?: string;
  price: number;
  originalPrice?: number;
  discountCategory?: string;
  discountValue?: number;
  sku?: string;
  stock: number;
  reorderLevel?: number;
  unit?: string;
  status?: string;
  visibility?: {
    isFeatured?: boolean;
    isBestSeller?: boolean;
    isNewArrival?: boolean;
  };
  variants?: Array<{
    id?: string;
    type: string;
    weightUnit: string;
    weightValue: string;
    color: string;
    price?: number;
    sku?: string;
    stock?: number;
  }>;
  tags?: string[];
  images?: Array<{ uri: string; name?: string; type?: string; base64?: string } | string>;
}

export interface GetProductsParams {
  search?: string;
  category?: string;
  status?: string;
  stockStatus?: "all" | "in_stock" | "out_of_stock";
  minPrice?: number;
  maxPrice?: number;
  sortBy?: "default" | "price_asc" | "price_desc" | "alpha" | "newest" | "oldest";
  page?: number;
  limit?: number;
}

export interface GetPublicProductsParams {
  search?: string;
  category?: string;
  subCategory?: string;
  brand?: string;
  minPrice?: number;
  maxPrice?: number;
  sortBy?: "popularity" | "price_asc" | "price_desc" | "rating" | "newest" | "default";
  inStockOnly?: boolean;
  page?: number;
  limit?: number;
}

export const getAllProductsApi = async (params?: GetPublicProductsParams) => {
  const response = await api.get("/products", {
    params,
  });
  return response.data;
};

export const createProductApi = async (data: CreateProductPayload | FormData) => {
  if (data instanceof FormData) {
    const response = await api.post("/products", data, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      timeout: 45000, // 45 seconds for image uploads
    });
    return response.data;
  }

  // If JSON payload with images
  const response = await api.post("/products", data, {
    timeout: 45000,
  });
  return response.data;
};

export const getVendorProductsApi = async (params?: GetProductsParams) => {
  const response = await api.get("/products/my-products", {
    params,
  });
  return response.data;
};

export const getProductByIdApi = async (id: string) => {
  const response = await api.get(`/products/${id}`);
  return response.data;
};

export const updateProductApi = async (id: string, data: Partial<CreateProductPayload> | FormData) => {
  if (data instanceof FormData) {
    const response = await api.put(`/products/${id}`, data, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      timeout: 45000,
    });
    return response.data;
  }

  const response = await api.put(`/products/${id}`, data);
  return response.data;
};

export const toggleProductStockApi = async (id: string) => {
  const response = await api.patch(`/products/${id}/toggle-stock`);
  return response.data;
};

export const deleteProductApi = async (id: string) => {
  const response = await api.delete(`/products/${id}`);
  return response.data;
};

export const recordProductViewApi = async (id: string) => {
  const response = await api.post(`/products/${id}/view`);
  return response.data;
};

export const recordProductOrderApi = async (id: string, count: number = 1) => {
  const response = await api.post(`/products/${id}/order`, { count });
  return response.data;
};

export const recordProductRefundApi = async (id: string, count: number = 1) => {
  const response = await api.post(`/products/${id}/refund`, { count });
  return response.data;
};


