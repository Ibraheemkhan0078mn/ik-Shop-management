


import { baseApi } from "@app/rtkBaseApi.js";

export const subCategoryApi = baseApi.injectEndpoints({
    endpoints: (build) => ({

        // List — paginated
        getSubCategories: build.query({
            query: ({ page = 1, limit = 20, ...filters } = {}) => ({
                url: "/products/subCategories/getPaginationSubCategories",
                params: { page, limit, ...filters },
            }),
            transformResponse: (r) => r.data,
            providesTags: ["SubCategory"],
        }),

        // Single product
        getSubCategoryById: build.query({
            query: (id) => ({ url: `/products/subCategories/getSubCategoriesById/${id}` }),
            transformResponse: (raw) => { return raw.data },
            providesTags: (result, error, id) => [{ type: "SubCategory", id }],
        }),
        getSubCategoriesByCatagId: build.query({
            query: (categoryId) => ({
                url: `/products/subCategories/getSubCategoriesByCatagId/${categoryId}`,
            }),
            transformResponse: (raw) => raw.data || [],
            providesTags: (result, error, id) => [{ type: "SubCategory", id }, "SubCategory"],
        }),
        // Create
        createSubCategory: build.mutation({
            query: (body) => ({ url: "/products/subCategories", method: "POST", body }),
            invalidatesTags: ["SubCategory"],
        }),

        // Update
        updateSubCategory: build.mutation({
            query: ({ id, ...body }) => ({ url: `/products/subCategories/${id}`, method: "PUT", body }),
            invalidatesTags: (result, error, { id }) => [{ type: "SubCategory", id }, "SubCategory", "SubCategoryCategory"],
        }),

        // Delete
        deleteSubCategory: build.mutation({
            query: (id) => ({ url: `/products/subCategories/${id}`, method: "DELETE" }),
            invalidatesTags: ["SubCategory"],
        }),
    }),
});

export const {
    useGetSubCategoriesQuery,
    useGetSubCategoryByIdQuery,
    useCreateSubCategoryMutation,
    useUpdateSubCategoryMutation,
    useDeleteSubCategoryMutation,
    useGetSubCategoriesByCatagIdQuery

} = subCategoryApi;