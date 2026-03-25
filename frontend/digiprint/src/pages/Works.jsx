import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Container, Row, Col } from "react-bootstrap";
import { useWork } from "../hooks/useWork";
import { useAuthContext } from "../contexts/AuthContext";
import Pagination from "../components/Pagination";
import WorkCard from "../components/WorkCard";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import WorkService from "../services/WorkService";
import { FaEdit, FaTrash } from "react-icons/fa";
import { VALID_GENRES } from "../constants/validGenres";
import WorkFilter from "../components/WorkFilter";

function Work({ genre: genreProp, username: usernameProp, adminManageMode = false } = {}) {
    const params = useParams();
    const genre = genreProp ?? params.genre;
    const username = usernameProp ?? params.username;
    const navigate = useNavigate();
    const { isAuthenticated, user, canManageWorks } = useAuthContext();
    const [deletingId, setDeletingId] = useState(null);

    const workHook = useWork();
    const { state, searchWorks, setFilters } = workHook;

    const [searchParams] = useSearchParams();

    const normalizedGenre = (genre || "").toUpperCase();
    const forcedArtistName = username ? String(username) : "";
    const hideArtist = !!username;
    /** Tab Works trong trang Artist (`/artist/:username`, embed) — chỉ list work của artist đó. URL `/artist/:u/works/:g` redirect về `/artist/:u` + state. */
    const isArtistProfileWorksView = Boolean(username);

    /** Icon edit/delete trên tab Works của trang profile artist: user đăng nhập trùng artist trên URL (hoặc ADMIN). */
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

    const tagParams = searchParams.getAll("tags");
    const activeTags = useMemo(() => tagParams.filter((t) => t && t.trim()), [tagParams]);
    const activeTagsKey = useMemo(() => activeTags.join(","), [activeTags]);

    // URL-driven pagination only for the route-based list page (`/works/:genre`).
    // Embedded views in `/artist/:username` pass `genre`/`username` as props, so we keep in-memory pagination there.
    const isRoutePaginationEnabled = genreProp == null && usernameProp == null;
    const { pageId } = params;
    const urlPageIndex = useMemo(() => {
        if (!isRoutePaginationEnabled) return 0;
        const n = Number(pageId);
        if (!Number.isFinite(n) || n <= 0) return 0; // treat /page=0 or invalid as first page
        return Math.max(0, n - 1); // route is 1-based, API is 0-based
    }, [isRoutePaginationEnabled, pageId]);

    // For route pagination, keep the UI page strictly in sync with URL.
    // This prevents out-of-order responses from an older request from "jumping" the UI back.
    const activePageIndex = isRoutePaginationEnabled ? urlPageIndex : state.page;

    const works = useMemo(
        () => state.pages[normalizedGenre]?.[activePageIndex] || [],
        [state.pages, normalizedGenre, activePageIndex]
    );

    const filtersForUi = useMemo(() => {
        return {
            artistName: forcedArtistName || state.filterArtistName,
            artistAvatar: forcedArtistName ? "" : state.filterArtistAvatar,
            startDate: state.filterStartDate,
            endDate: state.filterEndDate,
            rating: state.filterRating,
            sort: state.filterSort,
        };
    }, [
        forcedArtistName,
        state.filterArtistAvatar,
        state.filterArtistName,
        state.filterEndDate,
        state.filterRating,
        state.filterSort,
        state.filterStartDate,
    ]);

    // Draft filters (user edits in UI). We only commit them to reducer on "Apply filters".
    // This prevents route-pagination fetch from running on every keystroke/change.
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
                ? (f.rating === "SAFE" || f.rating === "SUGGESTIVE"
                    ? [f.rating]
                    : ["SAFE", "SUGGESTIVE"])
                : (f.rating === "ALL" ? undefined : [f.rating]);

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
        [
            activeTags,
            forcedArtistName,
            filtersForUi,
            normalizedGenre,
            isAuthenticated,
            searchWorks,
        ]
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
        [performSearch, activePageIndex]
    );

    useEffect(() => {
        // When we paginate via route params (/works/:genre/page/:pageId),
        // let the urlPageIndex effect be the single source of truth.
        // Otherwise, performSearch(0) may override the page the user clicked.
        if (isRoutePaginationEnabled) return;
        performSearch(0);
    }, [performSearch, activeTagsKey, isRoutePaginationEnabled]);

    // Route pagination effect with anti-loop guard:
    // Only fetch when (page index + filter snapshot) actually changes.
    const lastFetchKeyRef = useRef("");
    useEffect(() => {
        if (!isRoutePaginationEnabled) return;
        if (!normalizedGenre) return;

        const ratingsKey = Array.isArray(effectiveRatings)
            ? effectiveRatings.join(",")
            : "ALL";

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
    ]);

    const handlePageChange = (p) => {
        if (!isRoutePaginationEnabled) {
            performSearch(p);
            return;
        }

        // Keep existing query params (e.g., `tags=`) while moving pagination into the pathname.
        const q = searchParams.toString();
        const nextPageId = p + 1; // 1-based in URL
        const rawGenre = params.genre ?? normalizedGenre;
        const genreForUrl = String(rawGenre);
        const pathname = `/works/${encodeURIComponent(genreForUrl)}/page/${nextPageId}`;
        navigate(q ? `${pathname}?${q}` : pathname);
    };

    const appliedFiltersPayload = useMemo(() => {
        return {
            filterArtistName: forcedArtistName || draftFilters.artistName,
            filterArtistAvatar: forcedArtistName ? "" : draftFilters.artistAvatar,
            filterStartDate: draftFilters.startDate,
            filterEndDate: draftFilters.endDate,
            filterRating: draftFilters.rating,
            filterSort: draftFilters.sort,
        };
    }, [draftFilters, forcedArtistName]);

    return (
        <Container>
            {showAddWorkButton && (
                <div className="d-flex justify-content-end mb-3">
                    <Link to="/works/add" className="btn btn-outline-primary btn-sm">
                        Add work
                    </Link>
                </div>
            )}
            <WorkFilter
                filters={draftFilters}
                hideArtist={hideArtist}
                onFiltersChange={(partial) =>
                    setDraftFilters((prev) => ({
                        ...prev,
                        artistName: forcedArtistName ? forcedArtistName : (partial.artistName ?? prev.artistName),
                        artistAvatar: forcedArtistName ? "" : (partial.artistAvatar ?? prev.artistAvatar),
                        startDate: partial.startDate ?? prev.startDate,
                        endDate: partial.endDate ?? prev.endDate,
                        rating: partial.rating ?? prev.rating,
                        sort: partial.sort ?? prev.sort,
                    }))
                }
                onApply={() => {
                    // Commit draft filters into applied state
                    setFilters(appliedFiltersPayload);

                    if (isRoutePaginationEnabled) {
                        // Reset pagination to page 1 by URL (1-based).
                        const q = searchParams.toString();
                        const pathname = `/works/${encodeURIComponent(normalizedGenre)}/page/1`;
                        navigate(q ? `${pathname}?${q}` : pathname, { replace: true });
                    } else {
                        // Embedded view: keep in-memory pagination.
                        performSearch(0, draftFilters);
                    }
                }}
            />

            <Row xs = {2} sm = {3} md = {4} lg = {5}>
                {works.map((work) => (
                    <Col key = {work.workId} className = "mb-4">
                        <WorkCard work = {work} />
                        {showArtistProfileManageIcons && (
                            <div className="d-flex justify-content-center align-items-center gap-3 mt-2 pt-1 work-card-manage-row">
                                {adminManageMode ? (
                                    <Link
                                        to={`/works/update/${work.workId}?adminEditTags=1`}
                                        className="text-decoration-none"
                                        style={{ color: "#0d6efd" }}
                                        title="Edit tags & rating"
                                        aria-label="Edit work tags and rating"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <FaEdit size={20} />
                                    </Link>
                                ) : (
                                    <Link
                                        to={`/works/update/${work.workId}`}
                                        className="text-decoration-none"
                                        style={{ color: "#0d6efd" }}
                                        title="Edit"
                                        aria-label="Edit work"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <FaEdit size={20} />
                                    </Link>
                                )}
                                <button
                                    type="button"
                                    className="btn btn-link p-0 border-0"
                                    style={{ color: "#dc3545" }}
                                    title="Delete"
                                    aria-label="Delete work"
                                    disabled={deletingId === work.workId}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeleteWork(work.workId);
                                    }}
                                >
                                    <FaTrash size={20} />
                                </button>
                            </div>
                        )}
                    </Col>
                ))}
            </Row>

            <Pagination
                page = {activePageIndex}
                totalPages = {state.totalPages}
                onPageChange={handlePageChange}
            />
        </Container>
    )
}

export default Work;