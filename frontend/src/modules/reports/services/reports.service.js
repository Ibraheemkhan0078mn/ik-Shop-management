import { baseApi } from "../../../app/rtkBaseApi.js";

export const reportsApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({
        // Dashboard Summary
        getDashboardSummary: builder.query({
            query: () => "/reports/dashboard/summary",
            providesTags: ["Reports"],
        }),

        // Main Business Report
        getMainBusinessReport: builder.query({
            query: (params) => ({
                url: "/reports/main-business",
                params,
            }),
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

        // Expense KPI Report
        getExpenseKPIReport: builder.query({
            query: (params) => ({
                url: "/reports/expenses-kpi",
                params,
            }),
            providesTags: ["Reports"],
        }),

        // Sales KPI Report
        getSalesKPIReport: builder.query({
            query: (params) => ({
                url: "/reports/sales-kpi",
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

        // Purchase Return Report
        getPurchaseReturnReport: builder.query({
            query: (params) => ({
                url: "/reports/purchase-returns",
                params,
            }),
            providesTags: ["Reports"],
        }),

        // Sale Return Report
        getSaleReturnReport: builder.query({
            query: (params) => ({
                url: "/reports/sale-returns",
                params,
            }),
            providesTags: ["Reports"],
        }),

        // Product Wastage Report
        getProductWastageReport: builder.query({
            query: (params) => ({
                url: "/reports/product-wastage",
                params,
            }),
            providesTags: ["Reports"],
        }),

        // Customer Report
        getCustomerReport: builder.query({
            query: (params) => ({
                url: "/reports/customers",
                params,
            }),
            providesTags: ["Reports"],
        }),

        // Staff Report
        getStaffReport: builder.query({
            query: (params) => ({
                url: "/reports/staff",
                params,
            }),
            providesTags: ["Reports"],
        }),

        // Profit & Loss Report
        getProfitLossReport: builder.query({
            query: (params) => ({
                url: "/reports/profit-loss",
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
    useGetMainBusinessReportQuery,
    useGetSalesReportQuery,
    useGetPurchaseReportQuery,
    useGetFinancialReportQuery,
    useGetCreditDebitReportQuery,
    useGetExpenseReportQuery,
    useGetExpenseKPIReportQuery,
    useGetSalesKPIReportQuery,
    useGetSupplierReportQuery,
    useGetPurchaseReturnReportQuery,
    useGetSaleReturnReportQuery,
    useGetInventoryReportQuery,
    useGetProductWastageReportQuery,
    useGetCustomerReportQuery,
    useGetStaffReportQuery,
    useGetProfitLossReportQuery,
    useGetWastageReportQuery,
    useGetActivityReportQuery,
    useGetTopSellingProductsQuery,
    useGetTopCustomersQuery,
    useGetLowStockProductsQuery,
    useGetNearExpiryProductsQuery,
    useGetRecentSalesQuery,
    useGetRecentPurchasesQuery,
} = reportsApi;
