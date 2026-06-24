import { baseApi } from "../../../app/rtkBaseApi.js";

export const authApi = baseApi.injectEndpoints({
    endpoints: (build) => ({
        login: build.mutation({
            query: (data) => ({ url: "/auth/login", method: "POST", body }),
        }),
        signup: build.mutation({
            query: (data) => ({ url: "/auth/register", method: "POST", body }),
        }),
        logout: build.mutation({
            query: () => ({ url: "/auth/logout", method: "POST" }),
        }),
        getUser: build.query({
            query: () => ({ url: "/auth/me" }),
        }),
    }),
});

export const {
    useLoginMutation,
    useSignupMutation,
    useLogoutMutation,
    useGetUserQuery,
} = authApi;
