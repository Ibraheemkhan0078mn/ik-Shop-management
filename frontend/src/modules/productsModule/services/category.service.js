


import { baseApi } from "@app/rtkBaseApi.js";

export const categoryApi = baseApi.injectEndpoints({
    endpoints: (build) => ({

        // List — paginated
        getCategories: build.query({
            query: ({ page = 1, limit = 20, ...filters } = {}) => ({
                url: "/categories/getPaginationCategories",
                params: { page, limit, ...filters },
            }),
            transformResponse: (raw) => {
                const payload = raw?.data ?? raw;
                const items = Array.isArray(payload?.items)
                    ? payload.items
                    : Array.isArray(payload?.docs)
                        ? payload.docs
                        : Array.isArray(payload?.results)
                            ? payload.results
                            : Array.isArray(payload?.data)
                                ? payload.data
                                : Array.isArray(payload)
                                    ? payload
                                    : [];
                return {
                    data: items,
                    total: payload?.total ?? raw?.total ?? raw?.count ?? payload?.count ?? items.length,
                };
            },
            providesTags: ["Category"],
        }),

        // Single product
        getCategoryById: build.query({
            query: (id) => ({ url: `/categories/getCategoryById/${id}` }),
            transformResponse: (raw) => { return raw.data },
            providesTags: (result, error, id) => [{ type: "Category", id }],
        }),

        // Create
        createCategory: build.mutation({
            query: (body) => ({ url: "/categories", method: "POST", body }),
            invalidatesTags: ["Category"],
        }),

        // Update
        updateCategory: build.mutation({
            query: ({ id, ...body }) => ({ url: `/categories/${id}`, method: "PUT", body }),
            invalidatesTags: (result, error, { id }) => [{ type: "Category", id }, "Category"],
        }),

        // Delete
        deleteCategory: build.mutation({
            query: (id) => ({ url: `/categories/${id}`, method: "DELETE" }),
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