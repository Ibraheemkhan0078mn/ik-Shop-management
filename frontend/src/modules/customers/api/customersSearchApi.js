import api from "../../../shared/services/api.js";
import { showError } from "../../../shared/utilities/toastHelpers.js";

export const CustomerService = {
    search: async (searchText, limit = 20) => {
        try {
            const { data } = await api.get("/customers/search", {
                params: { q: searchText, limit }
            });
            return data.data || [];
        } catch (error) {
            showError(error?.response?.data?.message || error?.message || "Failed to search customers");
            throw error;
        }
    },
};
