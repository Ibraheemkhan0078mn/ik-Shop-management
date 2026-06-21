// src/modules/suppliers/services/suppliers.service.js
import { baseApi } from "@app/rtkBaseApi.js";

export const supplierApi = baseApi.injectEndpoints({
    endpoints: (build) => ({

        getSuppliers: build.query({
            query: ({ page = 1, limit = 20, ...filters } = {}) => ({
                url: "/api/suppliers/pagination",
                params: { page, limit, ...filters },
            }),
            providesTags: ["Supplier"],
        }),

        getAllSuppliers: build.query({
            query: () => ({ url: "/api/suppliers" }),
            transformResponse: (raw) => raw.data ?? raw,
            providesTags: ["Supplier"],
        }),

        getSupplierById: build.query({
            query: (id) => ({ url: `/api/suppliers/${id}` }),
            transformResponse: (raw) => raw.data ?? raw,
            providesTags: (_r, _e, id) => [{ type: "Supplier", id }],
        }),

        createSupplier: build.mutation({
            query: (body) => ({ url: "/api/suppliers", method: "POST", body }),
            invalidatesTags: ["Supplier"],
        }),

        updateSupplier: build.mutation({
            query: ({ id, ...body }) => ({ url: `/api/suppliers/${id}`, method: "PUT", body }),
            invalidatesTags: (_r, _e, { id }) => [{ type: "Supplier", id }, "Supplier"],
        }),

        deleteSupplier: build.mutation({
            query: (id) => ({ url: `/api/suppliers/${id}`, method: "DELETE" }),
            invalidatesTags: ["Supplier"],
        }),
    }),
});

export const {
    useGetSuppliersQuery:      useSuppliers,
    useGetAllSuppliersQuery:   useAllSuppliers,
    useGetSupplierByIdQuery:   useSupplier,
    useCreateSupplierMutation: useCreateSupplier,
    useUpdateSupplierMutation: useUpdateSupplier,
    useDeleteSupplierMutation: useDeleteSupplier,
} = supplierApi;
