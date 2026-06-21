// src/modules/wastage/services/wastage.service.js
import { baseApi } from "@app/rtkBaseApi.js";

export const wastageApi = baseApi.injectEndpoints({
    endpoints: (build) => ({

        getWastages: build.query({
            query: ({ page = 1, limit = 20, ...filters } = {}) => ({
                url: "/api/wastages/paginate",
                params: { page, limit, ...filters },
            }),
            providesTags: ["Wastage"],
        }),

        getAllWastages: build.query({
            query: (filters = {}) => ({ url: "/api/wastages", params: filters }),
            transformResponse: (raw) => raw.data ?? raw,
            providesTags: ["Wastage"],
        }),

        getWastageById: build.query({
            query: (id) => ({ url: `/api/wastages/${id}` }),
            transformResponse: (raw) => raw.data ?? raw,
            providesTags: (_r, _e, id) => [{ type: "Wastage", id }],
        }),

        createWastage: build.mutation({
            query: (body) => ({ url: "/api/wastages", method: "POST", body }),
            invalidatesTags: ["Wastage"],
        }),

        updateWastage: build.mutation({
            query: ({ id, ...body }) => ({ url: `/api/wastages/${id}`, method: "PUT", body }),
            invalidatesTags: (_r, _e, { id }) => [{ type: "Wastage", id }, "Wastage"],
        }),

        deleteWastage: build.mutation({
            query: (id) => ({ url: `/api/wastages/${id}`, method: "DELETE" }),
            invalidatesTags: ["Wastage"],
        }),

        submitWastage: build.mutation({
            query: (id) => ({ url: `/api/wastages/${id}/submit`, method: "PATCH" }),
            invalidatesTags: (_r, _e, id) => [{ type: "Wastage", id }, "Wastage"],
        }),

        approveWastage: build.mutation({
            query: (id) => ({ url: `/api/wastages/${id}/approve`, method: "PATCH" }),
            invalidatesTags: (_r, _e, id) => [{ type: "Wastage", id }, "Wastage", "Product"],
        }),

        rejectWastage: build.mutation({
            query: ({ id, rejectionReason }) => ({
                url: `/api/wastages/${id}/reject`, method: "PATCH", body: { rejectionReason },
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
