import { baseApi } from "../../../app/rtkBaseApi.js";

export const userApi = baseApi.injectEndpoints({
    endpoints: (build) => ({
        getAllUsers: build.query({
            query: () => ({ url: "/users/all" }),
            providesTags: ["User"],
        }),
        getUserById: build.query({
            query: (id) => ({ url: `/users/${id}` }),
            providesTags: (_r, _e, id) => [{ type: "User", id }],
        }),
        createUser: build.mutation({
            query: (data) => ({ url: "/users/create", method: "POST", body: data }),
            invalidatesTags: ["User"],
        }),
        updateUser: build.mutation({
            query: (data) => ({ url: "/users/update", method: "PUT", body: data }),
            invalidatesTags: ["User"],
        }),
        deleteUser: build.mutation({
            query: (id) => ({ url: "/users/delete", method: "DELETE", body: { _id: id } }),
            invalidatesTags: ["User"],
        }),
    }),
});

export const {
    useGetAllUsersQuery,
    useGetUserByIdQuery,
    useCreateUserMutation,
    useUpdateUserMutation,
    useDeleteUserMutation,
} = userApi;
