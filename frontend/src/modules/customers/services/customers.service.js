import { baseApi } from "../../../app/rtkBaseApi.js";

export const customerApi = baseApi.injectEndpoints({
    endpoints: (build) => ({
        getCustomers: build.query({
            query: ({ page = 1, limit = 20, ...filters } = {}) => ({
                url: "/customers/pagination",
                params: { page, limit, ...filters },
            }),
            providesTags: ["Customer"],
        }),

        getAllCustomers: build.query({
            query: () => ({ url: "/customers" }),
            transformResponse: (raw) => raw?.data ?? raw,
            providesTags: ["Customer"],
        }),

        getCustomerById: build.query({
            query: (id) => ({ url: `/customers/${id}` }),
            transformResponse: (raw) => raw?.data ?? raw,
            providesTags: (_r, _e, id) => [{ type: "Customer", id }],
        }),

        createCustomer: build.mutation({
            query: (body) => ({ url: "/customers", method: "POST", body }),
            invalidatesTags: ["Customer"],
        }),

        updateCustomer: build.mutation({
            query: ({ id, formData, ...body }) => ({ url: `/customers/${id}`, method: "PUT", body: formData ?? body }),
            invalidatesTags: (_r, _e, { id }) => [{ type: "Customer", id }, "Customer"],
        }),

        deleteCustomer: build.mutation({
            query: (id) => ({ url: `/customers/${id}`, method: "DELETE" }),
            invalidatesTags: ["Customer"],
        }),
    }),
});

export const {
    useGetCustomersQuery: useCustomers,
    useGetAllCustomersQuery: useAllCustomers,
    useGetCustomerByIdQuery: useCustomer,
    useCreateCustomerMutation: useCreateCustomer,
    useUpdateCustomerMutation: useUpdateCustomer,
    useDeleteCustomerMutation: useDeleteCustomer,
} = customerApi;
