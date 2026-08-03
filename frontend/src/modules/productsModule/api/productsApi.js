import api from "../../../shared/services/api.js";
import { showError } from "../../../shared/utilities/toastHelpers.js";

export const ProductService = {
    getAll: async () => {
        try {
            const { data } = await api.get("/products");
            return data;
        } catch (error) {
            showError(error?.response?.data?.message || error?.message || "Failed to fetch products");
            throw error;
        }
    },
    getById: async (id) => {
        try {
            const { data } = await api.get(`/products/${id}`);
            return data.data;
        } catch (error) {
            showError(error?.response?.data?.message || error?.message || "Failed to fetch product");
            throw error;
        }
    },
    create: async (productData) => {
        try {
            const { data } = await api.post("/products", productData);
            return data;
        } catch (error) {
            showError(error?.response?.data?.message || error?.message || "Failed to create product");
            throw error;
        }
    },
    update: async ({ id, ...productData }) => {
        try {
            const { data } = await api.put(`/products/${id}`, productData);
            return data;
        } catch (error) {
            showError(error?.response?.data?.message || error?.message || "Failed to update product");
            throw error;
        }
    },
    delete: async (id) => {
        try {
            const { data } = await api.delete(`/products/${id}`);
            return data;
        } catch (error) {
            showError(error?.response?.data?.message || error?.message || "Failed to delete product");
            throw error;
        }
    },
};
