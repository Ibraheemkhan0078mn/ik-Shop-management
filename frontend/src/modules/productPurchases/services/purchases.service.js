import { baseApi } from "../../../app/rtkBaseApi.js";

export const purchaseApi = baseApi.injectEndpoints({
    endpoints: (build) => ({

        // List — paginated
        getPurchases: build.query({
            query: ({ page = 1, limit = 20, ...filters } = {}) => ({
                url: "/purchases/pagination",
                params: { page, limit, ...filters },
            }),
            providesTags: ["Purchase"],
        }),

        // All purchases — without pagination
        getAllPurchases: build.query({
            query: () => ({ url: "/purchases" }),
            transformResponse: (raw) => raw.data || raw,
            providesTags: ["Purchase"],
        }),

        // Single purchase
        getPurchaseById: build.query({
            query: (id) => ({ url: `/purchases/getPurchaseById/${id}` }),
            transformResponse: (raw) => raw.data || raw,
            providesTags: (result, error, id) => [{ type: "Purchase", id }],
        }),


        getPurchaseByInvoiceNumber: build.query({
            query: (id, ...body) => ({ url: `/purchases/getPurchaseByInvoiceNumber`, method: "POST", body: {invoiceNumber: id} }),
            transformResponse: (raw) => raw.data || raw,
            providesTags: (result, error, id) => [{ type: "Purchase", id }],
        }),

        // Create
        createPurchase: build.mutation({
            query: (body) => ({ url: "/purchases", method: "POST", body }),
            invalidatesTags: ["Purchase"],
        }),

        // Update
        updatePurchase: build.mutation({
            query: ({ id, ...body }) => ({ url: `/purchases/updatePurchase/${id}`, method: "PUT", body }),
            invalidatesTags: (result, error, { id }) => [{ type: "Purchase", id }, "Purchase"],
        }),

        // Delete
        deletePurchase: build.mutation({
            query: (id) => ({ url: `/purchases/${id}`, method: "DELETE" }),
            invalidatesTags: ["Purchase"],
        }),

        // Update Status
        updatePurchaseStatus: build.mutation({
            query: ({ id, status }) => ({ url: `/purchases/${id}/status`, method: "PUT", body: { status } }),
            invalidatesTags: ["Purchase"],
        }),

        // Create Payment
        createPurchasePayment: build.mutation({
            query: ({ id, ...body }) => ({ url: `/purchases/${id}/payments`, method: "POST", body }),
            invalidatesTags: ["Purchase"],
        }),

        // Get Payments
        getPurchasePayments: build.query({
            query: (purchaseId) => ({ url: `/purchases/${purchaseId}/payments` }),
            transformResponse: (raw) => raw.data || raw,
            providesTags: (result, error, purchaseId) => [{ type: "Purchase", id: `payments-${purchaseId}` }],
        }),

        // Get Purchases by Supplier
        getPurchasesBySupplier: build.query({
            query: ({ supplierId, startDate, endDate, page = 1, limit = 20 }) => ({
                url: "/purchases/pagination",
                params: { supplier: supplierId, startDate, endDate, page, limit },
            }),
            transformResponse: (raw) => raw || {},
            providesTags: ["Purchase"],
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
    useUpdatePurchaseStatusMutation: useUpdatePurchaseStatus,
    useCreatePurchasePaymentMutation: useCreatePurchasePayment,
    useGetPurchasePaymentsQuery: useGetPurchasePayments,
    useGetPurchasesBySupplierQuery: usePurchasesBySupplier,
} = purchaseApi;