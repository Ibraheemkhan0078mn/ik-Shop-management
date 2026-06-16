import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const purchaseReturnApi = createApi({
    reducerPath: "purchaseReturnApi",
    baseQuery: fetchBaseQuery({ baseUrl: "http://localhost:5001/api" }),
    tagTypes: ["PurchaseReturn"],
    endpoints: (builder) => ({
        getPurchaseReturns: builder.query({
            query: () => "/purchase-returns",
            providesTags: ["PurchaseReturn"],
        }),
        getPaginatedPurchaseReturns: builder.query({
            query: ({ page = 1, limit = 20, status, supplier }) => {
                let url = `/purchase-returns/paginate?page=${page}&limit=${limit}`;
                if (status) url += `&status=${status}`;
                if (supplier) url += `&supplier=${supplier}`;
                return url;
            },
            providesTags: ["PurchaseReturn"],
        }),
        getPurchaseReturnById: builder.query({
            query: (id) => `/purchase-returns/${id}`,
            providesTags: (result, error, id) => [{ type: "PurchaseReturn", id }],
        }),
        createPurchaseReturn: builder.mutation({
            query: (data) => ({
                url: "/purchase-returns",
                method: "POST",
                body: data,
            }),
            invalidatesTags: ["PurchaseReturn"],
        }),
        updatePurchaseReturn: builder.mutation({
            query: ({ id, ...data }) => ({
                url: `/purchase-returns/${id}`,
                method: "PUT",
                body: data,
            }),
            invalidatesTags: (result, error, { id }) => [{ type: "PurchaseReturn", id }, "PurchaseReturn"],
        }),
        deletePurchaseReturn: builder.mutation({
            query: (id) => ({
                url: `/purchase-returns/${id}`,
                method: "DELETE",
            }),
            invalidatesTags: ["PurchaseReturn"],
        }),
        submitPurchaseReturn: builder.mutation({
            query: (id) => ({
                url: `/purchase-returns/${id}/submit`,
                method: "PUT",
            }),
            invalidatesTags: (result, error, id) => [{ type: "PurchaseReturn", id }, "PurchaseReturn"],
        }),
        approvePurchaseReturn: builder.mutation({
            query: (id) => ({
                url: `/purchase-returns/${id}/approve`,
                method: "PUT",
            }),
            invalidatesTags: (result, error, id) => [{ type: "PurchaseReturn", id }, "PurchaseReturn"],
        }),
        rejectPurchaseReturn: builder.mutation({
            query: ({ id, rejectionReason }) => ({
                url: `/purchase-returns/${id}/reject`,
                method: "PUT",
                body: { rejectionReason },
            }),
            invalidatesTags: (result, error, id) => [{ type: "PurchaseReturn", id }, "PurchaseReturn"],
        }),
        generatePurchaseReturnNumber: builder.query({
            query: () => "/purchase-returns/generate-number",
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
