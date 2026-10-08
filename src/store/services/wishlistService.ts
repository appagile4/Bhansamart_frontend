import api from "./api";

export interface WishlistItemPayload {
  productId: string;
  name: string;
  price: number;
  originalPrice?: number;
  image?: any;
  imageUrl?: string;
  weight?: string;
  category?: string;
  subCategory?: string;
  rating?: number;
  reviewsCount?: number;
  isVeg?: boolean;
  discountPct?: number;
}

export interface WishlistApiResponse {
  success: boolean;
  count: number;
  data: any[];
  inWishlist?: boolean;
  message?: string;
}

/**
 * Fetch all items in user's wishlist from backend
 */
export const fetchWishlistApi = async (): Promise<WishlistApiResponse> => {
  const response = await api.get<WishlistApiResponse>("/wishlist");
  return response.data;
};

/**
 * Toggle product in wishlist (add if missing, remove if present)
 */
export const toggleWishlistApi = async (
  item: WishlistItemPayload
): Promise<WishlistApiResponse> => {
  const response = await api.post<WishlistApiResponse>("/wishlist/toggle", item);
  return response.data;
};

/**
 * Add product to wishlist
 */
export const addToWishlistApi = async (
  item: WishlistItemPayload
): Promise<WishlistApiResponse> => {
  const response = await api.post<WishlistApiResponse>("/wishlist/add", item);
  return response.data;
};

/**
 * Remove product from wishlist by ID
 */
export const removeFromWishlistApi = async (
  productId: string
): Promise<WishlistApiResponse> => {
  const response = await api.delete<WishlistApiResponse>(
    `/wishlist/remove/${productId}`
  );
  return response.data;
};

/**
 * Clear all items in user's wishlist
 */
export const clearWishlistApi = async (): Promise<WishlistApiResponse> => {
  const response = await api.delete<WishlistApiResponse>("/wishlist/clear");
  return response.data;
};
