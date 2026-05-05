import { baseApi } from "../../../app/rtkBaseApi.js";

export const supplierApi = baseApi.injectEndpoints({
    endpoints: (build) => ({

        // List — paginated
        getSuppliers: build.query({
            query: ({ page = 1, limit = 20, ...filters } = {}) => ({
                url: "/suppliers/pagination",
                params: { page, limit, ...filters },
            }),
            transformResponse: (raw) => raw.data || raw,
            providesTags: ["Supplier"],
        }),

        // All suppliers — without pagination
        getAllSuppliers: build.query({
            query: () => ({ url: "/suppliers" }),
            transformResponse: (raw) => raw.data || raw,
            providesTags: ["Supplier"],
        }),

        // Single supplier
        getSupplierById: build.query({
            query: (id) => ({ url: `/suppliers/${id}` }),
            transformResponse: (raw) => raw.data || raw,
            providesTags: (result, error, id) => [{ type: "Supplier", id }],
        }),

        // Create
        createSupplier: build.mutation({
            query: (body) => ({ url: "/suppliers", method: "POST", body }),
            invalidatesTags: ["Supplier"],
        }),

        // Update
        updateSupplier: build.mutation({
            query: ({ id, ...body }) => ({ url: `/suppliers/${id}`, method: "PUT", body }),
            invalidatesTags: (result, error, { id }) => [{ type: "Supplier", id }, "Supplier"],
        }),

        // Delete
        deleteSupplier: build.mutation({
            query: (id) => ({ url: `/suppliers/${id}`, method: "DELETE" }),
            invalidatesTags: ["Supplier"],
        }),
    }),
});

export const {
    useGetSuppliersQuery:    useSuppliers,
    useGetAllSuppliersQuery: useAllSuppliers,
    useGetSupplierByIdQuery: useSupplier,
    useCreateSupplierMutation: useCreateSupplier,
    useUpdateSupplierMutation: useUpdateSupplier,
    useDeleteSupplierMutation: useDeleteSupplier,
} = supplierApi;