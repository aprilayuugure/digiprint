import api from "../api/axiosInstance";

const ProfileService = {
    getMyProfile: () => {
        return api.get("/me");
    },

    updateMyProfile: (data) => {
        return api.put("/me", data);
    },

    updateUsername: (username) => {
        return api.patch("/me/username", { username });
    },

    changePassword: ({ currentPassword, newPassword, confirmNewPassword }) => {
        return api.put(
            "/me/change-password",
            {
                currentPassword,
                newPassword,
                confirmNewPassword,
            },
            { skipSuccessToast: true }
        );
    },

    getProfileByUsername: (username) => {
        return api.get(`/profiles/${encodeURIComponent(username)}`);
    },

    /** ARTIST — thống kê dashboard (followers, artworks, doanh thu, biểu đồ 12 tháng). */
    getArtistDashboard: () => api.get("/me/dashboard", { skipSuccessToast: true }),

    /** ADMIN — tổng quan hệ thống. */
    getAdminDashboard: () => api.get("/me/admin/dashboard", { skipSuccessToast: true }),

    /** ADMIN — list users for Manage users table. */
    getAdminUsers: () => api.get("/me/admin/users", { skipSuccessToast: true }),

    /** USER — đơn xin làm artist gần nhất (204 nếu không có). */
    getMyArtistApplication: () => api.get("/me/artist-application", { skipSuccessToast: true }),

    /** USER — gửi đơn xin làm artist (body: { reason }). */
    applyToArtist: (reason) =>
        api.post("/me/apply-artist", reason != null && reason !== "" ? { reason } : {}, { skipSuccessToast: true }),

    /** ADMIN — danh sách đơn (query status tuỳ chọn: PENDING | APPROVED | REJECTED). */
    getAdminArtistApplications: (status) =>
        api.get("/admin/artist-applications", {
            params: status ? { status } : {},
            skipSuccessToast: true,
        }),

    /** ADMIN — duyệt / từ chối đơn. */
    updateArtistApplicationStatus: (applicationId, status) =>
        api.patch(`/admin/artist-applications/${applicationId}/status`, { status }, { skipSuccessToast: true }),
};

export default ProfileService;