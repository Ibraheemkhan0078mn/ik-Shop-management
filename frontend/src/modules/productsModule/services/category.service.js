


import { baseApi } from "@app/rtkBaseApi.js";

export const categoryApi = baseApi.injectEndpoints({
    endpoints: (build) => ({

        // List — paginated
        getCategories: build.query({
            query: ({ page = 1, limit = 20, ...filters } = {}) => ({
                url: "/api/categories/getPaginationCategories",
                params: { page, limit, ...filters },
            }),
            transformResponse: (raw) => { return raw.data },
            providesTags: ["Category"],
        }),

        // Single product
        getCategoryById: build.query({
            query: (id) => ({ url: `/api/categories/getCategoryById/${id}` }),
            transformResponse: (raw) => { return raw.data },
            providesTags: (result, error, id) => [{ type: "Category", id }],
        }),

        // Create
        createCategory: build.mutation({
            query: (body) => ({ url: "/api/categories", method: "POST", body }),
            invalidatesTags: ["Category"],
        }),

        // Update
        updateCategory: build.mutation({
            query: ({ id, ...body }) => ({ url: `/api/categories/${id}`, method: "PUT", body }),
            invalidatesTags: (result, error, { id }) => [{ type: "Category", id }, "Category"],
        }),

        // Delete
        deleteCategory: build.mutation({
            query: (id) => ({ url: `/api/categories/${id}`, method: "DELETE" }),
            invalidatesTags: ["Category"],
        }),
    }),
});

export const {
    useGetCategoriesQuery,
    useGetCategoryByIdQuery,
    useCreateCategoryMutation,
    useUpdateCategoryMutation,
    useDeleteCategoryMutation,
} = categoryApi;