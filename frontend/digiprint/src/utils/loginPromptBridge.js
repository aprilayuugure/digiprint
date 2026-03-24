/** Đăng ký từ LoginPromptProvider; axios / code khác gọi mà không cần React hook. */
let openLoginPromptImpl = () => {};

export function registerLoginPromptOpener(fn) {
    openLoginPromptImpl = typeof fn === "function" ? fn : () => {};
}

export function openLoginPromptFromBridge() {
    openLoginPromptImpl();
}
