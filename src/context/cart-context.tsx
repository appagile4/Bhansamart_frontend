import React, { createContext, useContext, useEffect, useCallback, useRef, useMemo } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  addToCart as addToCartThunk,
  CartItem,
  clearCart as clearCartThunk,
  fetchCart,
  loadCartFromStorage,
  removeFromCart as removeFromCartThunk,
  updateCartQuantity as updateCartQuantityThunk,
  selectProductQuantity,
  selectCartTotals,
  selectCartTotalCount,
} from "@/store/slices/cartSlice";

export type { CartItem };

export interface CartActions {
  addToCart: (
    product: Omit<CartItem, "quantity"> & {
      quantity?: number;
      stock?: number;
      maxQuantity?: number;
    }
  ) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (
    productId: string,
    delta: number,
    exactQuantity?: number
  ) => void;
  clearCart: () => void;
}

interface CartContextType extends CartActions {
  cartItems: CartItem[];
  getItemQuantity: (productId: string) => number;
  totalCount: number;
  totalPrice: number;
  totalOriginalPrice: number;
  totalSavings: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch();
  const {
    items: cartItems,
    totalCount,
    totalPrice,
    totalOriginalPrice,
    totalSavings,
    initialized,
  } = useAppSelector((state) => state.cart);

  useEffect(() => {
    if (!initialized) {
      dispatch(loadCartFromStorage());
    }
    dispatch(fetchCart());
  }, [dispatch, initialized]);

  // Keep a synchronous ref of items for instant, non-subscribing lookups
  const itemsRef = useRef(cartItems);
  itemsRef.current = cartItems;

  const addToCart = useCallback(
    (
      product: Omit<CartItem, "quantity"> & {
        quantity?: number;
        stock?: number;
        maxQuantity?: number;
      }
    ) => {
      dispatch(addToCartThunk(product));
    },
    [dispatch]
  );

  const removeFromCart = useCallback(
    (productId: string) => {
      const pId = String(productId || "").trim();
      if (!pId) return;
      dispatch(removeFromCartThunk(pId));
    },
    [dispatch]
  );

  const updateQuantity = useCallback(
    (productId: string, delta: number, exactQuantity?: number) => {
      const pId = String(productId || "").trim();
      if (!pId) return;
      dispatch(
        updateCartQuantityThunk({
          productId: pId,
          delta,
          quantity: exactQuantity,
        })
      );
    },
    [dispatch]
  );

  const clearCart = useCallback(() => {
    dispatch(clearCartThunk());
  }, [dispatch]);

  // Synchronous, stable lookup without triggering consumer invalidation
  const getItemQuantity = useCallback((productId: string): number => {
    const targetId = String(productId || "").trim();
    if (!targetId) return 0;
    const currentItems = itemsRef.current;
    for (let i = 0; i < currentItems.length; i++) {
      const it = currentItems[i];
      if (
        String(it.id).trim() === targetId ||
        String((it as any).productId || "").trim() === targetId ||
        String((it as any)._id || "").trim() === targetId
      ) {
        return it.quantity || 0;
      }
    }
    return 0;
  }, []);

  const contextValue = useMemo<CartContextType>(
    () => ({
      cartItems,
      addToCart,
      removeFromCart,
      updateQuantity,
      getItemQuantity,
      clearCart,
      totalCount,
      totalPrice,
      totalOriginalPrice,
      totalSavings,
    }),
    [
      cartItems,
      addToCart,
      removeFromCart,
      updateQuantity,
      getItemQuantity,
      clearCart,
      totalCount,
      totalPrice,
      totalOriginalPrice,
      totalSavings,
    ]
  );

  return (
    <CartContext.Provider value={contextValue}>{children}</CartContext.Provider>
  );
}

/**
 * Standard hook for full cart access (used in cart screen, checkout).
 */
export function useCart(): CartContextType {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}

/**
 * High-performance granular selector hook for a single product's quantity.
 * Compares primitive numbers so updating Product A NEVER re-renders Product B!
 */
export function useProductCartQuantity(productId: string | undefined): number {
  return useAppSelector(selectProductQuantity(productId));
}

/**
 * High-performance hook for stable cart actions.
 * Never causes component re-renders when cart state updates!
 */
export function useCartActions(): CartActions {
  const dispatch = useAppDispatch();

  const addToCart = useCallback(
    (
      product: Omit<CartItem, "quantity"> & {
        quantity?: number;
        stock?: number;
        maxQuantity?: number;
      }
    ) => {
      dispatch(addToCartThunk(product));
    },
    [dispatch]
  );

  const removeFromCart = useCallback(
    (productId: string) => {
      const pId = String(productId || "").trim();
      if (!pId) return;
      dispatch(removeFromCartThunk(pId));
    },
    [dispatch]
  );

  const updateQuantity = useCallback(
    (productId: string, delta: number, exactQuantity?: number) => {
      const pId = String(productId || "").trim();
      if (!pId) return;
      dispatch(
        updateCartQuantityThunk({
          productId: pId,
          delta,
          quantity: exactQuantity,
        })
      );
    },
    [dispatch]
  );

  const clearCart = useCallback(() => {
    dispatch(clearCartThunk());
  }, [dispatch]);

  return useMemo(
    () => ({
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
    }),
    [addToCart, removeFromCart, updateQuantity, clearCart]
  );
}

/**
 * Granular hook for cart totals only.
 */
export function useCartTotals() {
  return useAppSelector(selectCartTotals);
}

/**
 * Granular hook for total cart count (e.g. badge counters).
 */
export function useCartTotalCount(): number {
  return useAppSelector(selectCartTotalCount);
}
