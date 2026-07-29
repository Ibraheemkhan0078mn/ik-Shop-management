import { baseApi } from "../../../app/rtkBaseApi.js";

export const backupApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({
        // Get Storage Info
        getStorageInfo: builder.query({
            query: () => ({
                url: "/backup/storage-info",
            }),
            transformResponse: (response) => response.data,
            providesTags: ["Backup"],
        }),
        // Sync All Data
        syncAll: builder.mutation({
            query: () => ({
                url: "/backup/sync-all",
                method: "POST",
            }),
            invalidatesTags: ["Backup"],
        }),
        // Sync Required Data Only
        syncRequired: builder.mutation({
            query: () => ({
                url: "/backup/sync-required",
                method: "POST",
            }),
            invalidatesTags: ["Backup"],
        }),
        // Stop Sync
        stopSync: builder.mutation({
            query: () => ({
                url: "/backup/stop-sync",
                method: "POST",
            }),
            invalidatesTags: ["Backup"],
        }),
        // Get Sync Status
        getSyncStatus: builder.query({
            query: () => ({
                url: "/backup/sync-status",
            }),
            providesTags: ["Backup"],
        }),
        // Export Excel
        exportExcel: builder.mutation({
            query: (userId) => ({
                url: "/backup/export-excel",
                method: "POST",
                body: { userId },
            }),
            invalidatesTags: ["Backup"],
        }),
        // Export Filtered Data
        exportFilteredData: builder.mutation({
            query: (data) => ({
                url: "/backup/export-filtered",
                method: "POST",
                body: data,
            }),
            invalidatesTags: ["Backup"],
        }),
    }),
});

export const {
    useGetStorageInfoQuery,
    useSyncAllMutation,
    useSyncRequiredMutation,
    useStopSyncMutation,
    useGetSyncStatusQuery,
    useExportExcelMutation,
    useExportFilteredDataMutation,
} = backupApi;
