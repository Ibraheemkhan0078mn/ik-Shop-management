import { baseApi } from "../../../store/rtkBase.js"

export const inventoryApi = baseApi
    .enhanceEndpoints({
        addTagTypes: ["Inventory", "InventoryCategory"]
    })
    .injectEndpoints({
        endpoints: (build) => ({
            getAllInventory: build.query({
                query: ({ skip = 0, limit = 20, category = "all", status = "all", search = "" } = {}) => ({
                    url: `/inventoryRoutes/getAllInventory/${skip}/${limit}`,
                    method: "POST",
                    body: { category, status, search }
                }),
                transformResponse: (res) => ({
                    inventory: res?.inventory || [],
                    totalInventory: res?.totalInventory || 0,
                    success: !!res?.success
                }),
                providesTags: ["Inventory"]
            }),

            createInventory: build.mutation({
                query: (body) => ({
                    url: "/inventoryRoutes/inventoryCreate",
                    method: "POST",
                    body
                }),
                invalidatesTags: ["Inventory"]
            }),

            updateInventory: build.mutation({
                query: ({ id, body }) => ({
                    url: `/inventoryRoutes/inventoryUpdate/${id}`,
                    method: "PUT",
                    body
                }),
                invalidatesTags: (result, error, { id }) => [
                    "Inventory",
                    { type: "Inventory", id }
                ]
            }),

            deleteInventory: build.mutation({
                query: (id) => ({
                    url: `/inventoryRoutes/inventoryDelete/${id}`,
                    method: "DELETE"
                }),
                invalidatesTags: ["Inventory"]
            }),

            getAllInventoryCategories: build.query({
                query: () => ({
                    url: "/inventoryRoutes/getAllInventoryCatagory",
                    method: "GET"
                }),
                transformResponse: (res) => res?.categories || [],
                providesTags: ["InventoryCategory"]
            }),

            createInventoryCategory: build.mutation({
                query: (body) => ({
                    url: "/inventoryRoutes/inventoryCatagCreate",
                    method: "POST",
                    body
                }),
                invalidatesTags: ["InventoryCategory"]
            }),

            updateInventoryCategory: build.mutation({
                query: ({ id, name }) => ({
                    url: `/inventoryRoutes/inventoryCatagUpdate/${id}`,
                    method: "PUT",
                    body: { name }
                }),
                invalidatesTags: (result, error, { id }) => [
                    "InventoryCategory",
                    { type: "InventoryCategory", id },
                    "Inventory"
                ]
            }),

            deleteInventoryCategory: build.mutation({
                query: (id) => ({
                    url: `/inventoryRoutes/inventoryCatagDelete/${id}`,
                    method: "DELETE"
                }),
                invalidatesTags: ["InventoryCategory", "Inventory"]
            })
        })
    })

export const {
    useGetAllInventoryQuery,
    useLazyGetAllInventoryQuery,
    useCreateInventoryMutation,
    useUpdateInventoryMutation,
    useDeleteInventoryMutation,
    useGetAllInventoryCategoriesQuery,
    useLazyGetAllInventoryCategoriesQuery,
    useCreateInventoryCategoryMutation,
    useUpdateInventoryCategoryMutation,
    useDeleteInventoryCategoryMutation
} = inventoryApi