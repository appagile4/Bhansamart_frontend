import api from "./api";

export interface AddCartItemPayload {
  productId: string;
  name: string;
  price: number;
  originalPrice?: number;
  quantity?: number;
  imageUrl?: string;
  weight?: string;
  category?: string;
  subCategory?: string;
  isVeg?: boolean;
}

export interface BackendCartData {
  items: {
    _id?: string;
    productId: string;
    name: string;
    price: number;
    originalPrice?: number;
    quantity: number;
    imageUrl?: string;
    weight?: string;
    category?: string;
    subCategory?: string;
    isVeg?: boolean;
    addedAt?: string;
  }[];
  totalCount: number;
  totalPrice: number;
  totalOriginalPrice: number;
  totalSavings: number;
}

export interface CartApiResponse {
  success: boolean;
  message?: string;
  data: BackendCartData;
}

/**
 * Fetch cart from backend
 */
export const fetchCartApi = async (): Promise<CartApiResponse> => {
  const response = await api.get<CartApiResponse>("/cart");
  return response.data;
};

/**
 * Add item to cart
 */
export const addToCartApi = async (
  item: AddCartItemPayload
): Promise<CartApiResponse> => {
  const response = await api.post<CartApiResponse>("/cart/add", item);
  return response.data;
};

/**
 * Update quantity of item in cart (+1 / -1 / specific value)
 */
export const updateCartItemQuantityApi = async (
  productId: string,
  delta?: number,
  quantity?: number
): Promise<CartApiResponse> => {
  const response = await api.put<CartApiResponse>("/cart/update-quantity", {
    productId,
    delta,
    quantity,
  });
  return response.data;
};

/**
 * Remove item from cart
 */
export const removeFromCartApi = async (
  productId: string
): Promise<CartApiResponse> => {
  const response = await api.delete<CartApiResponse>(
    `/cart/remove/${productId}`
  );
  return response.data;
};

/**
 * Clear entire cart
 */
export const clearCartApi = async (): Promise<CartApiResponse> => {
  const response = await api.delete<CartApiResponse>("/cart/clear");
  return response.data;
};

/**
 * Sync guest / local cart with backend
 */
export const syncCartApi = async (
  items: any[]
): Promise<CartApiResponse> => {
  const response = await api.post<CartApiResponse>("/cart/sync", { items });
  return response.data;
};
