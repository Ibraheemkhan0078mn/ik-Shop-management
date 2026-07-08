import { baseApi } from "../../../app/rtkBaseApi.js";

export const settingsApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({
        // Get Settings
        getSettings: builder.query({
            query: (userId) => ({
                url: "/settings",
                params: { userId },
            }),
            providesTags: ["Settings"],
        }),
        // Update Settings (all settings)
        updateSettings: builder.mutation({
            query: (data) => ({
                url: "/settings",
                method: "PUT",
                body: data,
            }),
            invalidatesTags: ["Settings"],
        }),
        // Update Shop Settings
        updateShopSettings: builder.mutation({
            query: (data) => ({
                url: "/settings/shop",
                method: "PUT",
                body: data,
            }),
            invalidatesTags: ["Settings"],
        }),
        // Update Printer Settings
        updatePrinterSettings: builder.mutation({
            query: (data) => ({
                url: "/settings/printer",
                method: "PUT",
                body: data,
            }),
            invalidatesTags: ["Settings"],
        }),
        // Update Camera Settings
        updateCameraSettings: builder.mutation({
            query: (data) => ({
                url: "/settings/camera",
                method: "PUT",
                body: data,
            }),
            invalidatesTags: ["Settings"],
        }),
        // Update Language Settings
        updateLanguageSettings: builder.mutation({
            query: (data) => ({
                url: "/settings/language",
                method: "PUT",
                body: data,
            }),
            invalidatesTags: ["Settings"],
        }),
        // Update Module Settings
        updateModuleSettings: builder.mutation({
            query: (data) => ({
                url: "/settings/modules",
                method: "PUT",
                body: data,
            }),
            invalidatesTags: ["Settings"],
        }),
    }),
});

export const {
    useGetSettingsQuery,
    useUpdateSettingsMutation,
    useUpdateShopSettingsMutation,
    useUpdatePrinterSettingsMutation,
    useUpdateCameraSettingsMutation,
    useUpdateLanguageSettingsMutation,
    useUpdateModuleSettingsMutation,
} = settingsApi;
