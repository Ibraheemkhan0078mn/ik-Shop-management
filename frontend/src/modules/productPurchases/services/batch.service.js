import { baseApi } from "../../../app/rtkBaseApi.js";

export const batchApi = baseApi.injectEndpoints({
    endpoints: (build) => ({

        // List — paginated
        getBatches: build.query({
            query: ({ page = 1, limit = 20, ...filters } = {}) => ({
                url: "/batches/pagination",
                params: { page, limit, ...filters },
            }),
            transformResponse: (raw) => raw.data || raw,
            providesTags: ["Batch"],
        }),

        // All batches — without pagination
        getAllBatches: build.query({
            query: () => ({ url: "/batches" }),
            transformResponse: (raw) => raw.data || raw,
            providesTags: ["Batch"],
        }),

        // Batches by product ID
        getBatchesByProduct: build.query({
            query: (productId) => ({ url: `/batches/${productId}/getBatchesById` }),
            transformResponse: (raw) => raw.data || raw,
            providesTags: (result, error, productId) => [{ type: "Batch", id: productId }],
        }),

        // Single batch
        getBatchById: build.query({
            query: (id) => ({ url: `/batches/${id}` }),
            transformResponse: (raw) => raw.data || raw,
            providesTags: (result, error, id) => [{ type: "Batch", id }],
        }),

        // Create
        createBatch: build.mutation({
            query: (body) => ({ url: "/batches", method: "POST", body }),
            invalidatesTags: ["Batch"],
        }),

        // Update
        updateBatch: build.mutation({
            query: ({ id, ...body }) => ({ url: `/batches/${id}`, method: "PUT", body }),
            invalidatesTags: (result, error, { id }) => [{ type: "Batch", id }, "Batch"],
        }),

        // Delete
        deleteBatch: build.mutation({
            query: (id) => ({ url: `/batches/${id}`, method: "DELETE" }),
            invalidatesTags: ["Batch"],
        }),
    }),
});

export const {
    useGetBatchesQuery:          useBatches,
    useGetAllBatchesQuery:       useAllBatches,
    useGetBatchesByProductQuery: useBatchesByProduct,
    useGetBatchByIdQuery:        useBatch,
    useCreateBatchMutation:      useCreateBatch,
    useUpdateBatchMutation:      useUpdateBatch,
    useDeleteBatchMutation:      useDeleteBatch,
} = batchApi;