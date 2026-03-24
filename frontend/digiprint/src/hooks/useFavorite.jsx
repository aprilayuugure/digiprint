import { useCallback, useEffect, useState } from "react";
import FavoriteService from "../services/FavoriteService";
import WorkService from "../services/WorkService";

const DEFAULT_PAGE_SIZE = 20;

/**
 * Danh sách favourite (phân trang) + xóa work và làm mới list.
 */
export function useMyFavourites(pageSize = DEFAULT_PAGE_SIZE) {
    const [worksPage, setWorksPage] = useState({
        content: [],
        page: 0,
        totalPages: 0,
        totalElements: 0,
    });
    const [deletingId, setDeletingId] = useState(null);

    const fetchFavourites = useCallback(
        (page = 0) => {
            FavoriteService.getMyFavourites(page, pageSize)
                .then((res) => setWorksPage(res.data))
                .catch(() => setWorksPage((prev) => ({ ...prev, content: [] })));
        },
        [pageSize]
    );

    useEffect(() => {
        fetchFavourites(0);
    }, [fetchFavourites]);

    const deleteWork = useCallback(
        async (workId) => {
            if (!window.confirm("Delete this work?")) return;
            setDeletingId(workId);
            try {
                await WorkService.deleteWork(workId);
                await fetchFavourites(worksPage.page);
            } catch (err) {
                console.error(err);
            } finally {
                setDeletingId(null);
            }
        },
        [fetchFavourites, worksPage.page]
    );

    const works = worksPage.content || [];

    return {
        worksPage,
        works,
        fetchFavourites,
        deletingId,
        deleteWork,
    };
}
