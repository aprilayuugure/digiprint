import { useCallback, useEffect, useState } from "react";
import LikeService from "../services/LikeService";
import FavoriteService from "../services/FavoriteService";

/**
 * Trạng thái like / favourite trên WorkDetail + toggle (cần openLoginPrompt khi guest).
 */
export function useWorkLikeFavorite(work, { isAuthenticated, userId, openLoginPrompt }) {
    const workId = work?.workId;

    const [liked, setLiked] = useState(false);
    const [favorited, setFavorited] = useState(false);
    const [likeCount, setLikeCount] = useState(work?.likeCount ?? 0);
    const [busyLike, setBusyLike] = useState(false);
    const [busyFavorite, setBusyFavorite] = useState(false);

    useEffect(() => {
        setLikeCount(work?.likeCount ?? 0);
    }, [work?.workId, work?.likeCount]);

    useEffect(() => {
        if (!workId) return;
        if (!isAuthenticated) {
            setLiked(false);
            setFavorited(false);
            return;
        }

        let cancelled = false;
        Promise.all([
            LikeService.isLikedByMe(workId),
            FavoriteService.isFavoritedByMe(workId),
        ])
            .then(([likeRes, favRes]) => {
                if (cancelled) return;
                setLiked(!!likeRes.data);
                setFavorited(!!favRes.data);
            })
            .catch(() => {
                if (cancelled) return;
                setLiked(false);
                setFavorited(false);
            });

        return () => {
            cancelled = true;
        };
    }, [workId, isAuthenticated, userId]);

    const toggleLike = useCallback(async () => {
        if (!workId) return;
        if (!isAuthenticated) {
            openLoginPrompt();
            return;
        }
        if (busyLike) return;

        setBusyLike(true);
        try {
            if (liked) {
                await LikeService.unlike(workId);
                setLiked(false);
                setLikeCount((c) => Math.max(0, (c ?? 0) - 1));
            } else {
                await LikeService.like(workId);
                setLiked(true);
                setLikeCount((c) => (c ?? 0) + 1);
            }
        } finally {
            setBusyLike(false);
        }
    }, [workId, isAuthenticated, liked, busyLike, openLoginPrompt]);

    const toggleFavorite = useCallback(async () => {
        if (!workId) return;
        if (!isAuthenticated) {
            openLoginPrompt();
            return;
        }
        if (busyFavorite) return;

        setBusyFavorite(true);
        try {
            if (favorited) {
                await FavoriteService.removeFavorite(workId);
                setFavorited(false);
            } else {
                await FavoriteService.addFavorite(workId);
                setFavorited(true);
            }
        } finally {
            setBusyFavorite(false);
        }
    }, [workId, isAuthenticated, favorited, busyFavorite, openLoginPrompt]);

    return {
        liked,
        favorited,
        likeCount,
        busyLike,
        busyFavorite,
        toggleLike,
        toggleFavorite,
    };
}
