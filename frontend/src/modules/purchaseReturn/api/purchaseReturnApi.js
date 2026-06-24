import api from "../../../shared/services/api.js";

export const getPurchaseReturnsApi = async (params = {}) => {
    const response = await api.get("/purchase-returns", { params });
    return response.data;
};

export const getPaginatedPurchaseReturnsApi = async ({ page = 1, limit = 20, status, supplier } = {}) => {
    const params = { page, limit };
    if (status) params.status = status;
    if (supplier) params.supplier = supplier;

    const response = await api.get("/purchase-returns/paginate", { params });
    return response.data;
};

export const getPurchaseReturnByIdApi = async (id) => {
    const response = await api.get(`/purchase-returns/${id}`);
    return response.data;
};

export const getPurchaseByInvoiceNumberApi = async (invoiceNumber) => {
    const response = await api.post("/purchases/getPurchaseByInvoiceNumber", { invoiceNumber });
    return response.data;
};

export const createPurchaseReturnApi = async (payload) => {
    const response = await api.post("/purchase-returns", payload);
    return response.data;
};

export const updatePurchaseReturnApi = async (id, payload) => {
    const response = await api.put(`/purchase-returns/${id}`, payload);
    return response.data;
};

export const deletePurchaseReturnApi = async (id) => {
    const response = await api.delete(`/purchase-returns/${id}`);
    return response.data;
};

export const submitPurchaseReturnApi = async (id) => {
    const response = await api.put(`/purchase-returns/${id}/submit`);
    return response.data;
};

export const approvePurchaseReturnApi = async (id) => {
    const response = await api.put(`/purchase-returns/${id}/approve`);
    return response.data;
};

export const rejectPurchaseReturnApi = async (id, rejectionReason) => {
    const response = await api.put(`/purchase-returns/${id}/reject`, { rejectionReason });
    return response.data;
};

export const generatePurchaseReturnNumberApi = async () => {
    const response = await api.get("/purchase-returns/generate-number");
    return response.data;
};
