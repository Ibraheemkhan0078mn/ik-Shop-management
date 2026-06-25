import api from "../../../shared/services/api.js";
import { showError } from "../../../shared/utilities/toastHelpers.js";

export const getAllQarzaAccountsApi = async () => {
    try {
        const response = await api.get("/qarzaRoutes/getAllQarzaAccount");
        return response.data;
    } catch (error) {
        showError(error?.response?.data?.message || error?.message || "Failed to fetch qarza accounts");
        throw error;
    }
};