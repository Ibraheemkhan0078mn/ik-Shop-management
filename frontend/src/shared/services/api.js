import axios from "axios";
import { showSuccess } from "../utilities/toastHelpers";
import { toast } from "sonner";

let unauthorizedHandler = null;

export const setUnauthorizedHandler = (handler) => {
    unauthorizedHandler = handler;
};

const api = axios.create({
    baseURL: import.meta.env.VITE_BACKEND_API_URL,
    withCredentials: true,
    headers: {
        "Content-Type": "application/json",
    },
});

api.interceptors.response.use(
    (response) => {
        let msg= response.data.msg || response.data.error || response.data.message 
       response.config.method !="get" && showSuccess(msg)
        return response
    },
    // (error) => {
    //     console.log(error)
    //     const status = error?.response?.status;
    //     const requestUrl = error?.config?.url || "";
    //     const isAuthMutation =
    //         requestUrl.includes("/auth/login") ||
    //         requestUrl.includes("/auth/register") ||
    //         requestUrl.includes("/auth/signup");

    //     if (status === 401 && !isAuthMutation && unauthorizedHandler) {
    //         unauthorizedHandler(error);
    //     }

    //     return Promise.reject(error);
    // },
);

export default api;

