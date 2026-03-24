import api from "../api/axiosInstance";

const UserService = {
    searchCreators: (query) => {
        return api.get("/users/search", { params: { q: query || "" } });
    },
};

export default UserService;
