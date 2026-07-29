import { baseApi } from "../../../app/rtkBaseApi.js";

export const brandApi = baseApi.injectEndpoints({
    endpoints: (build) => ({

        // List — paginated
        getBrands: build.query({
            query: ({ page = 1, limit = 20, ...filters } = {}) => ({
                url: "/brands/getPaginationBrands",
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
            providesTags: ["Brand"],
        }),

        // Single brand
        getBrandById: build.query({
            query: (id) => ({ url: `/brands/getBrandById/${id}` }),
            transformResponse: (raw) => { return raw.data },
            providesTags: (result, error, id) => [{ type: "Brand", id }],
        }),

        // Create
        createBrand: build.mutation({
            query: (body) => ({ url: "/brands", method: "POST", body }),
            invalidatesTags: ["Brand"],
        }),

        // Update
        updateBrand: build.mutation({
            query: ({ id, ...body }) => ({ url: `/brands/${id}`, method: "PUT", body }),
            invalidatesTags: (result, error, { id }) => [{ type: "Brand", id }, "Brand"],
        }),

        // Delete
        deleteBrand: build.mutation({
            query: (id) => ({ url: `/brands/${id}`, method: "DELETE" }),
            invalidatesTags: ["Brand"],
        }),
    }),
});

export const {
    useGetBrandsQuery,
    useGetBrandByIdQuery,
    useCreateBrandMutation,
    useUpdateBrandMutation,
    useDeleteBrandMutation,
} = brandApi;
