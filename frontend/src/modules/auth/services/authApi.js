import { baseApi } from "../../../app/rtkBaseApi.js";

export const authApi = baseApi.injectEndpoints({
    endpoints: (build) => ({
        login: build.mutation({
            query: (data) => ({ url: "/auth/login", method: "POST", body: data }),
        }),
        signup: build.mutation({
            query: (data) => ({ url: "/auth/register", method: "POST", body: data }),
        }),
        logout: build.mutation({
            query: () => ({ url: "/auth/logout", method: "POST" }),
        }),
        getUser: build.query({
            query: (userId) => ({ url: "/auth/me", params: { userId } }),
        }),
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
    useLoginMutation,
    useSignupMutation,
    useLogoutMutation,
    useGetUserQuery,
    useGetAllUsersQuery,
    useGetUserByIdQuery,
    useCreateUserMutation,
    useUpdateUserMutation,
    useDeleteUserMutation,
} = authApi;
