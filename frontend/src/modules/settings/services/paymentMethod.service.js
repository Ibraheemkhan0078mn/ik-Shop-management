import { baseApi } from "../../../app/rtkBaseApi.js";

export const paymentMethodApi = baseApi.injectEndpoints({
    endpoints: (build) => ({
        getPaymentMethods: build.query({
            query: () => ({ url: "/payment-methods" }),
            transformResponse: (raw) => raw?.data ?? raw,
            providesTags: ["PaymentMethod"],
        }),

        getPaymentMethodById: build.query({
            query: (id) => ({ url: `/payment-methods/${id}` }),
            transformResponse: (raw) => raw?.data ?? raw,
            providesTags: (_r, _e, id) => [{ type: "PaymentMethod", id }],
        }),

        createPaymentMethod: build.mutation({
            query: (body) => ({ url: "/payment-methods", method: "POST", body }),
            invalidatesTags: ["PaymentMethod"],
        }),

        updatePaymentMethod: build.mutation({
            query: ({ id, ...body }) => ({ url: `/payment-methods/${id}`, method: "PUT", body }),
            invalidatesTags: (_r, _e, { id }) => [{ type: "PaymentMethod", id }, "PaymentMethod"],
        }),

        deletePaymentMethod: build.mutation({
            query: (id) => ({ url: `/payment-methods/${id}`, method: "DELETE" }),
            invalidatesTags: ["PaymentMethod"],
        }),
    }),
});

export const {
    useGetPaymentMethodsQuery: usePaymentMethods,
    useGetPaymentMethodByIdQuery: usePaymentMethod,
    useCreatePaymentMethodMutation: useCreatePaymentMethod,
    useUpdatePaymentMethodMutation: useUpdatePaymentMethod,
    useDeletePaymentMethodMutation: useDeletePaymentMethod,
} = paymentMethodApi;
