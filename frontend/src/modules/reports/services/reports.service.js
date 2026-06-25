import { baseApi } from "../../../app/rtkBaseApi.js";

export const reportsApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({
        // Dashboard Summary
        getDashboardSummary: builder.query({
            query: () => "/reports/dashboard/summary",
            providesTags: ["Reports"],
        }),

        // Sales Report
        getSalesReport: builder.query({
            query: (params) => ({
                url: "/reports/sales",
                params,
            }),
            providesTags: ["Reports"],
        }),

        // Purchase Report
        getPurchaseReport: builder.query({
            query: (params) => ({
                url: "/reports/purchases",
                params,
            }),
            providesTags: ["Reports"],
        }),

        // Inventory Report
        getInventoryReport: builder.query({
            query: (params) => ({
                url: "/reports/inventory",
                params,
            }),
            providesTags: ["Reports"],
        }),

        // Financial Report
        getFinancialReport: builder.query({
            query: (params) => ({
                url: "/reports/financial",
                params,
            }),
            providesTags: ["Reports"],
        }),

        // Credit/Debit Report
        getCreditDebitReport: builder.query({
            query: (params) => ({
                url: "/reports/credit-debit",
                params,
            }),
            providesTags: ["Reports"],
        }),

        // Expense Report
        getExpenseReport: builder.query({
            query: (params) => ({
                url: "/reports/expenses",
                params,
            }),
            providesTags: ["Reports"],
        }),

        // Supplier Report
        getSupplierReport: builder.query({
            query: (params) => ({
                url: "/reports/suppliers",
                params,
            }),
            providesTags: ["Reports"],
        }),

        // Wastage Report
        getWastageReport: builder.query({
            query: (params) => ({
                url: "/reports/wastage",
                params,
            }),
            providesTags: ["Reports"],
        }),

        // Activity Report
        getActivityReport: builder.query({
            query: (params) => ({
                url: "/reports/activity",
                params,
            }),
            providesTags: ["Reports"],
        }),

        // Dashboard Components
        getTopSellingProducts: builder.query({
            query: (params) => ({
                url: "/reports/dashboard/top-products",
                params,
            }),
            providesTags: ["Reports"],
        }),

        getTopCustomers: builder.query({
            query: (params) => ({
                url: "/reports/dashboard/top-customers",
                params,
            }),
            providesTags: ["Reports"],
        }),

        getLowStockProducts: builder.query({
            query: (params) => ({
                url: "/reports/dashboard/low-stock",
                params,
            }),
            providesTags: ["Reports"],
        }),

        getNearExpiryProducts: builder.query({
            query: (params) => ({
                url: "/reports/dashboard/near-expiry",
                params,
            }),
            providesTags: ["Reports"],
        }),

        getRecentSales: builder.query({
            query: (params) => ({
                url: "/reports/dashboard/recent-sales",
                params,
            }),
            providesTags: ["Reports"],
        }),

        getRecentPurchases: builder.query({
            query: (params) => ({
                url: "/reports/dashboard/recent-purchases",
                params,
            }),
            providesTags: ["Reports"],
        }),
    }),
});

export const {
    useGetDashboardSummaryQuery,
    useGetSalesReportQuery,
    useGetPurchaseReportQuery,
    useGetFinancialReportQuery,
    useGetCreditDebitReportQuery,
    useGetExpenseReportQuery,
    useGetSupplierReportQuery,
    useGetWastageReportQuery,
    useGetActivityReportQuery,
    useGetTopSellingProductsQuery,
    useGetTopCustomersQuery,
    useGetLowStockProductsQuery,
    useGetNearExpiryProductsQuery,
    useGetRecentSalesQuery,
    useGetRecentPurchasesQuery,
} = reportsApi;
