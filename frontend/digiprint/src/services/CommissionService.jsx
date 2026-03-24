import api from "../api/axiosInstance";

const CommissionService = {
    getByGenre: (genre) => {
        return api.get("/commissions/genre", { params: { genre } });
    },

    getAllByGenres: async (genres = ["ART", "MUSIC", "LITERATURE"]) => {
        const responses = await Promise.all(
            genres.map((g) => api.get("/commissions/genre", { params: { genre: g }, skipSuccessToast: true }))
        );
        return responses.flatMap((r) => (Array.isArray(r.data) ? r.data : []));
    },

    getByUser: (userId) => {
        return api.get(`/commissions/user/${userId}`);
    },

    getById: (commissionId, config) => {
        return api.get(`/commissions/${commissionId}`, config);
    },

    addCommission: (body, config) => {
        return api.post("/commissions", body, config);
    },

    updateCommission: (commissionId, body, config) => {
        return api.put(`/commissions/${commissionId}`, body, config);
    },

    deleteCommission: (commissionId, config) => {
        return api.delete(`/commissions/${commissionId}`, config);
    },

    /** Commission phải đã tồn tại; file lưu tại /storage/commissions/{commissionId}/... */
    uploadCommissionAttachment: (commissionId, file, genre, config) => {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("genre", genre);
        return api.post(`/commissions/${commissionId}/attachments`, formData, config);
    },
};

export default CommissionService;
