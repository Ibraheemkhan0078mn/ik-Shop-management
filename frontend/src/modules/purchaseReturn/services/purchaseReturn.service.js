import { baseApi } from "../../../app/rtkBaseApi.js";

export const purchaseReturnApi = baseApi.injectEndpoints({
    endpoints: (build) => ({
        getPurchaseReturns: build.query({
            query: () => "/purchase-returns",
            providesTags: ["PurchaseReturn"],
        }),
        getPaginatedPurchaseReturns: build.query({
            query: ({ page = 1, limit = 20, status, supplier }) => {
                let url = `/purchase-returns/paginate?page=${page}&limit=${limit}`;
                if (status) url += `&status=${status}`;
                if (supplier) url += `&supplier=${supplier}`;
                return url;
            },
            providesTags: ["PurchaseReturn"],
        }),
        getPurchaseReturnById: build.query({
            query: (id) => `/purchase-returns/${id}`,
            providesTags: (result, error, id) => [{ type: "PurchaseReturn", id }],
        }),
        getPurchaseByInvoiceNumber: build.mutation({
            query: (invoiceNumber) => ({
                url: "/purchases/getPurchaseByInvoiceNumber",
                method: "POST",
                body: { invoiceNumber },
            }),
        }),
        createPurchaseReturn: build.mutation({
            query: (data) => ({
                url: "/purchase-returns",
                method: "POST",
                body: data,
            }),
            invalidatesTags: ["PurchaseReturn", "Product"],
        }),
        updatePurchaseReturn: build.mutation({
            query: ({ id, ...data }) => ({
                url: `/purchase-returns/${id}`,
                method: "PUT",
                body: data,
            }),
            invalidatesTags: (result, error, { id }) => [{ type: "PurchaseReturn", id }, "PurchaseReturn"],
        }),
        deletePurchaseReturn: build.mutation({
            query: (id) => ({
                url: `/purchase-returns/${id}`,
                method: "DELETE",
            }),
            invalidatesTags: ["PurchaseReturn"],
        }),
        submitPurchaseReturn: build.mutation({
            query: (id) => ({
                url: `/purchase-returns/${id}/submit`,
                method: "PUT",
            }),
            invalidatesTags: (result, error, id) => [{ type: "PurchaseReturn", id }, "PurchaseReturn"],
        }),
        approvePurchaseReturn: build.mutation({
            query: (id) => ({
                url: `/purchase-returns/${id}/approve`,
                method: "PUT",
            }),
            invalidatesTags: (result, error, id) => [{ type: "PurchaseReturn", id }, "PurchaseReturn"],
        }),
        rejectPurchaseReturn: build.mutation({
            query: ({ id, rejectionReason }) => ({
                url: `/purchase-returns/${id}/reject`,
                method: "PUT",
                body: { rejectionReason },
            }),
            invalidatesTags: (result, error, id) => [{ type: "PurchaseReturn", id }, "PurchaseReturn"],
        }),
        generatePurchaseReturnNumber: build.query({
            query: () => "/purchase-returns/generate-number",
        }),
        addPurchaseReturnPayment: build.mutation({
            query: ({ id, ...data }) => ({
                url: `/purchase-returns/${id}/payments`,
                method: "POST",
                body: data,
            }),
            invalidatesTags: (result, error, { id }) => [{ type: "PurchaseReturn", id }, "PurchaseReturn"],
        }),
        getPurchaseReturnPayments: build.query({
            query: (id) => `/purchase-returns/${id}/payments`,
            providesTags: (result, error, id) => [{ type: "PurchaseReturn", id }, "PurchaseReturnPayments"],
        }),
        deletePurchaseReturnPayment: build.mutation({
            query: ({ returnId, paymentId }) => ({
                url: `/purchase-returns/${returnId}/payments/${paymentId}`,
                method: "DELETE",
            }),
            invalidatesTags: (result, error, { returnId }) => [{ type: "PurchaseReturn", returnId }, "PurchaseReturnPayments"],
        }),
        updatePurchaseReturnPayment: build.mutation({
            query: ({ returnId, paymentId, ...data }) => ({
                url: `/purchase-returns/${returnId}/payments/${paymentId}`,
                method: "PUT",
                body: data,
            }),
            invalidatesTags: (result, error, { returnId }) => [{ type: "PurchaseReturn", returnId }, "PurchaseReturnPayments"],
        }),
    }),
});

export const {
    useGetPurchaseReturnsQuery,
    useGetPaginatedPurchaseReturnsQuery,
    useGetPurchaseReturnByIdQuery,
    useGetPurchaseByInvoiceNumberMutation,
    useCreatePurchaseReturnMutation,
    useUpdatePurchaseReturnMutation,
    useDeletePurchaseReturnMutation,
    useSubmitPurchaseReturnMutation,
    useApprovePurchaseReturnMutation,
    useRejectPurchaseReturnMutation,
    useGeneratePurchaseReturnNumberQuery,
    useAddPurchaseReturnPaymentMutation,
    useGetPurchaseReturnPaymentsQuery,
    useDeletePurchaseReturnPaymentMutation,
    useUpdatePurchaseReturnPaymentMutation,
} = purchaseReturnApi;
