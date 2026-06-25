import api from "../../../shared/services/api.js";
import { showError } from "../../../shared/utilities/toastHelpers.js";

const ordersApi = {
  fetchOrders: async (type = "other") => {
    try {
        const response = await api.get(`/orders?orderType=${type}`);
        return response.data;
    } catch (error) {
        showError(error?.response?.data?.message || error?.message || "Failed to fetch orders");
        throw error;
    }
  },
  addOrder: async (body) => {
    try {
        const response = await api.post("/orders", body);
        return response.data;
    } catch (error) {
        showError(error?.response?.data?.message || error?.message || "Failed to create order");
        throw error;
    }
  },
  editOrder: async ({ id, body }) => {
    try {
        const response = await api.put(`/orders/${id}`, body);
        return response.data;
    } catch (error) {
        showError(error?.response?.data?.message || error?.message || "Failed to update order");
        throw error;
    }
  },
  deleteOrder: async (id) => {
    try {
        const response = await api.delete(`/orders/${id}`);
        return response.data;
    } catch (error) {
        showError(error?.response?.data?.message || error?.message || "Failed to delete order");
        throw error;
    }
  },
};

export default ordersApi;

