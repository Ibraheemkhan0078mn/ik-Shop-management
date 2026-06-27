import { baseApi } from "../../../app/rtkBaseApi.js";

export const dashboardApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    // Sales & Revenue KPIs
    getSalesRevenueKPIs: build.query({
      query: (range = '30D') => ({
        url: '/dashboard/sales-revenue',
        params: { range },
      }),
      transformResponse: (response) => response.data,
      providesTags: ['Dashboard'],
    }),

    // Inventory Alert KPIs
    getInventoryAlertKPIs: build.query({
      query: (range = '30D') => ({
        url: '/dashboard/inventory-alerts',
        params: { range },
      }),
      transformResponse: (response) => response.data,
      providesTags: ['Dashboard'],
    }),

    // Expiry Products (paginated)
    getExpiryProducts: build.query({
      query: ({ range = '30D', page = 1, limit = 10 }) => ({
        url: '/dashboard/expiry-products',
        params: { range, page, limit },
      }),
      transformResponse: (response) => response.data,
      providesTags: ['Dashboard'],
    }),

    // Low Stock Products (paginated)
    getLowStockProducts: build.query({
      query: ({ page = 1, limit = 10 }) => ({
        url: '/dashboard/low-stock',
        params: { page, limit },
      }),
      transformResponse: (response) => response.data,
      providesTags: ['Dashboard'],
    }),

    // Out of Stock Products (paginated)
    getOutOfStockProducts: build.query({
      query: ({ page = 1, limit = 10 }) => ({
        url: '/dashboard/out-of-stock',
        params: { page, limit },
      }),
      transformResponse: (response) => response.data,
      providesTags: ['Dashboard'],
    }),

    // Revenue Over Time
    getRevenueOverTime: build.query({
      query: (range = '30D') => ({
        url: '/dashboard/revenue-over-time',
        params: { range },
      }),
      transformResponse: (response) => response.data,
      providesTags: ['Dashboard'],
    }),

    // Orders Over Time
    getOrdersOverTime: build.query({
      query: (range = '30D') => ({
        url: '/dashboard/orders-over-time',
        params: { range },
      }),
      transformResponse: (response) => response.data,
      providesTags: ['Dashboard'],
    }),

    // Top Selling Products
    getTopSellingProducts: build.query({
      query: ({ range = '30D', metric = 'revenue' }) => ({
        url: '/dashboard/top-products',
        params: { range, metric },
      }),
      transformResponse: (response) => response.data,
      providesTags: ['Dashboard'],
    }),

    // Sales by Category
    getSalesByCategory: build.query({
      query: (range = '30D') => ({
        url: '/dashboard/sales-by-category',
        params: { range },
      }),
      transformResponse: (response) => response.data,
      providesTags: ['Dashboard'],
    }),

    // Retail vs Wholesale Comparison
    getRetailVsWholesaleComparison: build.query({
      query: (range = '30D') => ({
        url: '/dashboard/retail-wholesale',
        params: { range },
      }),
      transformResponse: (response) => response.data,
      providesTags: ['Dashboard'],
    }),

    // Stock Level by Category
    getStockLevelByCategory: build.query({
      query: () => ({
        url: '/dashboard/stock-by-category',
      }),
      transformResponse: (response) => response.data,
      providesTags: ['Dashboard'],
    }),

    // Inventory Value by Category
    getInventoryValueByCategory: build.query({
      query: () => ({
        url: '/dashboard/inventory-value-by-category',
      }),
      transformResponse: (response) => response.data,
      providesTags: ['Dashboard'],
    }),
  }),
});

export const {
  useGetSalesRevenueKPIsQuery,
  useGetInventoryAlertKPIsQuery,
  useGetExpiryProductsQuery,
  useGetLowStockProductsQuery,
  useGetOutOfStockProductsQuery,
  useGetRevenueOverTimeQuery,
  useGetOrdersOverTimeQuery,
  useGetTopSellingProductsQuery,
  useGetSalesByCategoryQuery,
  useGetRetailVsWholesaleComparisonQuery,
  useGetStockLevelByCategoryQuery,
  useGetInventoryValueByCategoryQuery,
} = dashboardApi;
