import { baseApi } from "@app/rtkBaseApi.js";

export const purchaseReturnApi = baseApi.injectEndpoints({
    endpoints: (build) => ({
        getPurchaseReturns: build.query({
            query: () => "/api/purchase-returns",
            providesTags: ["PurchaseReturn"],
        }),
        getPaginatedPurchaseReturns: build.query({
            query: ({ page = 1, limit = 20, status, supplier }) => {
                let url = `/api/purchase-returns/paginate?page=${page}&limit=${limit}`;
                if (status) url += `&status=${status}`;
                if (supplier) url += `&supplier=${supplier}`;
                return url;
            },
            providesTags: ["PurchaseReturn"],
        }),
        getPurchaseReturnById: build.query({
            query: (id) => `/api/purchase-returns/${id}`,
            providesTags: (result, error, id) => [{ type: "PurchaseReturn", id }],
        }),
        createPurchaseReturn: build.mutation({
            query: (data) => ({
                url: "/api/purchase-returns",
                method: "POST",
                body: data,
            }),
            invalidatesTags: ["PurchaseReturn"],
        }),
        updatePurchaseReturn: build.mutation({
            query: ({ id, ...data }) => ({
                url: `/api/purchase-returns/${id}`,
                method: "PUT",
                body: data,
            }),
            invalidatesTags: (result, error, { id }) => [{ type: "PurchaseReturn", id }, "PurchaseReturn"],
        }),
        deletePurchaseReturn: build.mutation({
            query: (id) => ({
                url: `/api/purchase-returns/${id}`,
                method: "DELETE",
            }),
            invalidatesTags: ["PurchaseReturn"],
        }),
        submitPurchaseReturn: build.mutation({
            query: (id) => ({
                url: `/api/purchase-returns/${id}/submit`,
                method: "PUT",
            }),
            invalidatesTags: (result, error, id) => [{ type: "PurchaseReturn", id }, "PurchaseReturn"],
        }),
        approvePurchaseReturn: build.mutation({
            query: (id) => ({
                url: `/api/purchase-returns/${id}/approve`,
                method: "PUT",
            }),
            invalidatesTags: (result, error, id) => [{ type: "PurchaseReturn", id }, "PurchaseReturn"],
        }),
        rejectPurchaseReturn: build.mutation({
            query: ({ id, rejectionReason }) => ({
                url: `/api/purchase-returns/${id}/reject`,
                method: "PUT",
                body: { rejectionReason },
            }),
            invalidatesTags: (result, error, id) => [{ type: "PurchaseReturn", id }, "PurchaseReturn"],
        }),
        generatePurchaseReturnNumber: build.query({
            query: () => "/api/purchase-returns/generate-number",
        }),
    }),
});

export const {
    useGetPurchaseReturnsQuery,
    useGetPaginatedPurchaseReturnsQuery,
    useGetPurchaseReturnByIdQuery,
    useCreatePurchaseReturnMutation,
    useUpdatePurchaseReturnMutation,
    useDeletePurchaseReturnMutation,
    useSubmitPurchaseReturnMutation,
    useApprovePurchaseReturnMutation,
    useRejectPurchaseReturnMutation,
    useGeneratePurchaseReturnNumberQuery,
} = purchaseReturnApi;
