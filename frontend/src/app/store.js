// import { configureStore } from "@reduxjs/toolkit";
// import loadingReducer from "../features/loadingSlice";
// import authReducer from "../features/auth/authSlice";
// import purchaseReducer from "../features/inventory/purchase/purchaseSlice";
// import itemReducer from "../features/inventory/items/itemSlice";
// import usageReducer from "../features/inventory/usage/usageSlice";
// import orderReducer from "../features/order/orderSlice";
// import qarzaReducer from "../features/qarza/qarzaSlice";

// import storage from "redux-persist/lib/storage";
// import { persistReducer, persistStore } from "redux-persist";

// const presistConfig = {
//     key: "ims-auth",
//     storage,
// };

// export const store = configureStore({
//     reducer: {
//         auth: persistReducer(presistConfig, authReducer),
//         itemPurchase: purchaseReducer,
//         item: itemReducer,
//         usage: usageReducer,
//         order: orderReducer,
//         qarza: qarzaReducer,
//         loading: loadingReducer,
//     },
// });

// export const presistor = persistStore(store);














// ============================================================
//  store/index.js
//  Tumhara existing store — sirf RTK Query ki 3 cheezein add ki hain:
//    1. baseApi import
//    2. baseApi.reducer → reducer mein
//    3. baseApi.middleware → middleware mein
//  Baaki sab same hai.
// ============================================================

import { configureStore } from "@reduxjs/toolkit";
import authReducer from "../modules/auth/slices/authSlice.js";

import storage from "redux-persist/lib/storage";
import { persistReducer, persistStore } from "redux-persist";

// ── NEW: RTK Query base API ───────────────────────────────────
import { baseApi } from "./rtkBaseApi.js";

const presistConfig = {
    key: "ims-auth",
    storage,
};

export const store = configureStore({
    reducer: {
        // Tumhare existing reducers — kuch nahi badla
        auth: persistReducer(presistConfig, authReducer),

        // ── NEW: RTK Query cache yahan store hogi ────────────
        [baseApi.reducerPath]: baseApi.reducer,
    },

    middleware: (getDefault) =>
        getDefault({
            // redux-persist ke saath ye warning aati hai — suppress karo
            serializableCheck: {
                ignoredActions: ["persist/PERSIST", "persist/REHYDRATE"],
            },
            // ── NEW: RTK Query middleware — caching yahi kaam karta hai
        }).concat(baseApi.middleware),
});

export const presistor = persistStore(store);