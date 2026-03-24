import { useState, useCallback } from "react";
import LikeService from "../services/LikeService";

export function useWorkLikesModal(workId) {
    const [likesModalOpen, setLikesModalOpen] = useState(false);
    const [likesLoading, setLikesLoading] = useState(false);
    const [likedUsers, setLikedUsers] = useState([]);

    const openLikesModal = useCallback(async () => {
        if (!workId) return;
        setLikesModalOpen(true);
        setLikesLoading(true);
        try {
            const res = await LikeService.getLikesByWork(workId);
            setLikedUsers(Array.isArray(res.data) ? res.data : []);
        } catch {
            setLikedUsers([]);
        } finally {
            setLikesLoading(false);
        }
    }, [workId]);

    const closeLikesModal = useCallback(() => {
        setLikesModalOpen(false);
    }, []);

    return {
        likesModalOpen,
        likesLoading,
        likedUsers,
        openLikesModal,
        closeLikesModal,
    };
}

