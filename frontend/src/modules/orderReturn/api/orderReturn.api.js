// ─── api/productReturn.api.js ─────────────────────────────────────────
import api from "../../../shared/services/api.js";

// Generate return number
export const generateReturnNumber = async () => {
    const response = await api.get("/product-returns/generate-number");
    return response.data;
};

// Get order for return
export const getOrderForReturn = async (orderNumber) => {
    const response = await api.get(`/product-returns/order/${orderNumber}`);
    return response.data;
};

// Create order return
export const createOrderReturn = async (data) => {
    const response = await api.post("/product-returns", data);
    return response.data;
};

// Get all order returns
export const getAllOrderReturns = async (params) => {
    const response = await api.get("/product-returns", { params });
    return response.data;
};

// Get paginated order returns
export const getPaginatedOrderReturns = async ({ page = 1, limit = 20, ...filters } = {}) => {
    const response = await api.get("/product-returns/pagination", {
        params: { page, limit, ...filters }
    });
    return response.data;
};

// Get order return by ID
export const getOrderReturnById = async (id) => {
    const response = await api.get(`/product-returns/${id}`);
    return response.data;
};

// Update order return
export const updateOrderReturn = async (id, data) => {
    const response = await api.put(`/product-returns/${id}`, data);
    return response.data;
};

// Delete order return
export const deleteOrderReturn = async (id) => {
    const response = await api.delete(`/product-returns/${id}`);
    return response.data;
};

// Update return status
export const updateReturnStatus = async (id, status) => {
    const response = await api.patch(`/product-returns/${id}/status`, { status });
    return response.data;
};
