import { baseApi } from "../../../app/rtkBaseApi.js";

export const ordersApi = baseApi.injectEndpoints({
    endpoints: (build) => ({
        getOrders: build.query({
            query: () => ({ url: "/orders" }),
            providesTags: ["Orders"],
        }),
        getPaginatedOrders: build.query({
            query: ({ page = 1, limit = 20, startDate, endDate }) => ({ 
                url: "/orders/paginated", 
                params: { page, limit, startDate, endDate } 
            }),
            providesTags: ["Orders"],
        }),
        getOrdersByCustomer: build.query({
            query: ({ customerId, startDate, endDate }) => ({
                url: "/orders/by-customer",
                params: { customerId, startDate, endDate },
            }),
            providesTags: (result, error, { customerId }) => [{ type: "Orders", id: customerId }],
        }),
        getOrder: build.query({
            query: (id) => ({ url: `/orders/${id}` }),
            providesTags: (result, error, id) => [{ type: "Orders", id }],
        }),
        getOrderById: build.query({
            query: (id) => ({ url: `/orders/getOrderById/${id}` }),
            providesTags: (result, error, id) => [{ type: "Orders", id }],
        }),
        generateOrderNumber: build.query({
            query: () => ({ url: "/orders/generate-number" }),
            providesTags: ["OrderNumber"],
        }),
        createOrder: build.mutation({
            query: (orderData) => ({ url: "/orders", method: "POST", body: orderData }),
            invalidatesTags: ["Orders", "OrderNumber", "Product", "Batch"],
        }),
        deleteOrder: build.mutation({
            query: (id) => ({ url: `/orders/${id}`, method: "DELETE" }),
            invalidatesTags: ["Orders", "Product", "Batch"],
        }),
    }),
});

export const {
    useGetOrdersQuery: useOrders,
    useGetPaginatedOrdersQuery: usePaginatedOrders,
    useGetOrdersByCustomerQuery: useOrdersByCustomer,
    useGetOrderQuery: useOrder,
    useGetOrderByIdQuery: useOrderById,
    useGenerateOrderNumberQuery: useGenerateOrderNumber,
    useCreateOrderMutation: useAddOrder,
    useDeleteOrderMutation: useDeleteOrder,
} = ordersApi;
