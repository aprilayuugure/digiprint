import api from "../api/axiosInstance";

const OrderService = {
    // Keep the same calling style as WorkService.searchWorks:
    // send an object with optional fields; use `undefined` to omit query params.
    searchOrders: (
        {
            status,
            customer,
            artist,
            priceMin,
            priceMax,
            createdAtFrom,
            createdAtTo,
            completedAtFrom,
            completedAtTo,
            /** ARTIST: 'incoming' = đơn khách đặt qua commission của mình; không gửi = đơn chính mình đặt */
            artistOrderMode,
            page = 0,
            size = 10,
        } = {}
    ) =>
        api.get("/orders/search", {
            params: {
                status,
                customer,
                artist,
                priceMin,
                priceMax,
                createdAtFrom,
                createdAtTo,
                completedAtFrom,
                completedAtTo,
                artistOrderMode: artistOrderMode === "incoming" ? "incoming" : undefined,
                page,
                size,
            },
        }),

    getOrderById: (id) => api.get(`/orders/${id}`),

    addOrder: (body) => api.post("/orders", body),

    /** Chủ đơn — cập nhật đơn DRAFT, sau đó server chuyển về PENDING. */
    updateDraftOrder: (id, body) =>
        api.put(`/orders/draft/${id}`, body, { skipSuccessToast: true }),

    /** Upload one file; returns `{ path }` for OrderItem.attachedImages */
    uploadOrderAttachment: (file) => {
        const formData = new FormData();
        formData.append("file", file);
        return api.post("/orders/attachments", formData);
    },

    updateOrderStatus: (id, status, config = {}) =>
        api.patch(`/orders/${id}/status`, null, {
            params: { status },
            ...config,
        }),

    /** ARTIST/ADMIN — upload file sản phẩm hoàn thành cho một dòng đơn. */
    uploadOrderCompletedDeliverable: (orderItemId, file) => {
        const formData = new FormData();
        formData.append("file", file);
        return api.post(
            `/orders/items/${orderItemId}/completed-deliverables/upload`,
            formData,
            { headers: { "Content-Type": "multipart/form-data" }, skipSuccessToast: true }
        );
    },

    /** ARTIST/ADMIN — ghi đè danh sách path deliverables. */
    patchOrderItemCompletedDeliverables: (orderItemId, paths) =>
        api.patch(
            `/orders/items/${orderItemId}/completed-deliverables`,
            { paths },
            { skipSuccessToast: true }
        ),
};

export default OrderService;
