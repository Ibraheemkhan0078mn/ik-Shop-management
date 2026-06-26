import { baseApi } from "../../../app/rtkBaseApi.js";

export const ordersApi = baseApi.injectEndpoints({
    endpoints: (build) => ({
        getOrders: build.query({
            query: () => ({ url: "/orders" }),
            providesTags: ["Orders"],
        }),
        getPaginatedOrders: build.query({
            query: ({ page = 1, limit = 20 }) => ({ url: "/orders/paginated", params: { page, limit } }),
            providesTags: ["Orders"],
        }),
        generateOrderNumber: build.query({
            query: () => ({ url: "/orders/generate-number" }),
            providesTags: ["OrderNumber"],
        }),
        createOrder: build.mutation({
            query: (orderData) => ({ url: "/orders", method: "POST", body: orderData }),
            invalidatesTags: ["Orders", "OrderNumber"],
        }),
        deleteOrder: build.mutation({
            query: (id) => ({ url: `/orders/${id}`, method: "DELETE" }),
            invalidatesTags: ["Orders"],
        }),
    }),
});

export const {
    useGetOrdersQuery: useOrders,
    useGetPaginatedOrdersQuery: usePaginatedOrders,
    useGenerateOrderNumberQuery: useGenerateOrderNumber,
    useCreateOrderMutation: useAddOrder,
    useDeleteOrderMutation: useDeleteOrder,
} = ordersApi;
