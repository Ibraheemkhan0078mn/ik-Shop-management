import { baseApi } from "../../../app/rtkBaseApi.js";

export const purchaseApi = baseApi.injectEndpoints({
    endpoints: (build) => ({

        // List — paginated
        getPurchases: build.query({
            query: ({ page = 1, limit = 20, ...filters } = {}) => ({
                url: "/purchases/pagination",
                params: { page, limit, ...filters },
            }),
            transformResponse: (raw) => raw.data.data || raw.data || raw,
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
            query: (id) => ({ url: `/purchases/deletePurchase/${id}`, method: "GET" }),
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