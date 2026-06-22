import { baseApi } from "../../../app/rtkBaseApi.js";

export const productReturnApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({
        // Generate return number
        generateReturnNumber: builder.query({
            query: () => "/product-returns/generate-number",
            providesTags: ["ProductReturn"],
        }),

        // Get order by order number for return
        getOrderForReturn: builder.query({
            query: (orderNumber) => `/product-returns/order/${orderNumber}`,
            providesTags: ["ProductReturn"],
        }),

        // Create product return
        createProductReturn: builder.mutation({
            query: (data) => ({
                url: "/product-returns",
                method: "POST",
                body: data,
            }),
            invalidatesTags: ["ProductReturn"],
        }),

        // Get all product returns
        getAllProductReturns: builder.query({
            query: (params) => ({
                url: "/product-returns",
                params,
            }),
            providesTags: ["ProductReturn"],
        }),

        // Get paginated product returns
        getPaginatedProductReturns: builder.query({
            query: ({ page = 1, limit = 20, ...filters } = {}) => ({
                url: "/product-returns/pagination",
                params: { page, limit, ...filters },
            }),
            providesTags: ["ProductReturn"],
        }),

        // Get product return by ID
        getProductReturnById: builder.query({
            query: (id) => `/product-returns/${id}`,
            providesTags: (result, error, id) => [{ type: "ProductReturn", id }],
        }),

        // Update product return
        updateProductReturn: builder.mutation({
            query: ({ id, data }) => ({
                url: `/product-returns/${id}`,
                method: "PUT",
                body: data,
            }),
            invalidatesTags: (result, error, { id }) => [
                { type: "ProductReturn", id },
                "ProductReturn",
            ],
        }),

        // Delete product return
        deleteProductReturn: builder.mutation({
            query: (id) => ({
                url: `/product-returns/${id}`,
                method: "DELETE",
            }),
            invalidatesTags: ["ProductReturn"],
        }),

        // Update return status
        updateReturnStatus: builder.mutation({
            query: ({ id, status }) => ({
                url: `/product-returns/${id}/status`,
                method: "PATCH",
                body: { status },
            }),
            invalidatesTags: (result, error, { id }) => [
                { type: "ProductReturn", id },
                "ProductReturn",
            ],
        }),
    }),
});

export const {
    useGenerateReturnNumberQuery,
    useGetOrderForReturnQuery,
    useCreateProductReturnMutation,
    useGetAllProductReturnsQuery,
    useGetPaginatedProductReturnsQuery,
    useGetProductReturnByIdQuery,
    useUpdateProductReturnMutation,
    useDeleteProductReturnMutation,
    useUpdateReturnStatusMutation,
} = productReturnApi;
