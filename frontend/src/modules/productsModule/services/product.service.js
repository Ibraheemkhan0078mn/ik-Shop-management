// import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
// import { ProductService } from "../api/productsApi";
// import { toast } from "sonner";
// import { useNavigate } from "react-router-dom";

// export const PRODUCT_QUERY_KEYS = {
//     all: ["products"],
//     detail: (id) => ["products", id],
// };

// export const useProducts = () => {
//     return useQuery({
//         queryKey: PRODUCT_QUERY_KEYS.all,
//         queryFn: ProductService.getAll,
//     });
// };

// export const useProduct = (id) => {
//     return useQuery({
//         queryKey: PRODUCT_QUERY_KEYS.detail(id),
//         queryFn: () => ProductService.getById(id),
//         enabled: !!id,
//     });
// };

// export const useCreateProduct = () => {
//     const queryClient = useQueryClient();
//     const navigate = useNavigate();
//     return useMutation({
//         mutationFn: ProductService.create,
//         onSuccess: () => {
//             toast.success("Product created successfully");
//             queryClient.invalidateQueries({ queryKey: PRODUCT_QUERY_KEYS.all });
//             navigate("/products");
//         },
//     });
// };

// export const useUpdateProduct = () => {
//     const queryClient = useQueryClient();
//     const navigate = useNavigate();
//     return useMutation({
//         mutationFn: ProductService.update,
//         onSuccess: (_, variables) => {
//             toast.success("Product updated successfully");
//             queryClient.invalidateQueries({ queryKey: PRODUCT_QUERY_KEYS.all });
//             queryClient.invalidateQueries({
//                 queryKey: PRODUCT_QUERY_KEYS.detail(variables.id),
//             });
//             navigate("/products");
//         },
//     });
// };

// export const useDeleteProduct = () => {
//     const queryClient = useQueryClient();
//     const navigate = useNavigate();
//     return useMutation({
//         mutationFn: ProductService.delete,
//         onSuccess: () => {
//             toast.success("Product deleted successfully");
//             queryClient.invalidateQueries({ queryKey: PRODUCT_QUERY_KEYS.all });
//             navigate("/products");
//         },
//     });
// };














import { baseApi } from "../../../app/rtkBaseApi.js";

export const productApi = baseApi.injectEndpoints({
    endpoints: (build) => ({

        // List — paginated
        getProducts: build.query({
            query: ({ page = 1, limit = 20, ...filters } = {}) => ({
                url: "/products/pagination",
                params: { page, limit, ...filters },
            }),
            transformResponse: (raw) => { return raw.data },
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
            query: ({ id, ...body }) => ({ url: `/products/${id}`, method: "PUT", body }),
            invalidatesTags: (result, error, { id }) => [{ type: "Product", id }, "Product"],
        }),

        // Delete
        deleteProduct: build.mutation({
            query: (id) => ({ url: `/products/${id}`, method: "DELETE" }),
            invalidatesTags: ["Product"],
        }),
    }),
});

export const {
    useGetProductsQuery: useProducts,
    useGetProductByIdQuery: useProduct,
    useCreateProductMutation: useCreateProduct,
    useUpdateProductMutation: useUpdateProduct,
    useDeleteProductMutation: useDeleteProduct,
} = productApi;