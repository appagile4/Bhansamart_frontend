import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./slices/authSlice";
import vendorAuthReducer from "./slices/vendorAuthSlice";
import productReducer from "./slices/productSlice";
import reviewReducer from "./slices/reviewSlice";
import wishlistReducer from "./slices/wishlistSlice";
import cartReducer from "./slices/cartSlice";
import addressReducer from "./slices/addressSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    vendorAuth: vendorAuthReducer,
    product: productReducer,
    review: reviewReducer,
    wishlist: wishlistReducer,
    cart: cartReducer,
    address: addressReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});


export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;
