// src/modules/qarza/services/qarza.service.js
import { baseApi } from "../../../app/rtkBaseApi.js";

export const qarzaApi = baseApi.injectEndpoints({
    endpoints: (build) => ({

        // ── Accounts ─────────────────────────────────────────────
        getQarzaAccounts: build.query({
            query: () => ({ url: "/qarzaRoutes/getqarzaAccount" }),
            transformResponse: (raw) => raw.accounts ?? raw.data ?? raw,
            providesTags: ["Qarza"],
        }),

        getQarzaAccountsPaginated: build.query({
            query: ({ page = 1, limit = 20, ...filters } = {}) => ({
                url: "/qarzaRoutes/pagination",
                params: { page, limit, ...filters },
            }),
            providesTags: ["Qarza"],
        }),

        createQarzaAccount: build.mutation({
            query: (formData) => ({
                url: "/qarzaRoutes/qarzaAccountCreate",
                method: "POST",
                body: formData,
            }),
            invalidatesTags: ["Qarza"],
        }),

        updateQarzaAccount: build.mutation({
            query: (formData) => ({
                url: "/qarzaRoutes/qarzaAccountUpdate",
                method: "PUT",
                body: formData,
            }),
            invalidatesTags: ["Qarza"],
        }),

        deleteQarzaAccount: build.mutation({
            query: (id) => ({
                url: "/qarzaRoutes/qarzaAccountDelete",
                method: "DELETE",
                body: { _id: id },
            }),
            invalidatesTags: ["Qarza"],
        }),

        // ── Payments ─────────────────────────────────────────────
        getAccountPayments: build.query({
            query: (qarzaAccountId) => ({
                url: "/qarzaRoutes/getQarzaAccountRelatedPayments",
                method: "POST",
                body: { qarzaAccountId },
            }),
            transformResponse: (raw) => raw.data ?? raw,
            providesTags: (_r, _e, id) => [{ type: "Qarza", id }],
        }),

        getAccountPaymentsPaginated: build.query({
            query: ({ qarzaAccountId, page = 1, limit = 20 } = {}) => ({
                url: "/qarzaRoutes/payments/pagination",
                params: { qarzaAccountId, page, limit },
            }),
            providesTags: (_r, _e, { qarzaAccountId }) => [{ type: "Qarza", id: qarzaAccountId }],
        }),

        getAccountPaymentsSummary: build.query({
            query: (qarzaAccountId) => ({
                url: "/qarzaRoutes/payments/summary",
                params: { qarzaAccountId },
            }),
            providesTags: (_r, _e, id) => [{ type: "Qarza", id }],
        }),

        createQarzaPayment: build.mutation({
            query: (body) => ({
                url: "/qarzaRoutes/createQarzaPayment",
                method: "POST",
                body,
            }),
            invalidatesTags: (_r, _e, arg) => [{ type: "Qarza", id: arg.qarzaAccountId }, "Qarza"],
        }),

        updateQarzaPayment: build.mutation({
            query: (body) => ({
                url: "/qarzaRoutes/updateQarzaPayment",
                method: "PUT",
                body,
            }),
            invalidatesTags: (_r, _e, arg) => [{ type: "Qarza", id: arg.qarzaAccountId }, "Qarza"],
        }),

        deleteQarzaPayment: build.mutation({
            query: ({ paymentId, qarzaAccountId }) => ({
                url: "/qarzaRoutes/deleteQarzaPayment",
                method: "DELETE",
                body: { paymentId, qarzaAccountId },
            }),
            invalidatesTags: (_r, _e, arg) => [{ type: "Qarza", id: arg.qarzaAccountId }, "Qarza"],
        }),
    }),
});

export const {
    useGetQarzaAccountsQuery:         useQarzaAccounts,
    useGetQarzaAccountsPaginatedQuery: useQarzaAccountsPaginated,
    useCreateQarzaAccountMutation:     useCreateQarzaAccount,
    useUpdateQarzaAccountMutation:     useUpdateQarzaAccount,
    useDeleteQarzaAccountMutation:     useDeleteQarzaAccount,
    useGetAccountPaymentsQuery:       useAccountPayments,
    useGetAccountPaymentsPaginatedQuery: useAccountPaymentsPaginated,
    useGetAccountPaymentsSummaryQuery: useAccountPaymentsSummary,
    useCreateQarzaPaymentMutation:     useCreateQarzaPayment,
    useUpdateQarzaPaymentMutation:     useUpdateQarzaPayment,
    useDeleteQarzaPaymentMutation:     useDeleteQarzaPayment,
} = qarzaApi;
