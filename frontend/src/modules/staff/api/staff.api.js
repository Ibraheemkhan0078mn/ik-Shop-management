import { baseApi } from "../../../app/rtkBaseApi.js";

export const staffApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({
        // Staff CRUD
        getStaffList: builder.query({
            query: (params) => ({
                url: "/staff",
                params,
            }),
            transformResponse: (r)=>{
                return r;
            },
            providesTags: ["Staff"],
        }),
        getStaffById: builder.query({
            query: (id) => ({
                url: `/staff/${id}`,
            }),
            providesTags: (result, error, id) => [{ type: "Staff", id }],
        }),
        createStaff: builder.mutation({
            query: (data) => ({
                url: "/staff",
                method: "POST",
                body: data,
            }),
            invalidatesTags: ["Staff"],
        }),
        updateStaff: builder.mutation({
            query: ({ id, data }) => ({
                url: `/staff/${id}`,
                method: "PUT",
                body: data,
            }),
            invalidatesTags: (result, error, { id }) => [{ type: "Staff", id }, "Staff"],
        }),
        deleteStaff: builder.mutation({
            query: (id) => ({
                url: `/staff/${id}`,
                method: "DELETE",
            }),
            invalidatesTags: ["Staff"],
        }),
        addDocument: builder.mutation({
            query: ({ id, data }) => ({
                url: `/staff/${id}/documents`,
                method: "POST",
                body: data,
            }),
            invalidatesTags: (result, error, { id }) => [{ type: "Staff", id }],
        }),
        addImages: builder.mutation({
            query: ({ id, formData }) => ({
                url: `/staff/${id}/images`,
                method: "POST",
                body: formData,
                formData: true,
            }),
            invalidatesTags: (result, error, { id }) => [{ type: "Staff", id }],
        }),
        removeImage: builder.mutation({
            query: ({ id, imageId }) => ({
                url: `/staff/${id}/images/${imageId}`,
                method: "DELETE",
            }),
            invalidatesTags: (result, error, { id }) => [{ type: "Staff", id }],
        }),
        removeDocument: builder.mutation({
            query: ({ id, docId }) => ({
                url: `/staff/${id}/documents/${docId}`,
                method: "DELETE",
            }),
            invalidatesTags: (result, error, { id }) => [{ type: "Staff", id }],
        }),

        // Salary Payments
        getSalaryPayments: builder.query({
            query: (staffId) => ({
                url: `/staff/salary-payment/${staffId}`,
            }),
            providesTags: (result, error, staffId) => [{ type: "SalaryPayment", id: staffId }],
        }),
        createSalaryPayment: builder.mutation({
            query: (data) => ({
                url: "/staff/salary-payment",
                method: "POST",
                body: data,
            }),
            invalidatesTags: (result, error, { staffId }) => [{ type: "SalaryPayment", id: staffId }],
        }),
        deleteSalaryPayment: builder.mutation({
            query: (paymentId) => ({
                url: `/staff/salary-payment/${paymentId}`,
                method: "DELETE",
            }),
            invalidatesTags: (result, error, paymentId) => [{ type: "SalaryPayment" }],
        }),

        // Sale Bills
        getSaleBills: builder.query({
            query: (staffId) => ({
                url: `/staff/sale-bill/${staffId}`,
            }),
            providesTags: (result, error, staffId) => [{ type: "SaleBill", id: staffId }],
        }),
        createSaleBill: builder.mutation({
            query: (data) => ({
                url: "/staff/sale-bill",
                method: "POST",
                body: data,
            }),
            invalidatesTags: (result, error, { staffId }) => [{ type: "SaleBill", id: staffId }],
        }),
        markSaleBillAsPaid: builder.mutation({
            query: (id) => ({
                url: `/staff/sale-bill/${id}/pay`,
                method: "PUT",
            }),
            invalidatesTags: (result, error, id) => [{ type: "SaleBill", id }],
        }),
    }),
});

export const {
    useGetStaffListQuery,
    useGetStaffByIdQuery,
    useCreateStaffMutation,
    useUpdateStaffMutation,
    useDeleteStaffMutation,
    useAddDocumentMutation,
    useRemoveDocumentMutation,
    useAddImagesMutation,
    useRemoveImageMutation,
    useGetSalaryPaymentsQuery,
    useCreateSalaryPaymentMutation,
    useDeleteSalaryPaymentMutation,
    useGetSaleBillsQuery,
    useCreateSaleBillMutation,
    useMarkSaleBillAsPaidMutation,
} = staffApi;
