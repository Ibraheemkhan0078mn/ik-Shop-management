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
            transformResponse: (res) => { return res.data },
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
        // Get Order Payments
        getOrderPayments: build.query({
            query: (orderId) => ({ url: `/orders/${orderId}/payments` }),
            transformResponse: (raw) => raw.data || raw,
            providesTags: (result, error, orderId) => [{ type: "Orders", id: `payments-${orderId}` }],
        }),
        // Get Order Payment Status
        getOrderPaymentStatus: build.query({
            query: (orderId) => ({ url: `/orders/${orderId}/payment-status` }),
            transformResponse: (raw) => raw.data || raw,
            providesTags: (result, error, orderId) => [{ type: "Orders", id: `payment-status-${orderId}` }],
        }),
        // Create Order Payment
        createOrderPayment: build.mutation({
            query: ({ orderId, ...body }) => ({ url: `/orders/${orderId}/payments`, method: "POST", body }),
            invalidatesTags: ["Orders"],
        }),
        // Update Order Payment
        updateOrderPayment: build.mutation({
            query: ({ paymentId, ...body }) => ({ 
                url: `/orders/payments/${paymentId}`, 
                method: "PUT", 
                body 
            }),
            invalidatesTags: (result, error, { orderId }) => ["Orders", { type: "Orders", id: `payments-${orderId}` }],
        }),
        // Delete Order Payment
        deleteOrderPayment: build.mutation({
            query: ({ paymentId }) => ({ 
                url: `/orders/payments/${paymentId}`, 
                method: "DELETE" 
            }),
            invalidatesTags: (result, error, { orderId }) => ["Orders", { type: "Orders", id: `payments-${orderId}` }],
        }),
        // Recalculate Order Paid Amount
        recalculateOrderPaidAmount: build.mutation({
            query: (orderId) => ({ url: `/orders/${orderId}/recalculate-payment`, method: "POST" }),
            invalidatesTags: (result, error, orderId) => ["Orders", { type: "Orders", id: orderId }],
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
    useGetOrderPaymentsQuery: useGetOrderPayments,
    useGetOrderPaymentStatusQuery: useGetOrderPaymentStatus,
    useCreateOrderPaymentMutation: useCreateOrderPayment,
    useUpdateOrderPaymentMutation: useUpdateOrderPayment,
    useDeleteOrderPaymentMutation: useDeleteOrderPayment,
    useRecalculateOrderPaidAmountMutation: useRecalculateOrderPaidAmount,
} = ordersApi;
