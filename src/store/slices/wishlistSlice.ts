import storage from "@/utils/storage";
import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import {
  addToWishlistApi,
  clearWishlistApi,
  fetchWishlistApi,
  removeFromWishlistApi,
  toggleWishlistApi,
  WishlistItemPayload,
} from "../services/wishlistService";

const WISHLIST_STORAGE_KEY = "bhansa_wishlist_items";

export interface WishlistItem {
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
  addedAt?: string;
}

export interface WishlistState {
  items: WishlistItem[];
  loading: boolean;
  error: string | null;
  initialized: boolean;
}

const initialState: WishlistState = {
  items: [],
  loading: false,
  error: null,
  initialized: false,
};

/**
 * Helper to normalize image prop (handles require numbers, object with uri, or direct string)
 */
export const normalizeProductToWishlistItem = (
  prod: any
): WishlistItem => {
  const pId = String(
    prod.productId || prod.id || prod._id || prod.key || ""
  ).trim();
  const pName = prod.name || prod.title || "Product";
  const pPrice = Number(prod.price) || 0;
  const pOriginalPrice =
    Number(prod.originalPrice) || Number(prod.price) || pPrice;
  const pWeight = prod.weight || prod.unit || "1 unit";
  const pCategory = prod.category || "Grocery";
  const pSubCategory = prod.subCategory || "";
  const pRating = Number(prod.rating || prod.ratingsAverage) || 4.5;
  const pReviewsCount = Number(prod.reviewsCount || prod.ratingsCount) || 0;
  const pIsVeg = prod.isVeg !== undefined ? Boolean(prod.isVeg) : true;
  const pDiscountPct =
    prod.discountPct !== undefined
      ? Number(prod.discountPct)
      : pOriginalPrice > pPrice
      ? Math.round(((pOriginalPrice - pPrice) / pOriginalPrice) * 100)
      : 0;

  let imgUrl = "";
  if (typeof prod.imageUrl === "string" && prod.imageUrl) {
    imgUrl = prod.imageUrl;
  } else if (typeof prod.image === "string" && prod.image) {
    imgUrl = prod.image;
  } else if (
    prod.image &&
    typeof prod.image === "object" &&
    "uri" in prod.image
  ) {
    imgUrl = prod.image.uri;
  } else if (Array.isArray(prod.images) && prod.images.length > 0) {
    imgUrl = prod.images[0]?.url || "";
  }

  return {
    productId: pId,
    name: pName,
    price: pPrice,
    originalPrice: pOriginalPrice,
    image: prod.image,
    imageUrl: imgUrl,
    weight: pWeight,
    category: pCategory,
    subCategory: pSubCategory,
    rating: pRating,
    reviewsCount: pReviewsCount,
    isVeg: pIsVeg,
    discountPct: pDiscountPct,
    addedAt: new Date().toISOString(),
  };
};

/**
 * 1. Initialize wishlist from local storage on app start
 */
export const loadWishlistFromStorage = createAsyncThunk(
  "wishlist/loadFromStorage",
  async () => {
    try {
      const stored = await storage.getItem(WISHLIST_STORAGE_KEY);
      if (stored) {
        const parsed: WishlistItem[] = JSON.parse(stored);
        return Array.isArray(parsed) ? parsed : [];
      }
    } catch {
      // ignore
    }
    return [];
  }
);

/**
 * 2. Fetch live wishlist from backend and cache to storage
 */
export const fetchWishlist = createAsyncThunk(
  "wishlist/fetch",
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetchWishlistApi();
      if (response && response.data) {
        const normalized = response.data.map((item) =>
          normalizeProductToWishlistItem(item)
        );
        await storage.setItem(
          WISHLIST_STORAGE_KEY,
          JSON.stringify(normalized)
        );
        return normalized;
      }
      return [];
    } catch (error: any) {
      // Fallback: try loading from local storage
      const stored = await storage.getItem(WISHLIST_STORAGE_KEY);
      if (stored) {
        try {
          return JSON.parse(stored);
        } catch {}
      }
      return rejectWithValue(error.message || "Failed to fetch wishlist");
    }
  }
);

/**
 * 3. Toggle product in wishlist (Optimistic UI update + Backend sync)
 */
export const toggleWishlist = createAsyncThunk(
  "wishlist/toggle",
  async (product: any, { getState }) => {
    const item = normalizeProductToWishlistItem(product);

    // Prepare payload for backend
    const payload: WishlistItemPayload = {
      productId: item.productId,
      name: item.name,
      price: item.price,
      originalPrice: item.originalPrice,
      image: item.imageUrl || (typeof item.image === "string" ? item.image : ""),
      imageUrl: item.imageUrl,
      weight: item.weight,
      category: item.category,
      subCategory: item.subCategory,
      rating: item.rating,
      reviewsCount: item.reviewsCount,
      isVeg: item.isVeg,
      discountPct: item.discountPct,
    };

    try {
      const response = await toggleWishlistApi(payload);
      if (response && response.data && Array.isArray(response.data)) {
        const normalized = response.data.map((it) =>
          normalizeProductToWishlistItem(it)
        );
        await storage.setItem(
          WISHLIST_STORAGE_KEY,
          JSON.stringify(normalized)
        );
        return { items: normalized, inWishlist: response.inWishlist };
      }
    } catch {
      // Backend request failed or guest user: keep optimistic state
    }

    // Save optimistic state from Redux to local storage
    const currentState = getState() as { wishlist: WishlistState };
    await storage.setItem(
      WISHLIST_STORAGE_KEY,
      JSON.stringify(currentState.wishlist.items)
    );
    return { items: currentState.wishlist.items };
  }
);

/**
 * 4. Remove item from wishlist
 */
export const removeFromWishlist = createAsyncThunk(
  "wishlist/remove",
  async (productId: string, { getState }) => {
    const state = getState() as { wishlist: WishlistState };
    const nextItems = state.wishlist.items.filter(
      (i) => String(i.productId) !== String(productId)
    );
    await storage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(nextItems));

    try {
      await removeFromWishlistApi(productId);
    } catch {
      // Silent error: local state is already removed
    }

    return nextItems;
  }
);

/**
 * 5. Clear entire wishlist
 */
export const clearWishlist = createAsyncThunk(
  "wishlist/clear",
  async () => {
    await storage.removeItem(WISHLIST_STORAGE_KEY);
    try {
      await clearWishlistApi();
    } catch {
      // Silent error
    }
    return [];
  }
);

const wishlistSlice = createSlice({
  name: "wishlist",
  initialState,
  reducers: {
    // Quick local toggle without waiting for thunk
    toggleLocalWishlist(state, action: PayloadAction<any>) {
      const item = normalizeProductToWishlistItem(action.payload);
      const index = state.items.findIndex(
        (i) => String(i.productId) === String(item.productId)
      );
      if (index > -1) {
        state.items.splice(index, 1);
      } else {
        state.items.unshift(item);
      }
    },
    resetWishlistState(state) {
      state.items = [];
      state.loading = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Load from storage
    builder
      .addCase(loadWishlistFromStorage.fulfilled, (state, action) => {
        state.items = action.payload;
        state.initialized = true;
      })
      // Fetch wishlist
      .addCase(fetchWishlist.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchWishlist.fulfilled, (state, action) => {
        state.items = action.payload;
        state.loading = false;
        state.initialized = true;
      })
      .addCase(fetchWishlist.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Toggle wishlist
      .addCase(toggleWishlist.pending, (state, action) => {
        const item = normalizeProductToWishlistItem(action.meta.arg);
        const index = state.items.findIndex(
          (i) => String(i.productId) === String(item.productId)
        );
        if (index > -1) {
          state.items.splice(index, 1);
        } else {
          state.items.unshift(item);
        }
      })
      .addCase(toggleWishlist.fulfilled, (state, action) => {
        if (action.payload?.items) {
          state.items = action.payload.items;
        }
      })
      .addCase(toggleWishlist.rejected, (state) => {
        // Optimistic update remains in place
      })
      // Remove item
      .addCase(removeFromWishlist.fulfilled, (state, action) => {
        state.items = action.payload;
      })
      // Clear wishlist
      .addCase(clearWishlist.fulfilled, (state) => {
        state.items = [];
      });
  },
});

export const { toggleLocalWishlist, resetWishlistState } = wishlistSlice.actions;

export default wishlistSlice.reducer;
