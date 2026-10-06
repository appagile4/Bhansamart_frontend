import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./slices/authSlice";
import vendorAuthReducer from "./slices/vendorAuthSlice";
import productReducer from "./slices/productSlice";
import reviewReducer from "./slices/reviewSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    vendorAuth: vendorAuthReducer,
    product: productReducer,
    review: reviewReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});


export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;
