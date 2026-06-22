













import { baseApi } from "@app/rtkBaseApi.js";

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

        // Upload image
        uploadProductImage: build.mutation({
            query: (formData) => ({
                url: "/products/upload-image",
                method: "POST",
                body: formData,
                formData: true,
            }),
        }),
    }),
});

export const {
    useGetProductsQuery: useProducts,
    useGetProductByIdQuery: useProduct,
    useCreateProductMutation: useCreateProduct,
    useUpdateProductMutation: useUpdateProduct,
    useDeleteProductMutation: useDeleteProduct,
    useUploadProductImageMutation: useUploadProductImage,
} = productApi;