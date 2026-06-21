import { baseApi } from "@app/rtkBaseApi.js";

export const authApi = baseApi.injectEndpoints({
    endpoints: (build) => ({
        login: build.mutation({
            query: (data) => ({ url: "/api/auth/login", method: "POST", body }),
        }),
        signup: build.mutation({
            query: (data) => ({ url: "/api/auth/register", method: "POST", body }),
        }),
        logout: build.mutation({
            query: () => ({ url: "/api/auth/logout", method: "POST" }),
        }),
        getUser: build.query({
            query: () => ({ url: "/api/auth/me" }),
        }),
    }),
});

export const {
    useLoginMutation,
    useSignupMutation,
    useLogoutMutation,
    useGetUserQuery,
} = authApi;
