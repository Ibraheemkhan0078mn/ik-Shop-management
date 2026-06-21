import { baseApi } from "@app/rtkBaseApi.js";

export const holdOrderApi = baseApi.injectEndpoints({
    endpoints: (build) => ({
        getHoldOrders: build.query({
            query: () => ({ url: "/hold-orders" }),
            providesTags: ["HoldOrder"],
        }),
        createHoldOrder: build.mutation({
            query: (body) => ({ url: "/hold-orders", method: "POST", body }),
            invalidatesTags: ["HoldOrder"],
        }),
        updateHoldOrder: build.mutation({
            query: ({ id, body }) => ({ url: `/hold-orders/${id}`, method: "PUT", body }),
            invalidatesTags: ["HoldOrder"],
        }),
        deleteHoldOrder: build.mutation({
            query: (id) => ({ url: `/hold-orders/${id}`, method: "DELETE" }),
            invalidatesTags: ["HoldOrder"],
        }),
    }),
});

export const {
    useGetHoldOrdersQuery: useHoldOrders,
    useCreateHoldOrderMutation: useCreateHoldOrder,
    useUpdateHoldOrderMutation: useUpdateHoldOrder,
    useDeleteHoldOrderMutation: useDeleteHoldOrder,
} = holdOrderApi;
