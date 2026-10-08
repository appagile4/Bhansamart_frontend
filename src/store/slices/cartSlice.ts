import storage from "@/utils/storage";
import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import {
  addToCartApi,
  clearCartApi,
  fetchCartApi,
  removeFromCartApi,
  syncCartApi,
  updateCartItemQuantityApi,
} from "../services/cartService";

const CART_STORAGE_KEY = "bhansa_cart_items";

export interface CartItem {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  quantity: number;
  imageUrl?: string;
  weight?: string;
  category?: string;
  subCategory?: string;
  isVeg?: boolean;
}

export interface CartState {
  items: CartItem[];
  totalCount: number;
  totalPrice: number;
  totalOriginalPrice: number;
  totalSavings: number;
  loading: boolean;
  error: string | null;
  initialized: boolean;
}

export const calculateCartTotals = (items: CartItem[]) => {
  const totalCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const totalOriginalPrice = items.reduce(
    (sum, item) => sum + (item.originalPrice || item.price) * item.quantity,
    0
  );
  const totalSavings = Math.max(0, totalOriginalPrice - totalPrice);

  return {
    totalCount,
    totalPrice,
    totalOriginalPrice,
    totalSavings,
  };
};

export const normalizeProductToCartItem = (
  prod: any,
  quantity: number = 1
): CartItem => {
  const pId = String(
    prod.id || prod._id || prod.productId || prod.key || ""
  ).trim();
  const pName = prod.name || prod.title || "Product";
  const pPrice = Number(prod.price) || 0;
  const pOriginalPrice =
    Number(prod.originalPrice) || Number(prod.price) || pPrice;
  const pWeight = prod.weight || prod.unit || "1 unit";
  const pCategory = prod.category || "Grocery";
  const pSubCategory = prod.subCategory || prod.subcategory || "";
  const pIsVeg = prod.isVeg !== undefined ? Boolean(prod.isVeg) : true;
  const pQty = Math.max(1, Number(prod.quantity || quantity) || 1);

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
    id: pId,
    name: pName,
    price: pPrice,
    originalPrice: pOriginalPrice,
    quantity: pQty,
    imageUrl: imgUrl,
    weight: pWeight,
    category: pCategory,
    subCategory: pSubCategory,
    isVeg: pIsVeg,
  };
};

const initialItems: CartItem[] = [];
const initialTotals = calculateCartTotals(initialItems);

const initialState: CartState = {
  items: initialItems,
  totalCount: initialTotals.totalCount,
  totalPrice: initialTotals.totalPrice,
  totalOriginalPrice: initialTotals.totalOriginalPrice,
  totalSavings: initialTotals.totalSavings,
  loading: false,
  error: null,
  initialized: false,
};

/**
 * 1. Initialize cart from local storage on app start
 */
export const loadCartFromStorage = createAsyncThunk(
  "cart/loadFromStorage",
  async () => {
    try {
      const stored = await storage.getItem(CART_STORAGE_KEY);
      if (stored) {
        const parsed: CartItem[] = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
    } catch {
      // ignore
    }
    return [];
  }
);

/**
 * 2. Fetch live cart from backend & sync with storage
 */
export const fetchCart = createAsyncThunk(
  "cart/fetch",
  async (_, { getState, rejectWithValue }) => {
    try {
      const response = await fetchCartApi();
      if (response && response.data && Array.isArray(response.data.items)) {
        const normalized = response.data.items.map((it) =>
          normalizeProductToCartItem({
            ...it,
            id: it.productId || it._id,
          }, it.quantity)
        );
        await storage.setItem(CART_STORAGE_KEY, JSON.stringify(normalized));
        return normalized;
      }
      return [];
    } catch (error: any) {
      // Fallback: load from local storage
      try {
        const stored = await storage.getItem(CART_STORAGE_KEY);
        if (stored) return JSON.parse(stored);
      } catch {}
      return rejectWithValue(error.message || "Failed to fetch cart");
    }
  }
);

/**
 * 3. Add to cart (Optimistic + Backend sync)
 */
export const addToCart = createAsyncThunk(
  "cart/add",
  async (
    product: Omit<CartItem, "quantity"> & { quantity?: number },
    { getState }
  ) => {
    const item = normalizeProductToCartItem(product, product.quantity || 1);

    try {
      const response = await addToCartApi({
        productId: item.id,
        name: item.name,
        price: item.price,
        originalPrice: item.originalPrice,
        quantity: item.quantity,
        imageUrl: item.imageUrl,
        weight: item.weight,
        category: item.category,
        subCategory: item.subCategory,
        isVeg: item.isVeg,
      });

      if (response && response.data && Array.isArray(response.data.items)) {
        const normalized = response.data.items.map((it) =>
          normalizeProductToCartItem({ ...it, id: it.productId || it._id }, it.quantity)
        );
        await storage.setItem(CART_STORAGE_KEY, JSON.stringify(normalized));
        return normalized;
      }
    } catch {
      // Backend failed or guest: persist local state
    }

    const state = getState() as { cart: CartState };
    await storage.setItem(
      CART_STORAGE_KEY,
      JSON.stringify(state.cart.items)
    );
    return state.cart.items;
  }
);

/**
 * 4. Update cart item quantity (+1 / -1)
 */
export const updateCartQuantity = createAsyncThunk(
  "cart/updateQuantity",
  async (
    payload: { productId: string; delta: number },
    { getState }
  ) => {
    const { productId, delta } = payload;

    try {
      const response = await updateCartItemQuantityApi(productId, delta);
      if (response && response.data && Array.isArray(response.data.items)) {
        const normalized = response.data.items.map((it) =>
          normalizeProductToCartItem({ ...it, id: it.productId || it._id }, it.quantity)
        );
        await storage.setItem(CART_STORAGE_KEY, JSON.stringify(normalized));
        return normalized;
      }
    } catch {
      // Offline fallback
    }

    const state = getState() as { cart: CartState };
    await storage.setItem(
      CART_STORAGE_KEY,
      JSON.stringify(state.cart.items)
    );
    return state.cart.items;
  }
);

/**
 * 5. Remove product from cart
 */
export const removeFromCart = createAsyncThunk(
  "cart/remove",
  async (productId: string, { getState }) => {
    try {
      const response = await removeFromCartApi(productId);
      if (response && response.data && Array.isArray(response.data.items)) {
        const normalized = response.data.items.map((it) =>
          normalizeProductToCartItem({ ...it, id: it.productId || it._id }, it.quantity)
        );
        await storage.setItem(CART_STORAGE_KEY, JSON.stringify(normalized));
        return normalized;
      }
    } catch {
      // Offline fallback
    }

    const state = getState() as { cart: CartState };
    await storage.setItem(
      CART_STORAGE_KEY,
      JSON.stringify(state.cart.items)
    );
    return state.cart.items;
  }
);

/**
 * 6. Clear entire cart
 */
export const clearCart = createAsyncThunk(
  "cart/clear",
  async () => {
    await storage.removeItem(CART_STORAGE_KEY);
    try {
      await clearCartApi();
    } catch {}
    return [];
  }
);

const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
    // Synchronous optimistic add
    addToCartLocal(
      state,
      action: PayloadAction<Omit<CartItem, "quantity"> & { quantity?: number }>
    ) {
      const item = normalizeProductToCartItem(
        action.payload,
        action.payload.quantity || 1
      );
      const existing = state.items.find(
        (it) => String(it.id) === String(item.id)
      );

      if (existing) {
        existing.quantity += item.quantity;
        existing.price = item.price;
        if (item.imageUrl) existing.imageUrl = item.imageUrl;
      } else {
        state.items.unshift(item);
      }

      const totals = calculateCartTotals(state.items);
      state.totalCount = totals.totalCount;
      state.totalPrice = totals.totalPrice;
      state.totalOriginalPrice = totals.totalOriginalPrice;
      state.totalSavings = totals.totalSavings;
    },

    // Synchronous optimistic update (+1 / -1 or exact quantity)
    updateQuantityLocal(
      state,
      action: PayloadAction<{ productId: string; delta: number }>
    ) {
      const { productId, delta } = action.payload;
      const index = state.items.findIndex(
        (it) => String(it.id) === String(productId)
      );

      if (index > -1) {
        const newQty = state.items[index].quantity + delta;
        if (newQty <= 0) {
          state.items.splice(index, 1);
        } else {
          state.items[index].quantity = newQty;
        }
      }

      const totals = calculateCartTotals(state.items);
      state.totalCount = totals.totalCount;
      state.totalPrice = totals.totalPrice;
      state.totalOriginalPrice = totals.totalOriginalPrice;
      state.totalSavings = totals.totalSavings;
    },

    // Synchronous optimistic remove
    removeFromCartLocal(state, action: PayloadAction<string>) {
      const productId = action.payload;
      state.items = state.items.filter(
        (it) => String(it.id) !== String(productId)
      );

      const totals = calculateCartTotals(state.items);
      state.totalCount = totals.totalCount;
      state.totalPrice = totals.totalPrice;
      state.totalOriginalPrice = totals.totalOriginalPrice;
      state.totalSavings = totals.totalSavings;
    },

    // Synchronous optimistic clear
    clearCartLocal(state) {
      state.items = [];
      state.totalCount = 0;
      state.totalPrice = 0;
      state.totalOriginalPrice = 0;
      state.totalSavings = 0;
    },
  },
  extraReducers: (builder) => {
    // Load from storage
    builder
      .addCase(loadCartFromStorage.fulfilled, (state, action) => {
        state.items = action.payload;
        const totals = calculateCartTotals(state.items);
        state.totalCount = totals.totalCount;
        state.totalPrice = totals.totalPrice;
        state.totalOriginalPrice = totals.totalOriginalPrice;
        state.totalSavings = totals.totalSavings;
        state.initialized = true;
      })
      // Fetch cart
      .addCase(fetchCart.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCart.fulfilled, (state, action) => {
        state.items = action.payload;
        const totals = calculateCartTotals(state.items);
        state.totalCount = totals.totalCount;
        state.totalPrice = totals.totalPrice;
        state.totalOriginalPrice = totals.totalOriginalPrice;
        state.totalSavings = totals.totalSavings;
        state.loading = false;
        state.initialized = true;
      })
      .addCase(fetchCart.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Add to cart
      .addCase(addToCart.pending, (state, action) => {
        const item = normalizeProductToCartItem(
          action.meta.arg,
          action.meta.arg.quantity || 1
        );
        const existing = state.items.find(
          (it) => String(it.id) === String(item.id)
        );

        if (existing) {
          existing.quantity += item.quantity;
        } else {
          state.items.unshift(item);
        }

        const totals = calculateCartTotals(state.items);
        state.totalCount = totals.totalCount;
        state.totalPrice = totals.totalPrice;
        state.totalOriginalPrice = totals.totalOriginalPrice;
        state.totalSavings = totals.totalSavings;
      })
      .addCase(addToCart.fulfilled, (state, action) => {
        if (action.payload) {
          state.items = action.payload;
          const totals = calculateCartTotals(state.items);
          state.totalCount = totals.totalCount;
          state.totalPrice = totals.totalPrice;
          state.totalOriginalPrice = totals.totalOriginalPrice;
          state.totalSavings = totals.totalSavings;
        }
      })
      // Update quantity
      .addCase(updateCartQuantity.pending, (state, action) => {
        const { productId, delta } = action.meta.arg;
        const index = state.items.findIndex(
          (it) => String(it.id) === String(productId)
        );

        if (index > -1) {
          const newQty = state.items[index].quantity + delta;
          if (newQty <= 0) {
            state.items.splice(index, 1);
          } else {
            state.items[index].quantity = newQty;
          }
        }

        const totals = calculateCartTotals(state.items);
        state.totalCount = totals.totalCount;
        state.totalPrice = totals.totalPrice;
        state.totalOriginalPrice = totals.totalOriginalPrice;
        state.totalSavings = totals.totalSavings;
      })
      .addCase(updateCartQuantity.fulfilled, (state, action) => {
        if (action.payload) {
          state.items = action.payload;
          const totals = calculateCartTotals(state.items);
          state.totalCount = totals.totalCount;
          state.totalPrice = totals.totalPrice;
          state.totalOriginalPrice = totals.totalOriginalPrice;
          state.totalSavings = totals.totalSavings;
        }
      })
      // Remove
      .addCase(removeFromCart.pending, (state, action) => {
        const productId = action.meta.arg;
        state.items = state.items.filter(
          (it) => String(it.id) !== String(productId)
        );
        const totals = calculateCartTotals(state.items);
        state.totalCount = totals.totalCount;
        state.totalPrice = totals.totalPrice;
        state.totalOriginalPrice = totals.totalOriginalPrice;
        state.totalSavings = totals.totalSavings;
      })
      .addCase(removeFromCart.fulfilled, (state, action) => {
        if (action.payload) {
          state.items = action.payload;
          const totals = calculateCartTotals(state.items);
          state.totalCount = totals.totalCount;
          state.totalPrice = totals.totalPrice;
          state.totalOriginalPrice = totals.totalOriginalPrice;
          state.totalSavings = totals.totalSavings;
        }
      })
      // Clear
      .addCase(clearCart.fulfilled, (state) => {
        state.items = [];
        state.totalCount = 0;
        state.totalPrice = 0;
        state.totalOriginalPrice = 0;
        state.totalSavings = 0;
      });
  },
});

export const {
  addToCartLocal,
  updateQuantityLocal,
  removeFromCartLocal,
  clearCartLocal,
} = cartSlice.actions;

export default cartSlice.reducer;
