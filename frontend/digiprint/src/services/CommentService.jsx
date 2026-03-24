import api from "../api/axiosInstance";

const CommentService = {
    getByWork: (workId) => {
        return api.get(`/comments/work/${workId}`);
    },

    add: (payload) => {
        return api.post("/comments", payload);
    },

    update: (commentId, payload) => {
        return api.put(`/comments/${commentId}`, payload);
    },

    delete: (commentId) => {
        return api.delete(`/comments/${commentId}`);
    },
};

export default CommentService;
