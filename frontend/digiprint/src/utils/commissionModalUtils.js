import { API_ORIGIN } from "../api/axiosInstance";

export function storageAbsoluteUrl(path) {
    if (!path) return "";
    const p = path.startsWith("/") ? path : `/${path}`;
    return `${API_ORIGIN}${p}`;
}

export function newAttachmentId() {
    return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function revokeAttachmentPreviews(items) {
    (items || []).forEach((a) => {
        if (a?.previewUrl?.startsWith("blob:")) {
            try {
                URL.revokeObjectURL(a.previewUrl);
            } catch {
                /* ignore */
            }
        }
    });
}

export function previewKindFromFile(file) {
    const t = (file?.type || "").toLowerCase();
    const n = (file?.name || "").toLowerCase();
    if (t.startsWith("image/")) return "image";
    if (t.startsWith("video/")) return "video";
    if (t === "application/pdf" || n.endsWith(".pdf")) return "pdf";
    if (/\.(jpe?g|png|gif|webp|bmp|svg)$/i.test(n)) return "image";
    if (/\.(mp4|webm|ogg)$/i.test(n)) return "video";
    return "other";
}

export function previewKindFromPath(path) {
    const n = (path || "").toLowerCase();
    if (/\.(jpe?g|png|gif|webp|bmp|svg)$/i.test(n)) return "image";
    if (/\.(mp4|webm|ogg)$/i.test(n)) return "video";
    if (n.endsWith(".pdf")) return "pdf";
    return "other";
}

export function fileNameFromPath(path) {
    if (!path || typeof path !== "string") return path;
    const i = path.lastIndexOf("/");
    return i >= 0 ? path.slice(i + 1) : path;
}
