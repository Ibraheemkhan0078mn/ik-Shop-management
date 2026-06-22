// ─── services/orderReturn.service.js ──────────────────────────────────────
import { baseApi } from "../../../app/rtkBaseApi.js";

export const orderReturnApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({
        generateReturnNumber: builder.query({
            query: () => "/product-returns/generate-number",
            providesTags: ["OrderReturn"],
        }),

        getOrderForReturn: builder.query({
            query: (orderNumber) => `/product-returns/order/${orderNumber}`,
            providesTags: ["OrderReturn"],
        }),

        createOrderReturn: builder.mutation({
            query: (data) => ({
                url: "/product-returns",
                method: "POST",
                body: data,
            }),
            invalidatesTags: ["OrderReturn"],
        }),

        getAllOrderReturns: builder.query({
            query: (params) => ({
                url: "/product-returns",
                params,
            }),
            providesTags: ["OrderReturn"],
        }),

        getPaginatedOrderReturns: builder.query({
            query: ({ page = 1, limit = 20, ...filters } = {}) => ({
                url: "/product-returns/pagination",
                params: { page, limit, ...filters },
            }),
            providesTags: ["OrderReturn"],
        }),

        getOrderReturnById: builder.query({
            query: (id) => `/product-returns/${id}`,
            providesTags: (result, error, id) => [{ type: "OrderReturn", id }],
        }),

        updateOrderReturn: builder.mutation({
            query: ({ id, data }) => ({
                url: `/product-returns/${id}`,
                method: "PUT",
                body: data,
            }),
            invalidatesTags: (result, error, { id }) => [
                { type: "OrderReturn", id },
                "OrderReturn",
            ],
        }),

        deleteOrderReturn: builder.mutation({
            query: (id) => ({
                url: `/product-returns/${id}`,
                method: "DELETE",
            }),
            invalidatesTags: ["OrderReturn"],
        }),

        updateReturnStatus: builder.mutation({
            query: ({ id, status }) => ({
                url: `/product-returns/${id}/status`,
                method: "PATCH",
                body: { status },
            }),
            invalidatesTags: (result, error, { id }) => [
                { type: "OrderReturn", id },
                "OrderReturn",
            ],
        }),
    }),
});

export const {
    useGenerateReturnNumberQuery,
    useGetOrderForReturnQuery,
    useCreateOrderReturnMutation,
    useGetAllOrderReturnsQuery,
    useGetPaginatedOrderReturnsQuery,
    useGetOrderReturnByIdQuery,
    useUpdateOrderReturnMutation,
    useDeleteOrderReturnMutation,
    useUpdateReturnStatusMutation,
} = orderReturnApi;