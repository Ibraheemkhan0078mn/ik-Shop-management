import api from "@shared/services/api.js";
 
export const getAllQarzaAccountsApi = async () => {
    const response = await api.get("/api/qarzaRoutes/getAllQarzaAccount");
    return response.data;
};