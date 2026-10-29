import storage from "@/utils/storage";
import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import {
  addToCartApi,
  clearCartApi,
  fetchCartApi,
  removeFromCartApi,
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
  stock?: number;
  maxQuantity?: number;
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
  let totalCount = 0;
  let totalPrice = 0;
  let totalOriginalPrice = 0;

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const qty = item.quantity || 0;
    totalCount += qty;
    totalPrice += (item.price || 0) * qty;
    totalOriginalPrice += (item.originalPrice || item.price || 0) * qty;
  }

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
  const pStock =
    typeof prod.stock === "number"
      ? prod.stock
      : typeof prod.countInStock === "number"
      ? prod.countInStock
      : undefined;
  const pMaxQty =
    typeof prod.maxQuantity === "number"
      ? prod.maxQuantity
      : pStock !== undefined
      ? pStock
      : 99;

  const rawQty = Number(prod.quantity || quantity) || 1;
  const pQty = Math.min(pMaxQty, Math.max(1, rawQty));

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
    stock: pStock,
    maxQuantity: pMaxQty,
  };
};

// ── In-Memory Queue & Debounce Timers ──────────────────────────────────────────
const pendingSyncTimers: Map<string, ReturnType<typeof setTimeout>> = new Map();
let storageDebounceTimer: ReturnType<typeof setTimeout> | null = null;

const scheduleStoragePersist = (items: CartItem[]) => {
  if (storageDebounceTimer) {
    clearTimeout(storageDebounceTimer);
  }
  storageDebounceTimer = setTimeout(() => {
    storageDebounceTimer = null;
    storage.setItem(CART_STORAGE_KEY, JSON.stringify(items)).catch(() => {});
  }, 400);
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
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetchCartApi();
      if (response && response.data && Array.isArray(response.data.items)) {
        const normalized = response.data.items.map((it) =>
          normalizeProductToCartItem(
            {
              ...it,
              id: it.productId || it._id,
            },
            it.quantity
          )
        );
        scheduleStoragePersist(normalized);
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
 * 3. Add to cart (Synchronous 0ms UI update + Debounced Backend sync)
 */
export const addToCart = createAsyncThunk(
  "cart/add",
  async (
    product: Omit<CartItem, "quantity"> & {
      quantity?: number;
      stock?: number;
      maxQuantity?: number;
    },
    { dispatch, getState }
  ) => {
    // 1. Immediately apply optimistic add to local Redux state
    dispatch(addToCartLocal(product));

    const item = normalizeProductToCartItem(product, product.quantity || 1);
    const pId = String(item.id).trim();

    // 2. Debounce backend sync per product ID to prevent out-of-order calls
    if (pendingSyncTimers.has(pId)) {
      clearTimeout(pendingSyncTimers.get(pId)!);
      pendingSyncTimers.delete(pId);
    }

    try {
      const response = await addToCartApi({
        productId: pId,
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
        dispatch(reconcileCartBackend(response.data.items));
      }
    } catch {
      // Backend failed or guest: offline fallback preserves local state
    }

    const state = getState() as { cart: CartState };
    scheduleStoragePersist(state.cart.items);
    return state.cart.items;
  }
);

/**
 * 4. Update cart item quantity (0ms Immediate UI update + 300ms Debounced Server Sync)
 */
export const updateCartQuantity = createAsyncThunk(
  "cart/updateQuantity",
  async (
    payload: {
      productId: string;
      delta?: number;
      quantity?: number;
      maxQuantity?: number;
    },
    { dispatch, getState }
  ) => {
    const { productId, delta = 0, quantity, maxQuantity } = payload;
    const pId = String(productId).trim();

    // 1. Immediately apply optimistic update in Redux store (0ms latency)
    dispatch(
      updateQuantityLocal({ productId: pId, delta, quantity, maxQuantity })
    );

    // 2. Debounce server synchronization by 300ms
    if (pendingSyncTimers.has(pId)) {
      clearTimeout(pendingSyncTimers.get(pId)!);
      pendingSyncTimers.delete(pId);
    }

    return new Promise<CartItem[]>((resolve) => {
      const timer = setTimeout(async () => {
        pendingSyncTimers.delete(pId);
        const state = getState() as { cart: CartState };
        const currentItem = state.cart.items.find(
          (it) => String(it.id).trim() === pId
        );
        const targetQty = currentItem ? currentItem.quantity : 0;

        try {
          if (targetQty <= 0) {
            await removeFromCartApi(pId);
          } else {
            // Send authoritative exact final quantity to server
            await updateCartItemQuantityApi(pId, undefined, targetQty);
          }
        } catch {
          // Offline fallback: keep optimistic local state
        }

        scheduleStoragePersist(state.cart.items);
        resolve(state.cart.items);
      }, 300);

      pendingSyncTimers.set(pId, timer);
    });
  }
);

/**
 * 5. Remove product from cart (0ms Immediate UI update + Backend Sync)
 */
export const removeFromCart = createAsyncThunk(
  "cart/remove",
  async (productId: string, { dispatch, getState }) => {
    const pId = String(productId).trim();

    // Cancel any pending sync timers for this product
    if (pendingSyncTimers.has(pId)) {
      clearTimeout(pendingSyncTimers.get(pId)!);
      pendingSyncTimers.delete(pId);
    }

    // 1. Immediately remove from local Redux state
    dispatch(removeFromCartLocal(pId));

    try {
      await removeFromCartApi(pId);
    } catch {
      // Offline fallback
    }

    const state = getState() as { cart: CartState };
    scheduleStoragePersist(state.cart.items);
    return state.cart.items;
  }
);

/**
 * 6. Clear entire cart (0ms Immediate UI update + Backend Sync)
 */
export const clearCart = createAsyncThunk(
  "cart/clear",
  async (_, { dispatch }) => {
    // Clear all pending timers
    pendingSyncTimers.forEach((timer) => clearTimeout(timer));
    pendingSyncTimers.clear();

    if (storageDebounceTimer) {
      clearTimeout(storageDebounceTimer);
      storageDebounceTimer = null;
    }

    // 1. Immediately clear local Redux state
    dispatch(clearCartLocal());

    try {
      await clearCartApi();
    } catch {}

    await storage.removeItem(CART_STORAGE_KEY).catch(() => {});
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
      action: PayloadAction<
        Omit<CartItem, "quantity"> & {
          quantity?: number;
          stock?: number;
          maxQuantity?: number;
        }
      >
    ) {
      const item = normalizeProductToCartItem(
        action.payload,
        action.payload.quantity || 1
      );
      const existing = state.items.find(
        (it) => String(it.id).trim() === String(item.id).trim()
      );

      const maxLimit = Math.min(
        item.maxQuantity || 99,
        item.stock !== undefined ? item.stock : 99
      );

      if (existing) {
        existing.quantity = Math.min(maxLimit, existing.quantity + item.quantity);
        existing.price = item.price;
        if (item.imageUrl) existing.imageUrl = item.imageUrl;
        if (item.stock !== undefined) existing.stock = item.stock;
      } else {
        item.quantity = Math.min(maxLimit, item.quantity);
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
      action: PayloadAction<{
        productId: string;
        delta?: number;
        quantity?: number;
        maxQuantity?: number;
      }>
    ) {
      const { productId, delta = 0, quantity, maxQuantity } = action.payload;
      const targetId = String(productId).trim();
      const index = state.items.findIndex(
        (it) => String(it.id).trim() === targetId
      );

      if (index > -1) {
        const item = state.items[index];
        const maxLimit = Math.min(
          maxQuantity || item.maxQuantity || 99,
          item.stock !== undefined ? item.stock : 99
        );

        let newQty = item.quantity;
        if (quantity !== undefined) {
          newQty = Number(quantity);
        } else {
          newQty += Number(delta);
        }

        if (newQty <= 0) {
          state.items.splice(index, 1);
        } else {
          item.quantity = Math.min(maxLimit, newQty);
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
      const targetId = String(action.payload).trim();
      state.items = state.items.filter(
        (it) => String(it.id).trim() !== targetId
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

    // Reconcile server response without overriding active local user edits
    reconcileCartBackend(state, action: PayloadAction<any[]>) {
      if (!Array.isArray(action.payload)) return;
      const serverItems = action.payload;

      for (const sItem of serverItems) {
        const pId = String(sItem.productId || sItem._id || "").trim();
        if (!pId) continue;
        const localItem = state.items.find(
          (it) => String(it.id).trim() === pId
        );

        // If no pending sync timer for this item, sync metadata
        if (localItem && !pendingSyncTimers.has(pId)) {
          if (sItem.price !== undefined) localItem.price = Number(sItem.price);
          if (sItem.originalPrice !== undefined)
            localItem.originalPrice = Number(sItem.originalPrice);
          if (sItem.imageUrl && !localItem.imageUrl)
            localItem.imageUrl = sItem.imageUrl;
        }
      }
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
      });
  },
});

export const {
  addToCartLocal,
  updateQuantityLocal,
  removeFromCartLocal,
  clearCartLocal,
  reconcileCartBackend,
} = cartSlice.actions;

// ── Granular Memoized Redux Selectors ──────────────────────────────────────────

/**
 * Granular selector for a single product's quantity.
 * Compares primitive numbers (prevQty === nextQty) so only the affected product re-renders!
 */
export const selectProductQuantity =
  (productId: string | undefined) =>
  (state: { cart: CartState }): number => {
    if (!productId) return 0;
    const targetId = String(productId).trim();
    if (!targetId) return 0;

    const items = state.cart.items;
    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      if (
        String(it.id).trim() === targetId ||
        String((it as any).productId || "").trim() === targetId ||
        String((it as any)._id || "").trim() === targetId
      ) {
        return it.quantity || 0;
      }
    }
    return 0;
  };

/**
 * Granular selector for cart totals.
 */
export const selectCartTotals = (state: { cart: CartState }) => ({
  totalCount: state.cart.totalCount,
  totalPrice: state.cart.totalPrice,
  totalOriginalPrice: state.cart.totalOriginalPrice,
  totalSavings: state.cart.totalSavings,
});

/**
 * Primitive selector for total item count (used in tab bar badges).
 */
export const selectCartTotalCount = (state: { cart: CartState }): number =>
  state.cart.totalCount;

export default cartSlice.reducer;