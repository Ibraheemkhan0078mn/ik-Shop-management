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
        checkAdminRegistration: build.query({
            query: () => ({ url: "/auth/check-admin-registration" }),
        }),
        getAllUsers: build.query({
            query: () => ({ url: "/users/all" }),
            providesTags: ["User"],
        }),
        getUserById: build.query({
            query: (id) => ({ url: `/users/${id}` }),
            providesTags: (_r, _e, id) => [{ type: "User", id }],
        }),
        getUserByIdWithPassword: build.query({
            query: ({ id, requesterRole }) => ({ 
                url: `/users/${id}/with-password`, 
                params: { requesterRole } 
            }),
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
        getAllUserRoles: build.query({
            query: ({ page = 1, limit = 20 } = {}) => ({ url: "/user-roles/all", params: { page, limit } }),
            providesTags: ["UserRole"],
        }),
        getUserRoleById: build.query({
            query: (id) => ({ url: `/user-roles/${id}` }),
            providesTags: (_r, _e, id) => [{ type: "UserRole", id }],
        }),
        createUserRole: build.mutation({
            query: (data) => ({ url: "/user-roles/create", method: "POST", body: data }),
            invalidatesTags: ["UserRole"],
        }),
        updateUserRole: build.mutation({
            query: (data) => ({ url: "/user-roles/update", method: "PUT", body: data }),
            invalidatesTags: ["UserRole"],
        }),
        deleteUserRole: build.mutation({
            query: (id) => ({ url: "/user-roles/delete", method: "DELETE", body: { _id: id } }),
            invalidatesTags: ["UserRole"],
        }),
    }),
});

export const {
    useLoginMutation,
    useSignupMutation,
    useLogoutMutation,
    useGetUserQuery,
    useCheckAdminRegistrationQuery,
    useGetAllUsersQuery,
    useGetUserByIdQuery,
    useGetUserByIdWithPasswordQuery,
    useCreateUserMutation,
    useUpdateUserMutation,
    useDeleteUserMutation,
    useGetAllUserRolesQuery,
    useGetUserRoleByIdQuery,
    useCreateUserRoleMutation,
    useUpdateUserRoleMutation,
    useDeleteUserRoleMutation,
} = authApi;
