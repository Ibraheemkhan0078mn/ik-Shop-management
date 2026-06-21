// src/modules/qarza/services/qarza.service.js
import { baseApi } from "@app/rtkBaseApi.js";

export const qarzaApi = baseApi.injectEndpoints({
    endpoints: (build) => ({

        // ── Accounts ─────────────────────────────────────────────
        getQarzaAccounts: build.query({
            query: () => ({ url: "/api/qarzaRoutes/getqarzaAccount" }),
            transformResponse: (raw) => raw.accounts ?? raw.data ?? raw,
            providesTags: ["Qarza"],
        }),

        createQarzaAccount: build.mutation({
            query: (formData) => ({
                url: "/api/qarzaRoutes/qarzaAccountCreate",
                method: "POST",
                body: formData,
            }),
            invalidatesTags: ["Qarza"],
        }),

        updateQarzaAccount: build.mutation({
            query: (formData) => ({
                url: "/api/qarzaRoutes/qarzaAccountUpdate",
                method: "PUT",
                body: formData,
            }),
            invalidatesTags: ["Qarza"],
        }),

        deleteQarzaAccount: build.mutation({
            query: (id) => ({
                url: "/api/qarzaRoutes/qarzaAccountDelete",
                method: "DELETE",
                body: { _id: id },
            }),
            invalidatesTags: ["Qarza"],
        }),

        // ── Payments ─────────────────────────────────────────────
        getAccountPayments: build.query({
            query: (qarzaAccountId) => ({
                url: "/api/qarzaRoutes/getQarzaAccountRelatedPayments",
                method: "POST",
                body: { qarzaAccountId },
            }),
            transformResponse: (raw) => raw.data ?? raw,
            providesTags: (_r, _e, id) => [{ type: "Qarza", id }],
        }),

        createQarzaPayment: build.mutation({
            query: (body) => ({
                url: "/api/qarzaRoutes/createQarzaPayment",
                method: "POST",
                body,
            }),
            invalidatesTags: (_r, _e, arg) => [{ type: "Qarza", id: arg.qarzaAccountId }, "Qarza"],
        }),

        updateQarzaPayment: build.mutation({
            query: (body) => ({
                url: "/api/qarzaRoutes/updateQarzaPayment",
                method: "PUT",
                body,
            }),
            invalidatesTags: (_r, _e, arg) => [{ type: "Qarza", id: arg.qarzaAccountId }, "Qarza"],
        }),

        deleteQarzaPayment: build.mutation({
            query: ({ paymentId, qarzaAccountId }) => ({
                url: "/api/qarzaRoutes/deleteQarzaPayment",
                method: "DELETE",
                body: { paymentId, qarzaAccountId },
            }),
            invalidatesTags: (_r, _e, arg) => [{ type: "Qarza", id: arg.qarzaAccountId }, "Qarza"],
        }),
    }),
});

export const {
    useGetQarzaAccountsQuery:    useQarzaAccounts,
    useCreateQarzaAccountMutation: useCreateQarzaAccount,
    useUpdateQarzaAccountMutation: useUpdateQarzaAccount,
    useDeleteQarzaAccountMutation: useDeleteQarzaAccount,
    useGetAccountPaymentsQuery:  useAccountPayments,
    useCreateQarzaPaymentMutation: useCreateQarzaPayment,
    useUpdateQarzaPaymentMutation: useUpdateQarzaPayment,
    useDeleteQarzaPaymentMutation: useDeleteQarzaPayment,
} = qarzaApi;
