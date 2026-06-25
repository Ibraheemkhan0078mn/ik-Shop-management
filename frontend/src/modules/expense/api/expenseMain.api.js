import api from "../../../shared/services/axiosInstance.js";
import { showError } from "../../../shared/utilities/toastHelpers.js";

export async function getExpenses({ skip = 0, limit = 20, date = "none" } = {}) {
    try {
        const res = await api.get(`/expenseRoutes/getExpense/${skip}/${limit}/${date}`);
        return res?.data ?? {};
    } catch (error) {
        console.error(error);
        showError(error?.response?.data?.message || error?.message || "Failed to fetch expenses");
        throw error;
    }
}