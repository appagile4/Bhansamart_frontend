import React, { createContext, useContext, useEffect, useCallback } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  addToCart as addToCartThunk,
  addToCartLocal,
  CartItem,
  clearCart as clearCartThunk,
  clearCartLocal,
  fetchCart,
  loadCartFromStorage,
  removeFromCart as removeFromCartThunk,
  removeFromCartLocal,
  updateCartQuantity as updateCartQuantityThunk,
  updateQuantityLocal,
} from "@/store/slices/cartSlice";

export type { CartItem };

interface CartContextType {
  cartItems: CartItem[];
  addToCart: (product: Omit<CartItem, "quantity"> & { quantity?: number }) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, delta: number) => void;
  getItemQuantity: (productId: string) => number;
  clearCart: () => void;
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

  const addToCart = useCallback(
    (product: Omit<CartItem, "quantity"> & { quantity?: number }) => {
      dispatch(addToCartLocal(product));
      dispatch(addToCartThunk(product));
    },
    [dispatch]
  );

  const removeFromCart = useCallback(
    (productId: string) => {
      const pId = String(productId).trim();
      dispatch(removeFromCartLocal(pId));
      dispatch(removeFromCartThunk(pId));
    },
    [dispatch]
  );

  const updateQuantity = useCallback(
    (productId: string, delta: number) => {
      const pId = String(productId).trim();
      dispatch(updateQuantityLocal({ productId: pId, delta }));
      dispatch(updateCartQuantityThunk({ productId: pId, delta }));
    },
    [dispatch]
  );

  // High-performance O(1) product quantity lookup map
  const cartMapRef = React.useRef<Record<string, number>>({});
  useEffect(() => {
    const map: Record<string, number> = {};
    for (const item of cartItems) {
      if (item.id) map[String(item.id).trim()] = item.quantity;
      if ((item as any).productId) map[String((item as any).productId).trim()] = item.quantity;
      if ((item as any)._id) map[String((item as any)._id).trim()] = item.quantity;
    }
    cartMapRef.current = map;
  }, [cartItems]);

  const getItemQuantity = useCallback((productId: string): number => {
    const targetId = String(productId).trim();
    return targetId ? cartMapRef.current[targetId] || 0 : 0;
  }, []);

  const clearCart = useCallback(() => {
    dispatch(clearCartLocal());
    dispatch(clearCartThunk());
  }, [dispatch]);

  // Stabilize CartContext value to prevent unnecessary re-renders across all consumers
  const contextValue = React.useMemo(
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
    <CartContext.Provider value={contextValue}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
