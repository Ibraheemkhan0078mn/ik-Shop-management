// ─── api/productReturn.api.js ─────────────────────────────────────────
import { baseApi } from "../../../app/rtkBaseApi.js";

export const orderReturnApi = baseApi.injectEndpoints({
    endpoints: (build) => ({
        // Generate return number
        generateReturnNumber: build.query({
            query: () => ({ url: "/product-returns/generate-number" }),
            transformResponse: (res) => res.data,
        }),
        // Get order for return
        getOrderForReturn: build.query({
            query: (orderNumber) => ({ url: `/product-returns/order/${orderNumber}` }),
            transformResponse: (res) => res.data,
        }),
        // Get all order returns
        getAllOrderReturns: build.query({
            query: (params) => ({ url: "/product-returns", params }),
            providesTags: ["OrderReturn"],
            transformResponse: (res) => res.data,
        }),
        // Get paginated order returns
        getPaginatedOrderReturns: build.query({
            query: ({ page = 1, limit = 20, ...filters } = {}) => ({
                url: "/product-returns/pagination",
                params: { page, limit, ...filters }
            }),
            providesTags: ["OrderReturn"],
            transformResponse: (res) => res,
        }),
        // Get returns by order ID
        getReturnsByOrderId: build.query({
            query: (orderId) => ({ url: "/product-returns", params: { referenceOrderId: orderId } }),
            providesTags: ["OrderReturn"],
            transformResponse: (res) => res.data || [],
        }),
        // Get order return by ID
        getOrderReturnById: build.query({
            query: (id) => ({ url: `/product-returns/${id}` }),
            providesTags: (result, error, id) => [{ type: "OrderReturn", id }],
            transformResponse: (res) => res.data,
        }),
        // Create order return
        createOrderReturn: build.mutation({
            query: (data) => ({
                url: "/product-returns",
                method: "POST",
                body: data,
            }),
            invalidatesTags: ["OrderReturn", "Product", "Batch"],
        }),
        // Update order return
        updateOrderReturn: build.mutation({
            query: ({ id, ...data }) => ({
                url: `/product-returns/${id}`,
                method: "PUT",
                body: data,
            }),
            invalidatesTags: (result, error, { id }) => [{ type: "OrderReturn", id }, "OrderReturn", "Product", "Batch"],
        }),
        // Delete order return
        deleteOrderReturn: build.mutation({
            query: (id) => ({
                url: `/product-returns/${id}`,
                method: "DELETE",
            }),
            invalidatesTags: ["OrderReturn", "Product", "Batch"],
        }),
        // Update return status
        updateReturnStatus: build.mutation({
            query: ({ id, status }) => ({
                url: `/product-returns/${id}/status`,
                method: "PATCH",
                body: { status },
            }),
            invalidatesTags: (result, error, { id }) => [{ type: "OrderReturn", id }, "OrderReturn", "Product", "Batch"],
        }),
        // Approve order return
        approveOrderReturn: build.mutation({
            query: (id) => ({
                url: `/product-returns/${id}/approve`,
                method: "PATCH",
            }),
            invalidatesTags: (result, error, id) => [{ type: "OrderReturn", id }, "OrderReturn", "Product", "Batch"],
        }),
        addOrderReturnRefund: build.mutation({
            query: ({ id, ...data }) => ({
                url: `/product-returns/${id}/refunds`,
                method: "POST",
                body: data,
            }),
            invalidatesTags: (result, error, { id }) => [{ type: "OrderReturn", id }, "OrderReturn"],
        }),
        getOrderReturnRefunds: build.query({
            query: (id) => ({ url: `/product-returns/${id}/refunds` }),
            providesTags: (result, error, id) => [{ type: "OrderReturn", id }, "OrderReturnRefunds"],
            transformResponse: (res) => res.data,
        }),
        deleteOrderReturnRefund: build.mutation({
            query: ({ returnId, refundId }) => ({
                url: `/product-returns/${returnId}/refunds/${refundId}`,
                method: "DELETE",
            }),
            invalidatesTags: (result, error, { returnId }) => [{ type: "OrderReturn", returnId }, "OrderReturnRefunds"],
        }),
        updateOrderReturnRefund: build.mutation({
            query: ({ returnId, refundId, ...data }) => ({
                url: `/product-returns/${returnId}/refunds/${refundId}`,
                method: "PUT",
                body: data,
            }),
            invalidatesTags: (result, error, { returnId }) => [{ type: "OrderReturn", returnId }, "OrderReturnRefunds"],
        }),
        // Order return payment endpoints (new transaction system)
        addOrderReturnPayment: build.mutation({
            query: ({ id, ...data }) => ({
                url: `/product-returns/${id}/payments`,
                method: "POST",
                body: data,
            }),
            invalidatesTags: (result, error, { id }) => [{ type: "OrderReturn", id }, "OrderReturnPayments"],
        }),
        getOrderReturnPayments: build.query({
            query: (id) => ({ url: `/product-returns/${id}/payments` }),
            providesTags: (result, error, id) => [{ type: "OrderReturn", id }, "OrderReturnPayments"],
            transformResponse: (res) => res.payments || res.data || [],
        }),
        deleteOrderReturnPayment: build.mutation({
            query: ({ id, paymentId }) => ({
                url: `/product-returns/${id}/payments/${paymentId}`,
                method: "DELETE",
            }),
            invalidatesTags: (result, error, { id }) => [{ type: "OrderReturn", id }, "OrderReturnPayments"],
        }),
        recalculateOrderReturn: build.mutation({
            query: (id) => ({
                url: `/product-returns/${id}/recalculate`,
                method: "PATCH",
            }),
            invalidatesTags: (result, error, id) => [{ type: "OrderReturn", id }],
        }),
    }),
});

export const {
    useGenerateReturnNumberQuery,
    useGetOrderForReturnQuery,
    useGetAllOrderReturnsQuery,
    useGetPaginatedOrderReturnsQuery,
    useGetReturnsByOrderIdQuery,
    useGetOrderReturnByIdQuery,
    useCreateOrderReturnMutation,
    useUpdateOrderReturnMutation,
    useDeleteOrderReturnMutation,
    useUpdateReturnStatusMutation,
    useApproveOrderReturnMutation,
    useAddOrderReturnRefundMutation,
    useGetOrderReturnRefundsQuery,
    useDeleteOrderReturnRefundMutation,
    useUpdateOrderReturnRefundMutation,
    useAddOrderReturnPaymentMutation,
    useGetOrderReturnPaymentsQuery,
    useDeleteOrderReturnPaymentMutation,
    useRecalculateOrderReturnMutation,
} = orderReturnApi;
