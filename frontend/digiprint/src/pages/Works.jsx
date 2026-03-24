import { useCallback, useEffect, useMemo, useState } from "react";
import { Container, Row, Col } from "react-bootstrap";
import { useWork } from "../hooks/useWork";
import { useAuthContext } from "../contexts/AuthContext";
import Pagination from "../components/Pagination";
import WorkCard from "../components/WorkCard";
import { Link, useParams, useSearchParams } from "react-router-dom";
import WorkService from "../services/WorkService";
import { FaEdit, FaTrash } from "react-icons/fa";
import { VALID_GENRES } from "../constants/validGenres";
import WorkFilter from "../components/WorkFilter";

function Work({ genre: genreProp, username: usernameProp, adminManageMode = false } = {}) {
    const params = useParams();
    const genre = genreProp ?? params.genre;
    const username = usernameProp ?? params.username;
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

    const works = useMemo(
        () => state.pages[normalizedGenre]?.[state.page] || [],
        [state.pages, normalizedGenre, state.page]
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

    const effectiveRatings = useMemo(() => {
        if (!isAuthenticated) {
            return filtersForUi.rating === "SAFE" || filtersForUi.rating === "SUGGESTIVE"
                ? [filtersForUi.rating]
                : ["SAFE", "SUGGESTIVE"];
        }
        return filtersForUi.rating === "ALL" ? undefined : [filtersForUi.rating];
    }, [filtersForUi.rating, isAuthenticated]);

    const performSearch = useCallback(
        (page) => {
            if (!normalizedGenre || !VALID_GENRES.includes(normalizedGenre)) return;

            searchWorks(
                normalizedGenre,
                {
                    artistName: forcedArtistName || filtersForUi.artistName?.trim() || undefined,
                    startDate: filtersForUi.startDate || undefined,
                    endDate: filtersForUi.endDate || undefined,
                    ratings: effectiveRatings,
                    sort: filtersForUi.sort,
                    tags: activeTags,
                },
                page
            );
        },
        [
            activeTags,
            effectiveRatings,
            forcedArtistName,
            filtersForUi.artistName,
            filtersForUi.endDate,
            filtersForUi.sort,
            filtersForUi.startDate,
            normalizedGenre,
            searchWorks,
        ]
    );

    const handleDeleteWork = useCallback(
        async (workId) => {
            if (!window.confirm("Delete this work?")) return;
            setDeletingId(workId);
            try {
                await WorkService.deleteWork(workId);
                await performSearch(state.page);
            } catch (err) {
                console.error(err);
            } finally {
                setDeletingId(null);
            }
        },
        [performSearch, state.page]
    );

    useEffect(() => {
        performSearch(0);
    }, [performSearch, activeTagsKey]);

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
                filters={filtersForUi}
                hideArtist={hideArtist}
                onFiltersChange={(partial) =>
                    setFilters({
                        filterArtistName: forcedArtistName || (partial.artistName ?? state.filterArtistName),
                        filterArtistAvatar: forcedArtistName ? "" : (partial.artistAvatar ?? state.filterArtistAvatar),
                        filterStartDate: partial.startDate ?? state.filterStartDate,
                        filterEndDate: partial.endDate ?? state.filterEndDate,
                        filterRating: partial.rating ?? state.filterRating,
                        filterSort: partial.sort ?? state.filterSort,
                    })
                }
                onApply={() =>
                    performSearch(0)
                }
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
                                        title="Edit tags"
                                        aria-label="Edit work tags"
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
                page = {state.page}
                totalPages = {state.totalPages}
                onPageChange={(p) =>
                    performSearch(p)
                } />
        </Container>
    )
}

export default Work;