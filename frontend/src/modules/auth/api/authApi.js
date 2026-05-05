import api from "../../../lib/api.js";

export const AuthService = {
    login: async (data) => {
        const { data: response } = await api.post("/auth/login", data);
        return response;
    },
    signup: async (data) => {
        const { data: response } = await api.post("/auth/register", data);
        return response;
    },
    logout: async () => {
        const { data: response } = await api.post("/auth/logout");
        return response;
    },
    getUser: async () => {
        const { data: response } = await api.get("/auth/me");
        return response;
    },
};
