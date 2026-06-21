import { baseApi } from "@app/rtkBaseApi.js";

export const purchaseApi = baseApi.injectEndpoints({
    endpoints: (build) => ({

        // List — paginated
        getPurchases: build.query({
            query: ({ page = 1, limit = 20, ...filters } = {}) => ({
                url: "/api/purchases/pagination",
                params: { page, limit, ...filters },
            }),
            providesTags: ["Purchase"],
        }),

        // All purchases — without pagination
        getAllPurchases: build.query({
            query: () => ({ url: "/api/purchases" }),
            transformResponse: (raw) => raw.data || raw,
            providesTags: ["Purchase"],
        }),

        // Single purchase
        getPurchaseById: build.query({
            query: (id) => ({ url: `/api/purchases/getPurchaseById/${id}` }),
            transformResponse: (raw) => raw.data || raw,
            providesTags: (result, error, id) => [{ type: "Purchase", id }],
        }),


        getPurchaseByInvoiceNumber: build.query({
            query: (id, ...body) => ({ url: `/api/purchases/getPurchaseByInvoiceNumber`, method: "POST", body: {invoiceNumber: id} }),
            transformResponse: (raw) => raw.data || raw,
            providesTags: (result, error, id) => [{ type: "Purchase", id }],
        }),

        // Create
        createPurchase: build.mutation({
            query: (body) => ({ url: "/api/purchases", method: "POST", body }),
            invalidatesTags: ["Purchase"],
        }),

        // Update
        updatePurchase: build.mutation({
            query: ({ id, ...body }) => ({ url: `/api/purchases/updatePurchase/${id}`, method: "PUT", body }),
            invalidatesTags: (result, error, { id }) => [{ type: "Purchase", id }, "Purchase"],
        }),

        // Delete
        deletePurchase: build.mutation({
            query: (id) => ({ url: `/api/purchases/${id}`, method: "DELETE" }),
            invalidatesTags: ["Purchase"],
        }),
    }),
});

export const {
    useGetPurchasesQuery: usePurchases,
    useGetAllPurchasesQuery: useAllPurchases,
    useGetPurchaseByIdQuery: usePurchase,
    useGetPurchaseByInvoiceNumberQuery: usePurchaseByInvoiceNumber,
    useCreatePurchaseMutation: useCreatePurchase,
    useUpdatePurchaseMutation: useUpdatePurchase,
    useDeletePurchaseMutation: useDeletePurchase,
} = purchaseApi;