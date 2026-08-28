import api from "../../../shared/services/api.js";
import { showError } from "../../../shared/utilities/toastHelpers.js";

export const QarzaService = {
    search: async (searchText, limit = 20) => {
        try {
            const { data } = await api.get("/qarzaRoutes/search", {
                params: { q: searchText, limit }
            });
            return data.data || [];
        } catch (error) {
            showError(error?.response?.data?.message || error?.message || "Failed to search qarza accounts");
            throw error;
        }
    },
};
