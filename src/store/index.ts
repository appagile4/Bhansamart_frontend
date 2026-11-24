import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./slices/authSlice";
import productReducer from "./slices/productSlice";
import reviewReducer from "./slices/reviewSlice";
import wishlistReducer from "./slices/wishlistSlice";
import cartReducer from "./slices/cartSlice";
import addressReducer from "./slices/addressSlice";
import orderReducer from "./slices/orderSlice";
import deliveryReducer from "./slices/deliverySlice";
import referralReducer from "./slices/referralSlice";
import paymentReducer from "./slices/paymentSlice";
import brandReducer from "./slices/brandSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    product: productReducer,
    review: reviewReducer,
    wishlist: wishlistReducer,
    cart: cartReducer,
    address: addressReducer,
    order: orderReducer,
    delivery: deliveryReducer,
    referral: referralReducer,
    payment: paymentReducer,
    brand: brandReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;
