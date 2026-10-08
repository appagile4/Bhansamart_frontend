import { CartProvider } from "@/context/cart-context";
import store from "@/store";
import { useAppDispatch } from "@/store/hooks";
import { initializeAuth } from "@/store/slices/authSlice";
import { initializeVendorAuth } from "@/store/slices/vendorAuthSlice";
import {
  fetchWishlist,
  loadWishlistFromStorage,
} from "@/store/slices/wishlistSlice";
import { Stack } from "expo-router";
import { useEffect } from "react";
import { Provider } from "react-redux";

function AppContent() {
  const dispatch = useAppDispatch();

  useEffect(() => {
    // Attempt automatic session restoration on boot for customer & vendor
    dispatch(initializeAuth());
    dispatch(initializeVendorAuth());
    dispatch(loadWishlistFromStorage());
    dispatch(fetchWishlist());
  }, [dispatch]);

  return (
    <CartProvider>
      <Stack
        screenOptions={{
          headerShown: false,
          gestureEnabled: false,
        }}
      >
        <Stack.Screen name="index" options={{ gestureEnabled: false }} />
        <Stack.Screen name="(auth)" options={{ gestureEnabled: false }} />
        <Stack.Screen name="customerMain" options={{ gestureEnabled: false }} />
      </Stack>
    </CartProvider>
  );
}

export default function RootLayout() {
  return (
    <Provider store={store}>
      <AppContent />
    </Provider>
  );
}
