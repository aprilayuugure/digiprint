import axios from "axios";
import { toast } from "react-toastify";
import { openLoginPromptFromBridge } from "../utils/loginPromptBridge";

const instance = axios.create({
    baseURL: "http://localhost:8080",
});

/** Origin only (no trailing slash) — dùng ghép URL file tĩnh `/storage/...`. */
export const API_ORIGIN = String(instance.defaults.baseURL || "").replace(/\/$/, "");

instance.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");

    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
});

function getErrorMessage(error) {
    const data = error.response?.data;
    if (!data) return "Operation failed";

    if (typeof data.message === "string" && data.message) return data.message;
    if (typeof data.general === "string" && data.general) return data.general;

    if (typeof data === "object" && data !== null) {
        const first = Object.values(data).find((v) => typeof v === "string" && v);
        if (first) return first;
    }

    const status = error.response?.status;
    if (status === 403) return "You are not allowed to perform this action.";
    if (status === 404) return "Resource not found.";
    if (status >= 500) return "Server error. Please try again later.";

    return "Operation failed";
}

instance.interceptors.response.use(
    (response) => {
        if (response.config?.skipSuccessToast) {
            return response;
        }
        const method = response.config.method?.toLowerCase();
        if (method === "post" || method === "put" || method === "patch" || method === "delete") {
            const msg = response.data?.message ?? "Operation successful.";
            toast.success(msg);
        }
        return response;
    },
    (error) => {
        const status = error.response?.status;
        if (status === 401) {
            const url = String(error.config?.url ?? "");
            const path = window.location.pathname;

            if (url.includes("/auth/login") || url.includes("/auth/register")) {
                toast.error(getErrorMessage(error));
                return Promise.reject(error);
            }

            localStorage.removeItem("token");
            localStorage.removeItem("user");
            window.dispatchEvent(new CustomEvent("auth:session-expired"));

            if (path !== "/login" && path !== "/register") {
                openLoginPromptFromBridge();
            }
            return Promise.reject(error);
        }

        toast.error(getErrorMessage(error));
        return Promise.reject(error);
    }
);

export default instance;