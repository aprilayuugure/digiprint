import api from "../api/axiosInstance";

const LikeService = {
    like: (workId) => {
        return api.post(`/likes/${workId}`);
    },

    unlike: (workId) => {
        return api.delete(`/likes/${workId}`);
    },

    isLikedByMe: (workId) => {
        return api.get(`/likes/me/${workId}`);
    },

    getLikesByWork: (workId) => {
        return api.get(`/likes/work/${workId}`, { skipSuccessToast: true });
    },
};

export default LikeService;

