import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@shared/services/api.js";

// 1. Query Keys
export const ORDER_QUERY_KEYS = {
    all: ["orders"],
    detail: (id) => ["orders", id],
    generateNumber: ["orders", "generateNumber"],
};

// 2. API Service
export const OrderService = {
    getAll: async () => {
        const { data } = await api.get("/orders");
        return data;
    },
    generateNumber: async () => {
        const { data } = await api.get("/orders/generate-number");
        return data;
    },
    create: async (orderData) => {
        const { data } = await api.post("/orders", orderData);
        return data;
    },
    delete: async (id) => {
        const { data } = await api.delete(`/orders/${id}`);
        return data;
    },
};

// 3. Queries & Mutations
export const useOrders = () => {
    return useQuery({
        queryKey: ORDER_QUERY_KEYS.all,
        queryFn: OrderService.getAll,
    });
};

export const useGenerateOrderNumber = (options = {}) => {
    return useQuery({
        queryKey: ORDER_QUERY_KEYS.generateNumber,
        queryFn: OrderService.generateNumber,
        ...options, // Allows passing { enabled: false } if you want to fetch it manually
    });
};

export const useAddOrder = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: OrderService.create,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ORDER_QUERY_KEYS.all });
            // You might also want to invalidate the generate number query so it gets a fresh one next time
            queryClient.invalidateQueries({
                queryKey: ORDER_QUERY_KEYS.generateNumber,
            });
        },
    });
};

export const useDeleteOrder = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: OrderService.delete,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ORDER_QUERY_KEYS.all });
        },
    });
};
