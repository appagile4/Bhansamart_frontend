import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import {
  createProductReviewApi,
  CreateReviewPayload,
  deleteProductReviewApi,
  getProductReviewsApi,
} from "../services/reviewService";

export interface ReviewItem {
  _id: string;
  id?: string;
  product: string;
  user?: string;
  userName: string;
  userAvatar?: string;
  rating: number;
  comment: string;
  isVerifiedBuyer: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface RatingBreakdown {
  5: number;
  4: number;
  3: number;
  2: number;
  1: number;
}

export interface RatingPercentages {
  5: number;
  4: number;
  3: number;
  2: number;
  1: number;
}

interface ReviewState {
  reviews: ReviewItem[];
  totalReviews: number;
  averageRating: number;
  breakdown: RatingBreakdown;
  percentages: RatingPercentages;
  loading: boolean;
  createLoading: boolean;
  deleteLoading: boolean;
  error: string | null;
  successMessage: string | null;
}

const initialState: ReviewState = {
  reviews: [],
  totalReviews: 0,
  averageRating: 5.0,
  breakdown: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
  percentages: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
  loading: false,
  createLoading: false,
  deleteLoading: false,
  error: null,
  successMessage: null,
};

// 1. Fetch Product Reviews Thunk
export const fetchProductReviews = createAsyncThunk(
  "review/fetchProductReviews",
  async (productId: string, { rejectWithValue }) => {
    try {
      const response = await getProductReviewsApi(productId);
      return response;
    } catch (error: any) {
      return rejectWithValue(
        error.message || "Failed to load product reviews."
      );
    }
  }
);

// 2. Create Product Review Thunk
export const createProductReview = createAsyncThunk(
  "review/createProductReview",
  async (
    { productId, data }: { productId: string; data: CreateReviewPayload },
    { rejectWithValue }
  ) => {
    try {
      const response = await createProductReviewApi(productId, data);
      return response;
    } catch (error: any) {
      return rejectWithValue(
        error.message || "Failed to submit review."
      );
    }
  }
);

// 3. Delete Product Review Thunk (Vendor / Admin / Author)
export const deleteProductReview = createAsyncThunk(
  "review/deleteProductReview",
  async (
    { productId, reviewId }: { productId: string; reviewId: string },
    { rejectWithValue }
  ) => {
    try {
      await deleteProductReviewApi(productId, reviewId);
      return reviewId;
    } catch (error: any) {
      return rejectWithValue(
        error.message || "Failed to delete review."
      );
    }
  }
);

export const reviewSlice = createSlice({
  name: "review",
  initialState,
  reducers: {
    clearReviewError: (state) => {
      state.error = null;
    },
    clearReviewSuccess: (state) => {
      state.successMessage = null;
    },
  },
  extraReducers: (builder) => {
    // ── FETCH REVIEWS ─────────────────────────────────────────
    builder.addCase(fetchProductReviews.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchProductReviews.fulfilled, (state, action) => {
      state.loading = false;
      state.reviews = action.payload?.reviews || [];
      state.totalReviews = action.payload?.count || 0;
      state.averageRating = action.payload?.averageRating || 5.0;
      state.breakdown = action.payload?.breakdown || {
        5: 0,
        4: 0,
        3: 0,
        2: 0,
        1: 0,
      };
      state.percentages = action.payload?.percentages || {
        5: 0,
        4: 0,
        3: 0,
        2: 0,
        1: 0,
      };
    });
    builder.addCase(fetchProductReviews.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // ── CREATE REVIEW ─────────────────────────────────────────
    builder.addCase(createProductReview.pending, (state) => {
      state.createLoading = true;
      state.error = null;
      state.successMessage = null;
    });
    builder.addCase(createProductReview.fulfilled, (state, action) => {
      state.createLoading = false;
      state.successMessage = action.payload?.message || "Review submitted!";
      if (action.payload?.review) {
        state.reviews.unshift(action.payload.review);
        state.totalReviews += 1;
      }
    });
    builder.addCase(createProductReview.rejected, (state, action) => {
      state.createLoading = false;
      state.error = action.payload as string;
    });

    // ── DELETE REVIEW ─────────────────────────────────────────
    builder.addCase(deleteProductReview.pending, (state) => {
      state.deleteLoading = true;
      state.error = null;
    });
    builder.addCase(deleteProductReview.fulfilled, (state, action) => {
      state.deleteLoading = false;
      const id = action.payload;
      state.reviews = state.reviews.filter((r) => r._id !== id && r.id !== id);
      state.totalReviews = Math.max(0, state.totalReviews - 1);
    });
    builder.addCase(deleteProductReview.rejected, (state, action) => {
      state.deleteLoading = false;
      state.error = action.payload as string;
    });
  },
});

export const { clearReviewError, clearReviewSuccess } = reviewSlice.actions;

export default reviewSlice.reducer;
