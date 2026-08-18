













import { baseApi } from "../../../app/rtkBaseApi.js";

export const productApi = baseApi.injectEndpoints({
    endpoints: (build) => ({

        // List — paginated
        getProducts: build.query({
            query: ({ page = 1, limit = 20, ...filters } = {}) => ({
                url: "/products/pagination",
                params: { page, limit, ...filters },
            }),
            transformResponse: (raw) => { return raw },
            providesTags: ["Product"],
        }),

        // Single product
        getProductById: build.query({
            query: (id) => ({ url: `/products/${id}` }),
            transformResponse: (raw) => { return raw.data },
            providesTags: (result, error, id) => [{ type: "Product", id }],
        }),

        // Create
        createProduct: build.mutation({
            query: (body) => ({ url: "/products", method: "POST", body }),
            invalidatesTags: ["Product"],
        }),

        // Update
        updateProduct: build.mutation({
            query: ({ id, payload:body }) => ({ url: `/products/${id}`, method: "PUT", body }),
            invalidatesTags: (result, error, { id }) => [{ type: "Product", id }, "Product"],
        }),

        // Delete
        deleteProduct: build.mutation({
            query: (id) => ({ url: `/products/${id}`, method: "DELETE" }),
            invalidatesTags: ["Product"],
        }),

        // Hard delete — product + all connected batches & history
        deleteProductWithBatches: build.mutation({
            query: (id) => ({ url: `/products/${id}/with-batches`, method: "DELETE" }),
            invalidatesTags: ["Product", "Batch"],
        }),

        // Upload image
        uploadProductImage: build.mutation({
            query: (formData) => ({
                url: "/products/upload-image",
                method: "POST",
                body: formData,
                formData: true,
            }),
        }),

        // Recalculate stock for a single product
        recalculateProductStock: build.mutation({
            query: (id) => ({ url: `/products/${id}/recalculate-stock`, method: "POST" }),
            invalidatesTags: (result, error, id) => [{ type: "Product", id }, "Product", "Batch"],
        }),

        // Recalculate stock for all products
        recalculateAllStock: build.mutation({
            query: () => ({ url: "/products/recalculate-all-stock", method: "POST" }),
            invalidatesTags: ["Product", "Batch"],
        }),

        // Check if product code exists
        checkProductCode: build.query({
            query: (productCode) => ({ url: `/products/check-code/${productCode}` }),
        }),

        // Get stock history for a product
        getStockHistory: build.query({
            query: (productId) => ({ url: `/products/${productId}/stock-history` }),
            transformResponse: (raw) => raw.data || raw,
            providesTags: (result, error, productId) => [{ type: "Product", id: productId }],
        }),
    }),
});

export const {
    useGetProductsQuery: useProducts,
    useGetProductByIdQuery: useProduct,
    useCreateProductMutation: useCreateProduct,
    useUpdateProductMutation: useUpdateProduct,
    useDeleteProductMutation: useDeleteProduct,
    useDeleteProductWithBatchesMutation: useDeleteProductWithBatches,
    useUploadProductImageMutation: useUploadProductImage,
    useRecalculateProductStockMutation: useRecalculateProductStock,
    useRecalculateAllStockMutation: useRecalculateAllStock,
    useGetStockHistoryQuery: useStockHistory,
} = productApi;