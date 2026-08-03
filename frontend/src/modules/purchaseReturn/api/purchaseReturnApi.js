import api from "../../../shared/services/api.js";
import { showError } from "../../../shared/utilities/toastHelpers.js";

export const getPurchaseReturnsApi = async (params = {}) => {
    try {
        const response = await api.get("/purchase-returns", { params });
        return response.data;
    } catch (error) {
        showError(error?.response?.data?.message || error?.message || "Failed to fetch purchase returns");
        throw error;
    }
};

export const getPaginatedPurchaseReturnsApi = async ({ page = 1, limit = 20, status, supplier } = {}) => {
    try {
        const params = { page, limit };
        if (status) params.status = status;
        if (supplier) params.supplier = supplier;

        const response = await api.get("/purchase-returns/paginate", { params });
        return response.data;
    } catch (error) {
        showError(error?.response?.data?.message || error?.message || "Failed to fetch purchase returns");
        throw error;
    }
};

export const getPurchaseReturnByIdApi = async (id) => {
    try {
        const response = await api.get(`/purchase-returns/${id}`);
        return response.data;
    } catch (error) {
        showError(error?.response?.data?.message || error?.message || "Failed to fetch purchase return");
        throw error;
    }
};

export const getPurchaseByInvoiceNumberApi = async (invoiceNumber) => {
    try {
        const response = await api.post("/purchases/getPurchaseByInvoiceNumber", { invoiceNumber });
        return response.data;
    } catch (error) {
        showError(error?.response?.data?.message || error?.message || "Failed to search purchase");
        throw error;
    }
};

export const createPurchaseReturnApi = async (payload) => {
    try {
        const response = await api.post("/purchase-returns", payload);
        return response.data;
    } catch (error) {
        showError(error?.response?.data?.message || error?.message || "Failed to create purchase return");
        throw error;
    }
};

export const updatePurchaseReturnApi = async (id, payload) => {
    try {
        const response = await api.put(`/purchase-returns/${id}`, payload);
        return response.data;
    } catch (error) {
        showError(error?.response?.data?.message || error?.message || "Failed to update purchase return");
        throw error;
    }
};

export const deletePurchaseReturnApi = async (id) => {
    try {
        const response = await api.delete(`/purchase-returns/${id}`);
        return response.data;
    } catch (error) {
        showError(error?.response?.data?.message || error?.message || "Failed to delete purchase return");
        throw error;
    }
};

export const submitPurchaseReturnApi = async (id) => {
    try {
        const response = await api.put(`/purchase-returns/${id}/submit`);
        return response.data;
    } catch (error) {
        showError(error?.response?.data?.message || error?.message || "Failed to submit purchase return");
        throw error;
    }
};

export const approvePurchaseReturnApi = async (id) => {
    try {
        const response = await api.put(`/purchase-returns/${id}/approve`);
        return response.data;
    } catch (error) {
        showError(error?.response?.data?.message || error?.message || "Failed to approve purchase return");
        throw error;
    }
};

export const rejectPurchaseReturnApi = async (id, rejectionReason) => {
    try {
        const response = await api.put(`/purchase-returns/${id}/reject`, { rejectionReason });
        return response.data;
    } catch (error) {
        showError(error?.response?.data?.message || error?.message || "Failed to reject purchase return");
        throw error;
    }
};

export const generatePurchaseReturnNumberApi = async () => {
    try {
        const response = await api.get("/purchase-returns/generate-number");
        return response.data;
    } catch (error) {
        showError(error?.response?.data?.message || error?.message || "Failed to generate return number");
        throw error;
    }
};
