import { baseApi } from "../../../app/rtkBaseApi.js";

export const qarzaApi = baseApi.injectEndpoints({
    endpoints: (build) => ({

        getQarzaAccounts: build.query({
            query: () => ({
                url: "/qarzaRoutes/getAllQarzaAccount",
            }),
            transformResponse: (res) => { ; return res.data },
            providesTags: ["Qarza"],
        }),

    }),
});

export const {
    useGetQarzaAccountsQuery,
} = qarzaApi;