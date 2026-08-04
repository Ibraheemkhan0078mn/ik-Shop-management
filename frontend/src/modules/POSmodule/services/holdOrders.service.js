import { baseApi } from "../../../app/rtkBaseApi.js";

export const holdOrderApi = baseApi.injectEndpoints({
    endpoints: (build) => ({
        getHoldOrders: build.query({
            query: () => ({ url: "/hold-orders" }),
            providesTags: ["HoldOrders"],
        }),
        createHoldOrder: build.mutation({
            query: (body) => ({ url: "/hold-orders", method: "POST", body }),
            invalidatesTags: ["HoldOrders"],
        }),
        updateHoldOrder: build.mutation({
            query: ({ id, body }) => ({ url: `/hold-orders/${id}`, method: "PUT", body }),
            invalidatesTags: ["HoldOrders"],
        }),
        deleteHoldOrder: build.mutation({
            query: (id) => ({ url: `/hold-orders/${id}`, method: "DELETE" }),
            invalidatesTags: ["HoldOrders"],
        }),
    }),
});

export const {
    useGetHoldOrdersQuery: useHoldOrders,
    useCreateHoldOrderMutation: useCreateHoldOrder,
    useUpdateHoldOrderMutation: useUpdateHoldOrder,
    useDeleteHoldOrderMutation: useDeleteHoldOrder,
} = holdOrderApi;
