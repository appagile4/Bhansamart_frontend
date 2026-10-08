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

  const getItemQuantity = useCallback(
    (productId: string): number => {
      const targetId = String(productId).trim();
      if (!targetId) return 0;
      const found = cartItems.find(
        (item) =>
          String(item.id).trim() === targetId ||
          String((item as any).productId || "").trim() === targetId ||
          String((item as any)._id || "").trim() === targetId
      );
      return found ? found.quantity : 0;
    },
    [cartItems]
  );

  const clearCart = useCallback(() => {
    dispatch(clearCartLocal());
    dispatch(clearCartThunk());
  }, [dispatch]);

  return (
    <CartContext.Provider
      value={{
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
      }}
    >
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
