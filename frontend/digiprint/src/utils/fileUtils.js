import instance from "../api/axiosInstance";

export const getServerFileUrl = (path, fallback = null) => {
    if (!path) return fallback;

    if (path.startsWith("http")) return path;

    const base = instance.defaults.baseURL;

    const normalizedPath = path.startsWith("/") ? path : `/${path}`;

    return `${base}${normalizedPath}`;
};

export const getPreviewSource = (file, fallback = null) => {
    if (file instanceof File) {
        return URL.createObjectURL(file);
    }

    return getServerFileUrl(file, fallback);
};