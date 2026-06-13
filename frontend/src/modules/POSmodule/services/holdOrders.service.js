import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../../../lib/api.js";

// ─────────────────────────────────────────────────────────────────────────────
//  Query key — used by React Query to cache and invalidate hold-order data
// ─────────────────────────────────────────────────────────────────────────────
export const HOLD_ORDER_KEYS = {
    all: ["hold-orders"],
};

// ─────────────────────────────────────────────────────────────────────────────
//  Raw API calls — plain async functions, no hooks
// ─────────────────────────────────────────────────────────────────────────────
export const HoldOrderService = {
    getAll: async ()     => (await api.get("/hold-orders")).data,
    create: async (body) => (await api.post("/hold-orders", body)).data,
    delete: async (id)   => (await api.delete(`/hold-orders/${id}`)).data,
};

// ─────────────────────────────────────────────────────────────────────────────
//  React Query hooks — use these inside components
// ─────────────────────────────────────────────────────────────────────────────

// Fetches all held orders (auto-cached + auto-refetched by React Query)
export const useHoldOrders = () =>
    useQuery({ queryKey: HOLD_ORDER_KEYS.all, queryFn: HoldOrderService.getAll });

// Saves a new held order, then refreshes the held-orders list
export const useCreateHoldOrder = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: HoldOrderService.create,
        onSuccess:  () => queryClient.invalidateQueries({ queryKey: HOLD_ORDER_KEYS.all }),
    });
};

// Deletes a held order (manual delete or after checkout), then refreshes the list
export const useDeleteHoldOrder = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: HoldOrderService.delete,
        onSuccess:  () => queryClient.invalidateQueries({ queryKey: HOLD_ORDER_KEYS.all }),
    });
};
