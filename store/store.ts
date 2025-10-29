import { configureStore } from "@reduxjs/toolkit";
import authSlice from "./authSlice";
import productSlice from "./productSlice";
import categorySlice from "./categoriesSlice";
import collectionSlice from "./collectionSlice";
import orderSlice from './orderSlice'
import reviewsSlice from './reviewsSlice'
import chatSlice from './chatSlice'
import adminManagementSlice from './adminManagementSlice'
const store = configureStore({
  reducer: {
    auth: authSlice,
    adminProducts: productSlice,
    category: categorySlice,
    collections: collectionSlice,
    orders:orderSlice,
    reviews: reviewsSlice,
    chat: chatSlice,
    adminManagement: adminManagementSlice
  },
});

export default store;
export type AppDispatch = typeof store.dispatch;
export type RootState = ReturnType<typeof store.getState>;
