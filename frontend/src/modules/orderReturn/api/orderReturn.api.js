// ─── api/productReturn.api.js ─────────────────────────────────────────
import { baseApi } from "../../../app/rtkBaseApi.js";

export const orderReturnApi = baseApi.injectEndpoints({
    endpoints: (build) => ({
        // Generate return number
        generateReturnNumber: build.query({
            query: () => "/product-returns/generate-number",
        }),
        // Get order for return
        getOrderForReturn: build.query({
            query: (orderNumber) => `/product-returns/order/${orderNumber}`,
        }),
        // Get all order returns
        getAllOrderReturns: build.query({
            query: (params) => ({ url: "/product-returns", params }),
            providesTags: ["OrderReturn"],
        }),
        // Get paginated order returns
        getPaginatedOrderReturns: build.query({
            query: ({ page = 1, limit = 20, ...filters } = {}) => ({
                url: "/product-returns/pagination",
                params: { page, limit, ...filters }
            }),
            providesTags: ["OrderReturn"],
        }),
        // Get order return by ID
        getOrderReturnById: build.query({
            query: (id) => `/product-returns/${id}`,
            providesTags: (result, error, id) => [{ type: "OrderReturn", id }],
        }),
        // Create order return
        createOrderReturn: build.mutation({
            query: (data) => ({
                url: "/product-returns",
                method: "POST",
                body: data,
            }),
            invalidatesTags: ["OrderReturn", "Product"],
        }),
        // Update order return
        updateOrderReturn: build.mutation({
            query: ({ id, ...data }) => ({
                url: `/product-returns/${id}`,
                method: "PUT",
                body: data,
            }),
            invalidatesTags: (result, error, { id }) => [{ type: "OrderReturn", id }, "OrderReturn"],
        }),
        // Delete order return
        deleteOrderReturn: build.mutation({
            query: (id) => ({
                url: `/product-returns/${id}`,
                method: "DELETE",
            }),
            invalidatesTags: ["OrderReturn"],
        }),
        // Update return status
        updateReturnStatus: build.mutation({
            query: ({ id, status }) => ({
                url: `/product-returns/${id}/status`,
                method: "PATCH",
                body: { status },
            }),
            invalidatesTags: (result, error, { id }) => [{ type: "OrderReturn", id }, "OrderReturn"],
        }),
    }),
});

export const {
    useGenerateReturnNumberQuery,
    useGetOrderForReturnQuery,
    useGetAllOrderReturnsQuery,
    useGetPaginatedOrderReturnsQuery,
    useGetOrderReturnByIdQuery,
    useCreateOrderReturnMutation,
    useUpdateOrderReturnMutation,
    useDeleteOrderReturnMutation,
    useUpdateReturnStatusMutation,
} = orderReturnApi;
