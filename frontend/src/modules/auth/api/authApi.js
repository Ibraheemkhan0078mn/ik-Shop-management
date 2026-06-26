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
    }),
});

export const {
    useLoginMutation,
    useSignupMutation,
    useLogoutMutation,
    useGetUserQuery,
} = authApi;
