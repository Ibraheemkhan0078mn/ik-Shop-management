// src/modules/wastage/services/wastage.service.js
import { baseApi } from "../../../app/rtkBaseApi.js";

export const wastageApi = baseApi.injectEndpoints({
    endpoints: (build) => ({

        getWastages: build.query({
            query: ({ page = 1, limit = 20, ...filters } = {}) => ({
                url: "/wastages/paginate",
                params: { page, limit, ...filters },
            }),
            providesTags: ["Wastage"],
        }),

        getAllWastages: build.query({
            query: (filters = {}) => ({ url: "/wastages", params: filters }),
            transformResponse: (raw) => raw.data ?? raw,
            providesTags: ["Wastage"],
        }),

        getWastageById: build.query({
            query: (id) => ({ url: `/wastages/${id}` }),
            transformResponse: (raw) => raw.data ?? raw,
            providesTags: (_r, _e, id) => [{ type: "Wastage", id }],
        }),

        createWastage: build.mutation({
            query: (body) => ({ url: "/wastages", method: "POST", body }),
            invalidatesTags: ["Wastage", "Product", "Batch"],
        }),

        updateWastage: build.mutation({
            query: ({ id, ...body }) => ({ url: `/wastages/${id}`, method: "PUT", body }),
            invalidatesTags: (_r, _e, { id }) => [{ type: "Wastage", id }, "Wastage", "Product", "Batch"],
            async onQueryStarted({ id, ...body }, { dispatch, queryFulfilled }) {
                try {
                    const { data: updatedWastage } = await queryFulfilled;
                    // Update the cache manually without refetch
                    dispatch(
                        wastageApi.util.updateQueryData('getWastages', undefined, (draft) => {
                            const index = draft.data?.findIndex(w => w._id === id);
                            if (index !== -1 && draft.data[index]) {
                                draft.data[index] = { ...draft.data[index], ...updatedWastage.data };
                            }
                        })
                    );
                } catch (error) {
                    console.error('Failed to update cache after update:', error);
                }
            },
        }),

        deleteWastage: build.mutation({
            query: (id) => ({ url: `/wastages/${id}`, method: "DELETE" }),
            invalidatesTags: ["Wastage", "Product", "Batch"],
            async onQueryStarted(id, { dispatch, queryFulfilled }) {
                try {
                    await queryFulfilled;
                    // Update the cache manually without refetch
                    dispatch(
                        wastageApi.util.updateQueryData('getWastages', undefined, (draft) => {
                            if (draft.data) {
                                draft.data = draft.data.filter(w => w._id !== id);
                                draft.total = (draft.total || 0) - 1;
                            }
                        })
                    );
                } catch (error) {
                    console.error('Failed to update cache after delete:', error);
                }
            },
        }),

        submitWastage: build.mutation({
            query: (id) => ({ url: `/wastages/${id}/submit`, method: "PATCH" }),
            invalidatesTags: (_r, _e, id) => [{ type: "Wastage", id }, "Wastage"],
        }),

        approveWastage: build.mutation({
            query: (id) => ({ url: `/wastages/${id}/approve`, method: "PATCH" }),
            invalidatesTags: (_r, _e, id) => [{ type: "Wastage", id }, "Wastage", "Product", "Batch"],
            async onQueryStarted(id, { dispatch, queryFulfilled }) {
                try {
                    const { data: updatedWastage } = await queryFulfilled;
                    // Update the cache manually without refetch
                    dispatch(
                        wastageApi.util.updateQueryData('getWastages', undefined, (draft) => {
                            const index = draft.data?.findIndex(w => w._id === id);
                            if (index !== -1 && draft.data[index]) {
                                draft.data[index] = { ...draft.data[index], ...updatedWastage.data, status: 'approved' };
                            }
                        })
                    );
                } catch (error) {
                    console.error('Failed to update cache after approval:', error);
                }
            },
        }),

        rejectWastage: build.mutation({
            query: ({ id, rejectionReason }) => ({
                url: `/wastages/${id}/reject`, method: "PATCH", body: { rejectionReason },
            }),
            invalidatesTags: (_r, _e, { id }) => [{ type: "Wastage", id }, "Wastage"],
        }),
    }),
});

export const {
    useGetWastagesQuery:       useWastages,
    useGetAllWastagesQuery:    useAllWastages,
    useGetWastageByIdQuery:    useWastage,
    useCreateWastageMutation:  useCreateWastage,
    useUpdateWastageMutation:  useUpdateWastage,
    useDeleteWastageMutation:  useDeleteWastage,
    useSubmitWastageMutation:  useSubmitWastage,
    useApproveWastageMutation: useApproveWastage,
    useRejectWastageMutation:  useRejectWastage,
} = wastageApi;
