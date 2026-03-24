import api from "../api/axiosInstance";

const FavoriteService = {
    addFavorite: (workId) => {
        return api.post(`/favorites/${workId}`);
    },

    removeFavorite: (workId) => {
        return api.delete(`/favorites/${workId}`);
    },

    isFavoritedByMe: (workId) => {
        return api.get("/favorites/status", { params: { workId } });
    },

    getMyFavourites: (page = 0, size = 20) => {
        return api.get("/favorites/list", { params: { page, size } });
    },
};

export default FavoriteService;
