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
            query: (id) => ({ url: `/purchases/getPurchaseByInvoiceNumber`, method: "POST", body: {invoiceNumber: id} }),
            transformResponse: (raw) => raw.data || raw,
            providesTags: (result, error, id) => [{ type: "Purchase", id }],
        }),

        // Create
        createPurchase: build.mutation({
            query: (body) => ({ url: "/purchases", method: "POST", body }),
            invalidatesTags: ["Purchase", "Product", "Batch", "Reports", "Qarza"],
        }),

        // Update
        updatePurchase: build.mutation({
            query: ({ id, ...body }) => ({ url: `/purchases/updatePurchase/${id}`, method: "PUT", body }),
            invalidatesTags: (result, error, { id }) => [{ type: "Purchase", id }, "Purchase", "Product", "Batch", "Reports", "Qarza"],
        }),

        // Delete
        deletePurchase: build.mutation({
            query: (id) => ({ url: `/purchases/${id}`, method: "DELETE" }),
            invalidatesTags: ["Purchase", "Product", "Batch", "Reports", "Qarza"],
        }),

        // Update Status
        updatePurchaseStatus: build.mutation({
            query: ({ id, status }) => ({ url: `/purchases/${id}/status`, method: "PUT", body: { status } }),
            invalidatesTags: ["Purchase", "Product", "Batch", "Reports", "Qarza"],
        }),

        // Create Payment
        createPurchasePayment: build.mutation({
            query: ({ id, ...body }) => ({ url: `/purchases/${id}/payments`, method: "POST", body }),
            invalidatesTags: ["Purchase", "Qarza"],
        }),

        // Get Payments
        getPurchasePayments: build.query({
            query: (purchaseId) => ({ url: `/purchases/${purchaseId}/payments` }),
            transformResponse: (raw) => raw.data || raw,
            providesTags: (result, error, purchaseId) => [{ type: "Purchase", id: `payments-${purchaseId}` }],
        }),

        // Get Purchase Payment Status
        getPurchasePaymentStatus: build.query({
            query: (purchaseId) => ({ url: `/purchases/${purchaseId}/payment-status` }),
            transformResponse: (raw) => raw.data || raw,
            providesTags: (result, error, purchaseId) => [{ type: "Purchase", id: `payment-status-${purchaseId}` }],
        }),

        // Update Payment
        updatePurchasePayment: build.mutation({
            query: ({ paymentId, ...body }) => ({ 
                url: `/purchases/payments/${paymentId}`, 
                method: "PUT", 
                body 
            }),
            invalidatesTags: (result, error, { purchaseId }) => ["Purchase", "Qarza", { type: "Purchase", id: `payments-${purchaseId}` }],
        }),

        // Delete Payment
        deletePurchasePayment: build.mutation({
            query: ({ paymentId }) => ({ 
                url: `/purchases/payments/${paymentId}`, 
                method: "DELETE" 
            }),
            invalidatesTags: (result, error, { purchaseId }) => ["Purchase", "Qarza", { type: "Purchase", id: `payments-${purchaseId}` }],
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

        // Generate purchase number
        generatePurchaseNumber: build.mutation({
            query: () => ({ url: "/purchases/generate-number", method: "GET" }),
            transformResponse: (raw) => raw.data || raw,
        }),

        // Recalculate Purchase Paid Amount
        recalculatePurchasePaidAmount: build.mutation({
            query: (id) => ({ url: `/purchases/${id}/recalculate-payment`, method: "POST" }),
            transformResponse: (raw) => raw.data || raw,
            invalidatesTags: (result, error, id) => ["Purchase", "Qarza", { type: "Purchase", id }, { type: "Purchase", id: `payments-${id}` }, { type: "Purchase", id: `payment-status-${id}` }],
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
    useGetPurchasePaymentStatusQuery: useGetPurchasePaymentStatus,
    useUpdatePurchasePaymentMutation: useUpdatePurchasePayment,
    useDeletePurchasePaymentMutation: useDeletePurchasePayment,
    useGetPurchasesBySupplierQuery: usePurchasesBySupplier,
    useGeneratePurchaseNumberMutation: useGeneratePurchaseNumber,
    useRecalculatePurchasePaidAmountMutation: useRecalculatePurchasePaidAmount,
} = purchaseApi;