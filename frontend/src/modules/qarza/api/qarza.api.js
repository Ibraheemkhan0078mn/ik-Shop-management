import api from "@shared/services/api.js";
 
export const getAllQarzaAccountsApi = async () => {
    const response = await api.get("/qarzaRoutes/getAllQarzaAccount");
    return response.data;
};