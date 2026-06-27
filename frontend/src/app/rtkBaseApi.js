// ============================================================
//  store/api.js
//  RTK Query ka base API slice.
//
//  Hum fetchBaseQuery use NAHI kar rahe — kyunki tumhara existing
//  Axios instance (apiClient) mein already:
//    → base URL set hai
//    → token interceptor hai
//    → error handling hai
//
//  Isliye axiosBaseQuery banaya — jo Axios ko wrap karta hai.
//  RTK Query ki saari caching/invalidation + Axios ki saari powers.
// ============================================================

import { createApi } from "@reduxjs/toolkit/query/react";
import api from "../shared/services/api.js"; // tumhara existing Axios instance — same jo baaki jagah use ho raha hai
import { showError } from "../shared/utilities/toastHelpers.js";

// ── Axios ko RTK Query ke format mein wrap karo ───────────────
// RTK Query ko { url, method, body, params } format mein call milti hai
// Axios ko { url, method, data, params } chahiye — yahan convert hota hai
const axiosBaseQuery = () => async ({ url, method = "GET", body, params, headers }) => {
    try {
        const reqHeaders = { ...headers };
        if (body instanceof FormData) {
            reqHeaders["Content-Type"] = undefined;
        }
        const result = await api({ url, method, data: body, params, headers: reqHeaders });
        return { data: result.data };
    } catch (err) {
        const errorMessage = err?.response?.data?.message || err?.response?.data?.reason || err?.message || "Request failed";
        // Show toast error for non-401 errors (401 is handled by interceptor)
        if (err?.response?.status !== 401) {
            showError(errorMessage);
        }
        return {
            error: {
                status: err.response?.status,
                data: err.response?.data || err.message,
            },
        };
    }
};

export const baseApi = createApi({
    reducerPath: "api", // Redux store mein is key pe cache store hogi

    // Tumhara Axios instance yahan kaam karega
    // Token, base URL, interceptors — sab existing logic se aayega automatically
    baseQuery: axiosBaseQuery(),

    // Cache invalidation tags — naya module banao to yahan tag add karo
    tagTypes: [
        "Product",
        "Category",
        "SubCategory",
        "Qarza",
        "Purchase",
        "Supplier",
        "Batch",
        "HoldOrders",
        "Orders",
        "Sales",
        "Wastage",
        "Return",
        "Expense",
        "ExpenseCategory",
        "Inventory",
        "InventoryCategory",
        "Member",
        "MemberFinance",
        "MemberAttendance",
        "MemberSalaryChange",
        "PartnerInvestment",
        "ClassPartnership",
        "Reports",
        "PurchaseReturn",
        "OrderReturn",
        "Customer",
        "Staff",
        "SalaryPayment",
        "SaleBill",
        "User",
        "Dashboard"
    ],

    // Endpoints blank — har module injectEndpoints se khud add karega
    endpoints: () => ({}),
});
