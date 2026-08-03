import { baseApi } from "../../../app/rtkBaseApi.js";

export const inventoryApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({
        getInventoryCategories: builder.query({
            query: () => ({
                url: "/inventoryRoutes/getAllInventoryCatagory",
                method: "GET",
            }),
            providesTags: [{ type: "InventoryCategory", id: "LIST" }],
        }),

        getInventoryList: builder.query({
            query: ({ skip = 0, limit = 20, category = "all", status = "all", search = "" } = {}) => ({
                url: `/inventoryRoutes/getAllInventory/${skip}/${limit}`,
                method: "POST",
                body: { category, status, search },
            }),
            providesTags: [{ type: "Inventory", id: "LIST" }],
        }),

        createInventory: builder.mutation({
            query: (body) => ({
                url: "/inventoryRoutes/inventoryCreate",
                method: "POST",
                body,
            }),
            invalidatesTags: [{ type: "Inventory", id: "LIST" }],
        }),

        updateInventory: builder.mutation({
            query: ({ id, ...body }) => ({
                url: `/inventoryRoutes/inventoryUpdate/${id}`,
                method: "PUT",
                body,
            }),
            invalidatesTags: [{ type: "Inventory", id: "LIST" }],
        }),

        deleteInventory: builder.mutation({
            query: (id) => ({
                url: `/inventoryRoutes/inventoryDelete/${id}`,
                method: "DELETE",
            }),
            invalidatesTags: [{ type: "Inventory", id: "LIST" }],
        }),

        createInventoryCategory: builder.mutation({
            query: (name) => ({
                url: "/inventoryRoutes/inventoryCatagCreate",
                method: "POST",
                body: { name },
            }),
            invalidatesTags: [{ type: "InventoryCategory", id: "LIST" }],
        }),

        updateInventoryCategory: builder.mutation({
            query: ({ id, name }) => ({
                url: `/inventoryRoutes/inventoryCatagUpdate/${id}`,
                method: "PUT",
                body: { name },
            }),
            invalidatesTags: [{ type: "InventoryCategory", id: "LIST" }],
        }),

        deleteInventoryCategory: builder.mutation({
            query: (id) => ({
                url: `/inventoryRoutes/inventoryCatagDelete/${id}`,
                method: "DELETE",
            }),
            invalidatesTags: [{ type: "InventoryCategory", id: "LIST" }],
        }),
    }),
    overrideExisting: false,
});

export const {
    useGetInventoryCategoriesQuery,
    useGetInventoryListQuery,
    useLazyGetInventoryListQuery,
    useCreateInventoryMutation,
    useUpdateInventoryMutation,
    useDeleteInventoryMutation,
    useCreateInventoryCategoryMutation,
    useUpdateInventoryCategoryMutation,
    useDeleteInventoryCategoryMutation,
} = inventoryApi;
