import api from "../api/axiosInstance";

const WorkService = {
    getWorkById: (id) => {
        return api.get(`/works/${id}`);
    },

    getWorksPageByGenre: (genre, page = 0, size = 20) => {
        const url = `/works/search?genre=${encodeURIComponent(genre)}&page=${encodeURIComponent(page)}&size=${encodeURIComponent(size)}&sort=recent`;
        return api.get("/works/search", {
            params: { genre, page, size, sort: "recent" }
        });
    },

    /** Dùng URLSearchParams để ratings/tags lặp đúng kiểu Spring: ratings=SAFE&ratings=SUGGESTIVE */
    searchWorks: (genre, { artistName, startDate, endDate, tags, ratings, sort = "recent", page = 0, size = 20 }) => {
        const params = new URLSearchParams();
        params.set("genre", genre);
        params.set("page", String(page));
        params.set("size", String(size));
        params.set("sort", sort);
        if (artistName != null && artistName !== "") {
            params.set("artistName", artistName);
        }
        if (startDate) {
            params.set("startDate", startDate);
        }
        if (endDate) {
            params.set("endDate", endDate);
        }
        (tags || []).forEach((t) => {
            if (t != null && t !== "") {
                params.append("tags", t);
            }
        });
        (ratings || []).forEach((r) => {
            if (r != null && r !== "") {
                params.append("ratings", r);
            }
        });
        const url = `/works/search?${params.toString()}`;
        return api.get(url);
    },

    addWork: (data) => {
        return api.post("/works", data);
    },

    updateWork: (id, data) => {
        return api.put(`/works/${id}`, data);
    },

    deleteWork: (id) => {
        return api.delete(`/works/${id}`);
    },
}

export default WorkService;