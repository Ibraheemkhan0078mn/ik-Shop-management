import { baseApi } from "../../../app/rtkBaseApi.js";

export const wastageApi = baseApi.injectEndpoints({
    endpoints: (build) => ({

        // List — paginated
        getWastages: build.query({
            query: ({ page = 1, limit = 20, ...filters } = {}) => ({
                url: "/wastages/paginate",
                params: { page, limit, ...filters },
            }),
            transformResponse: (raw) => raw || raw,
            providesTags: ["Wastage"],
        }),

        // All wastages — without pagination
        getAllWastages: build.query({
            query: (filters = {}) => ({ url: "/wastages", params: filters }),
            transformResponse: (raw) => raw.data || raw,
            providesTags: ["Wastage"],
        }),

        // Single wastage
        getWastageById: build.query({
            query: (id) => ({ url: `/wastages/${id}` }),
            transformResponse: (raw) => raw.data || raw,
            providesTags: (result, error, id) => [{ type: "Wastage", id }],
        }),

        // Create
        createWastage: build.mutation({
            query: (body) => ({ url: "/wastages", method: "POST", body }),
            invalidatesTags: ["Wastage"],
        }),

        // Update
        updateWastage: build.mutation({
            query: ({ id, ...body }) => ({ url: `/wastages/${id}`, method: "PUT", body }),
            invalidatesTags: (result, error, { id }) => [{ type: "Wastage", id }, "Wastage"],
        }),

        // Delete
        deleteWastage: build.mutation({
            query: (id) => ({ url: `/wastages/${id}`, method: "DELETE" }),
            invalidatesTags: ["Wastage"],
        }),

        // Submit for approval  (draft → pending)
        submitWastage: build.mutation({
            query: (id) => ({ url: `/wastages/${id}/submit`, method: "PATCH" }),
            invalidatesTags: (result, error, id) => [{ type: "Wastage", id }, "Wastage"],
        }),

        // Approve  (pending → approved + stock deducted)
        approveWastage: build.mutation({
            query: (id) => ({ url: `/wastages/${id}/approve`, method: "PATCH" }),
            invalidatesTags: (result, error, id) => [{ type: "Wastage", id }, "Wastage", "Product"],
        }),

        // Reject  (pending → rejected)
        rejectWastage: build.mutation({
            query: ({ id, rejectionReason }) => ({
                url: `/wastages/${id}/reject`,
                method: "PATCH",
                body: { rejectionReason },
            }),
            invalidatesTags: (result, error, { id }) => [{ type: "Wastage", id }, "Wastage"],
        }),
    }),
});

export const {
    useGetWastagesQuery: useWastages,
    useGetAllWastagesQuery: useAllWastages,
    useGetWastageByIdQuery: useWastage,
    useCreateWastageMutation: useCreateWastage,
    useUpdateWastageMutation: useUpdateWastage,
    useDeleteWastageMutation: useDeleteWastage,
    useSubmitWastageMutation: useSubmitWastage,
    useApproveWastageMutation: useApproveWastage,
    useRejectWastageMutation: useRejectWastage,
} = wastageApi;