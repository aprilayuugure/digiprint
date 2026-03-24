import api from "../api/axiosInstance";

const FollowService = {
    follow: (artistId) => api.post(`/follows/${artistId}`, {}, { skipSuccessToast: true }),
    unfollow: (artistId) => api.delete(`/follows/${artistId}`, { skipSuccessToast: true }),
    getMyFollowing: () => api.get("/follows/me/following", { skipSuccessToast: true }),
    getFollowers: (artistId) =>
        api.get(`/follows/artist/${artistId}/followers`, { skipSuccessToast: true }),
};

export default FollowService;

