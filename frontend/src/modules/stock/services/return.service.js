// return.service.js
import { baseApi } from "../../../app/rtkBaseApi.js";

export const returnApi = baseApi.injectEndpoints({
    endpoints: (build) => ({

        getReturns: build.query({
            query: ({ page = 1, limit = 20, ...filters } = {}) => ({
                url: "/returns/paginate",
                params: { page, limit, ...filters },
            }),
            transformResponse: (raw) => raw || raw.data,
            providesTags: ["Return"],
        }),

        getAllReturns: build.query({
            query: (filters = {}) => ({ url: "/returns", params: filters }),
            transformResponse: (raw) => raw.data || raw,
            providesTags: ["Return"],
        }),

        getReturnById: build.query({
            query: (id) => ({ url: `/returns/${id}` }),
            transformResponse: (raw) => raw.data || raw,
            providesTags: (result, error, id) => [{ type: "Return", id }],
        }),

        createReturn: build.mutation({
            query: (body) => ({ url: "/returns", method: "POST", body }),
            invalidatesTags: ["Return"],
        }),

        updateReturn: build.mutation({
            query: ({ id, ...body }) => ({ url: `/returns/updateReturn/${id}`, method: "PUT", body }),
            invalidatesTags: (result, error, { id }) => [{ type: "Return", id }, "Return"],
        }),

        deleteReturn: build.mutation({
            query: (id) => ({ url: `/returns/${id}`, method: "DELETE" }),
            invalidatesTags: ["Return"],
        }),

        submitReturn: build.mutation({
            query: (id) => ({ url: `/returns/${id}/submit`, method: "PATCH" }),
            invalidatesTags: (result, error, id) => [{ type: "Return", id }, "Return"],
        }),

        approveReturn: build.mutation({
            query: (id) => ({ url: `/returns/${id}/approve`, method: "PATCH" }),
            invalidatesTags: (result, error, id) => [{ type: "Return", id }, "Return", "Product"],
        }),

        rejectReturn: build.mutation({
            query: ({ id, rejectionReason }) => ({
                url: `/returns/${id}/reject`, method: "PATCH", body: { rejectionReason },
            }),
            invalidatesTags: (result, error, { id }) => [{ type: "Return", id }, "Return"],
        }),
    }),
});

export const {
    useGetReturnsQuery:      useReturns,
    useGetAllReturnsQuery:   useAllReturns,
    useGetReturnByIdQuery:   useReturn,
    useCreateReturnMutation: useCreateReturn,
    useUpdateReturnMutation: useUpdateReturn,
    useDeleteReturnMutation: useDeleteReturn,
    useSubmitReturnMutation: useSubmitReturn,
    useApproveReturnMutation:useApproveReturn,
    useRejectReturnMutation: useRejectReturn,
} = returnApi;