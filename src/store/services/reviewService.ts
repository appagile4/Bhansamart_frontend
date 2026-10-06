import api from "./api";

export interface CreateReviewPayload {
  rating: number;
  comment: string;
  userName?: string;
  isVerifiedBuyer?: boolean;
}

export const getProductReviewsApi = async (productId: string) => {
  const response = await api.get(`/products/${productId}/reviews`);
  return response.data;
};

export const createProductReviewApi = async (
  productId: string,
  data: CreateReviewPayload
) => {
  const response = await api.post(`/products/${productId}/reviews`, data);
  return response.data;
};

export const deleteProductReviewApi = async (
  productId: string,
  reviewId: string
) => {
  const response = await api.delete(`/products/${productId}/reviews/${reviewId}`);
  return response.data;
};
