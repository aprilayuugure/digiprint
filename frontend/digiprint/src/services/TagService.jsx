import api from "../api/axiosInstance";

const TagService = {
    getAllTags: () => {
        return api.get("/tags");
    },

    getTagsByGenre: (genre) => {
        return api.get("/tags/genre", {
            params: { genre }
        });
    },

    getTagByName: (tagName) => {
        return api.get(`/tags/by-name/${encodeURIComponent(tagName)}`);
    },

    getWorksByTagName: (tagName, { page = 0, size = 20 } = {}) => {
        return api.get(`/tags/by-name/${encodeURIComponent(tagName)}/works`, {
            params: { page, size }
        });
    },

    addTag: (body) => api.post("/tags", body),

    updateTag: (id, body) => api.put(`/tags/${id}`, body),

    deleteTag: (id) => api.delete(`/tags/${id}`),

    mergeTags: ({ targetTagId, sourceTagId }) =>
        api.post("/tags/merge", null, {
            params: { targetTagId, sourceTagId },
        }),

    updateTagDescriptionByName: (tagName, tagDescription) => {
        return api.put(`/tags/by-name/${encodeURIComponent(tagName)}/description`, {
            tagDescription
        });
    },
}

export default TagService;