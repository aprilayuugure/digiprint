import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useWork } from "./useWork";
import { useAuthContext } from "../contexts/AuthContext";
import WorkService from "../services/WorkService";
import { VALID_GENRES } from "../constants/validGenres";

/**
 * Logic cho trang list works: route pagination, filter draft/apply, fetch, delete.
 * Redirect /works/:genre → /works/:genre/page/1 (giữ query) được xử lý ở đây thay vì component riêng.
 */
export function useWorksListPage({ genre: genreProp, username: usernameProp, adminManageMode = false } = {}) {
    const params = useParams();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    const genre = genreProp ?? params.genre;
    const username = usernameProp ?? params.username;

    const { isAuthenticated, user, canManageWorks } = useAuthContext();
    const [deletingId, setDeletingId] = useState(null);

    const { state, searchWorks, setFilters } = useWork();

    const normalizedGenre = useMemo(() => (genre || "").toUpperCase(), [genre]);
    const forcedArtistName = username ? String(username) : "";
    const hideArtist = !!username;

    const isRoutePaginationEnabled = genreProp == null && usernameProp == null;
    const { pageId } = params;

    const urlPageIndex = useMemo(() => {
        if (!isRoutePaginationEnabled) return 0;
        const n = Number(pageId);
        if (!Number.isFinite(n) || n <= 0) return 0;
        return Math.max(0, n - 1);
    }, [isRoutePaginationEnabled, pageId]);

    const activePageIndex = isRoutePaginationEnabled ? urlPageIndex : state.page;

    /** /works/:genre (không có /page/:pageId) → /works/:genre/page/1, giữ query. */
    useEffect(() => {
        if (!isRoutePaginationEnabled) return;
        if (pageId != null) return;
        if (!normalizedGenre) return;

        const q = searchParams.toString();
        const pathname = `/works/${encodeURIComponent(normalizedGenre)}/page/1`;
        navigate(q ? `${pathname}?${q}` : pathname, { replace: true });
    }, [isRoutePaginationEnabled, pageId, normalizedGenre, searchParams, navigate]);

    const tagParams = searchParams.getAll("tags");
    const activeTags = useMemo(() => tagParams.filter((t) => t && t.trim()), [tagParams]);
    const activeTagsKey = useMemo(() => activeTags.join(","), [activeTags]);

    const isArtistProfileWorksView = Boolean(username);

    const showArtistProfileManageIcons = useMemo(() => {
        if (adminManageMode && user?.role === "ADMIN") return true;
        if (!isArtistProfileWorksView || !canManageWorks || !user) return false;
        if (user.role === "ADMIN") return true;
        const u = user.username?.trim();
        const profile = String(username).trim();
        if (!u || !profile) return false;
        return u.toLowerCase() === profile.toLowerCase();
    }, [adminManageMode, isArtistProfileWorksView, canManageWorks, user, username]);

    const showAddWorkButton = useMemo(() => {
        if (adminManageMode) return false;
        if (!isArtistProfileWorksView) return false;
        if (!isAuthenticated || user?.role !== "ARTIST") return false;
        const u = user.username?.trim();
        const profile = String(username ?? "").trim();
        if (!u || !profile) return false;
        return u.toLowerCase() === profile.toLowerCase();
    }, [adminManageMode, isArtistProfileWorksView, isAuthenticated, user, username]);

    const filtersForUi = useMemo(
        () => ({
            artistName: forcedArtistName || state.filterArtistName,
            artistAvatar: forcedArtistName ? "" : state.filterArtistAvatar,
            startDate: state.filterStartDate,
            endDate: state.filterEndDate,
            rating: state.filterRating,
            sort: state.filterSort,
        }),
        [
            forcedArtistName,
            state.filterArtistAvatar,
            state.filterArtistName,
            state.filterEndDate,
            state.filterRating,
            state.filterSort,
            state.filterStartDate,
        ]
    );

    const [draftFilters, setDraftFilters] = useState(filtersForUi);
    useEffect(() => {
        setDraftFilters(filtersForUi);
    }, [filtersForUi]);

    const effectiveRatings = useMemo(() => {
        if (!isAuthenticated) {
            return filtersForUi.rating === "SAFE" || filtersForUi.rating === "SUGGESTIVE"
                ? [filtersForUi.rating]
                : ["SAFE", "SUGGESTIVE"];
        }
        return filtersForUi.rating === "ALL" ? undefined : [filtersForUi.rating];
    }, [filtersForUi.rating, isAuthenticated]);

    const performSearch = useCallback(
        (page, filtersOverride) => {
            const f = filtersOverride ?? filtersForUi;
            const ratings = !isAuthenticated
                ? f.rating === "SAFE" || f.rating === "SUGGESTIVE"
                    ? [f.rating]
                    : ["SAFE", "SUGGESTIVE"]
                : f.rating === "ALL"
                  ? undefined
                  : [f.rating];

            if (!normalizedGenre || !VALID_GENRES.includes(normalizedGenre)) return;

            searchWorks(
                normalizedGenre,
                {
                    artistName: forcedArtistName || f.artistName?.trim() || undefined,
                    startDate: f.startDate || undefined,
                    endDate: f.endDate || undefined,
                    ratings,
                    sort: f.sort,
                    tags: activeTags,
                },
                page
            );
        },
        [activeTags, forcedArtistName, filtersForUi, normalizedGenre, isAuthenticated, searchWorks]
    );

    const works = useMemo(
        () => state.pages[normalizedGenre]?.[activePageIndex] || [],
        [state.pages, normalizedGenre, activePageIndex]
    );

    const handleDeleteWork = useCallback(
        async (workId) => {
            if (!window.confirm("Delete this work?")) return;
            setDeletingId(workId);
            try {
                await WorkService.deleteWork(workId);
                await performSearch(activePageIndex, filtersForUi);
            } catch (err) {
                console.error(err);
            } finally {
                setDeletingId(null);
            }
        },
        [performSearch, activePageIndex, filtersForUi]
    );

    useEffect(() => {
        if (isRoutePaginationEnabled) return;
        performSearch(0);
    }, [performSearch, activeTagsKey, isRoutePaginationEnabled]);

    const lastFetchKeyRef = useRef("");
    useEffect(() => {
        if (!isRoutePaginationEnabled) return;
        if (!normalizedGenre) return;
        if (pageId == null) return;

        const ratingsKey = Array.isArray(effectiveRatings) ? effectiveRatings.join(",") : "ALL";

        const key = [
            normalizedGenre,
            forcedArtistName || "",
            state.filterArtistName || "",
            String(filtersForUi.startDate || ""),
            String(filtersForUi.endDate || ""),
            ratingsKey,
            String(filtersForUi.sort || ""),
            activeTagsKey,
            String(urlPageIndex ?? 0),
        ].join("|");

        if (lastFetchKeyRef.current === key) return;
        lastFetchKeyRef.current = key;

        performSearch(urlPageIndex);
    }, [
        isRoutePaginationEnabled,
        normalizedGenre,
        forcedArtistName,
        state.filterArtistName,
        filtersForUi.startDate,
        filtersForUi.endDate,
        filtersForUi.sort,
        effectiveRatings,
        activeTagsKey,
        urlPageIndex,
        performSearch,
        pageId,
    ]);

    const handlePageChange = useCallback(
        (p) => {
            if (!isRoutePaginationEnabled) {
                performSearch(p);
                return;
            }
            const q = searchParams.toString();
            const nextPageId = p + 1;
            const rawGenre = params.genre ?? normalizedGenre;
            const pathname = `/works/${encodeURIComponent(String(rawGenre))}/page/${nextPageId}`;
            navigate(q ? `${pathname}?${q}` : pathname);
        },
        [isRoutePaginationEnabled, performSearch, searchParams, params.genre, normalizedGenre, navigate]
    );

    const appliedFiltersPayload = useMemo(
        () => ({
            filterArtistName: forcedArtistName || draftFilters.artistName,
            filterArtistAvatar: forcedArtistName ? "" : draftFilters.artistAvatar,
            filterStartDate: draftFilters.startDate,
            filterEndDate: draftFilters.endDate,
            filterRating: draftFilters.rating,
            filterSort: draftFilters.sort,
        }),
        [draftFilters, forcedArtistName]
    );

    const onFiltersChange = useCallback(
        (partial) => {
            setDraftFilters((prev) => ({
                ...prev,
                artistName: forcedArtistName ? forcedArtistName : (partial.artistName ?? prev.artistName),
                artistAvatar: forcedArtistName ? "" : (partial.artistAvatar ?? prev.artistAvatar),
                startDate: partial.startDate ?? prev.startDate,
                endDate: partial.endDate ?? prev.endDate,
                rating: partial.rating ?? prev.rating,
                sort: partial.sort ?? prev.sort,
            }));
        },
        [forcedArtistName]
    );

    const onApplyFilters = useCallback(() => {
        setFilters(appliedFiltersPayload);
        if (isRoutePaginationEnabled) {
            const q = searchParams.toString();
            const pathname = `/works/${encodeURIComponent(normalizedGenre)}/page/1`;
            navigate(q ? `${pathname}?${q}` : pathname, { replace: true });
        } else {
            performSearch(0, draftFilters);
        }
    }, [setFilters, appliedFiltersPayload, isRoutePaginationEnabled, searchParams, normalizedGenre, navigate, performSearch, draftFilters]);

    return {
        normalizedGenre,
        hideArtist,
        works,
        draftFilters,
        onFiltersChange,
        onApplyFilters,
        handlePageChange,
        activePageIndex,
        totalPages: state.totalPages,
        showAddWorkButton,
        showArtistProfileManageIcons,
        adminManageMode,
        deletingId,
        handleDeleteWork,
    };
}
