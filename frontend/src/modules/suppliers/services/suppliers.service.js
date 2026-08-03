// src/modules/suppliers/services/suppliers.service.js
import { baseApi } from "../../../app/rtkBaseApi.js";

export const supplierApi = baseApi.injectEndpoints({
    endpoints: (build) => ({

        getSuppliers: build.query({
            query: ({ page = 1, limit = 20, ...filters } = {}) => ({
                url: "/suppliers/pagination",
                params: { page, limit, ...filters },
            }),
            providesTags: ["Supplier"],
        }),

        getAllSuppliers: build.query({
            query: () => ({ url: "/suppliers" }),
            transformResponse: (raw) => raw.data ?? raw,
            providesTags: ["Supplier"],
        }),

        getSupplierById: build.query({
            query: (id) => ({ url: `/suppliers/${id}` }),
            transformResponse: (raw) => raw.data ?? raw,
            providesTags: (_r, _e, id) => [{ type: "Supplier", id }],
        }),

        createSupplier: build.mutation({
            query: (body) => ({ 
                url: "/suppliers", 
                method: "POST", 
                body,
                headers: body instanceof FormData ? {} : { 'Content-Type': 'application/json' },
            }),
            invalidatesTags: ["Supplier"],
        }),

        updateSupplier: build.mutation({
            query: ({ id, data }) => ({ 
                url: `/suppliers/${id}`, 
                method: "PUT", 
                body: data,
                headers: data instanceof FormData ? {} : { 'Content-Type': 'application/json' },
            }),
            invalidatesTags: (_r, _e, { id }) => [{ type: "Supplier", id }, "Supplier"],
        }),

        deleteSupplier: build.mutation({
            query: (id) => ({ url: `/suppliers/${id}`, method: "DELETE" }),
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
