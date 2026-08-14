import axios from "axios";
import { showSuccess } from "../utilities/toastHelpers";
import { toast } from "sonner";
import { backendBaseUrl } from "../constants/constants";

let unauthorizedHandler = null;

export const setUnauthorizedHandler = (handler) => {
    unauthorizedHandler = handler;
};

// Detect if running in Electron environment
const isElectron = typeof window !== 'undefined' && 
                   (window.navigator.userAgent.includes('Electron') || 
                    (window.process && window.process.type === 'renderer'));

// Use proxy in development, direct URL in Electron
const baseURL = isElectron ? backendBaseUrl : '/api';

console.log('API Base URL:', baseURL, 'Is Electron:', isElectron);

const api = axios.create({
    baseURL: baseURL,
    withCredentials: true,
    headers: {
        "Content-Type": "application/json",
    },
    paramsSerializer: {
        serialize: (params) => {
            // Custom serializer to handle arrays properly
            const parts = [];
            Object.keys(params).forEach(key => {
                const value = params[key];
                if (value === null || value === undefined) {
                    return;
                }
                if (Array.isArray(value)) {
                    // Serialize arrays as repeated parameters: key=val1&key=val2
                    value.forEach(v => {
                        parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(v)}`);
                    });
                } else {
                    parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(value)}`);
                }
            });
            return parts.join('&');
        }
    }
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

