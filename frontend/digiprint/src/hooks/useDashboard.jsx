import { useState, useEffect, useCallback } from "react";
import ProfileService from "../services/ProfileService";

/**
 * Tải dữ liệu dashboard nghệ sĩ (GET /me/dashboard).
 * Chỉ gọi khi đã đăng nhập với role ARTIST — component bọc ngoài nên kiểm tra.
 */
export function useDashboard() {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState(null);
    const [error, setError] = useState(null);

    const refetch = useCallback(() => {
        setLoading(true);
        setError(null);
        return ProfileService.getArtistDashboard()
            .then((res) => {
                setData(res.data);
                return res.data;
            })
            .catch((err) => {
                const msg =
                    err.response?.data?.message ||
                    err.response?.data?.general ||
                    "Could not load dashboard.";
                setError(msg);
                setData(null);
                throw err;
            })
            .finally(() => {
                setLoading(false);
            });
    }, []);

    useEffect(() => {
        refetch();
    }, [refetch]);

    return { loading, data, error, refetch };
}
