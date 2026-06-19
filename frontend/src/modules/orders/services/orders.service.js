import { baseApi } from "@app/rtkBaseApi.js";

export const ordersApi = baseApi.injectEndpoints({
    endpoints: (build) => ({
        getOrders: build.query({
            query: () => ({ url: "/orders" }),
            providesTags: ["Order"],
        }),
        generateOrderNumber: build.query({
            query: () => ({ url: "/orders/generate-number" }),
            providesTags: ["OrderNumber"],
        }),
        createOrder: build.mutation({
            query: (orderData) => ({ url: "/orders", method: "POST", body: orderData }),
            invalidatesTags: ["Order", "OrderNumber"],
        }),
        deleteOrder: build.mutation({
            query: (id) => ({ url: `/orders/${id}`, method: "DELETE" }),
            invalidatesTags: ["Order"],
        }),
    }),
});

export const {
    useGetOrdersQuery: useOrders,
    useGenerateOrderNumberQuery: useGenerateOrderNumber,
    useCreateOrderMutation: useAddOrder,
    useDeleteOrderMutation: useDeleteOrder,
} = ordersApi;
