import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Nav, Row, Col } from "react-bootstrap";
import { FaEdit, FaTrash } from "react-icons/fa";
import WorkFilter from "./WorkFilter";
import WorkCard from "./WorkCard";
import Pagination from "./Pagination";
import WorkService from "../services/WorkService";
import { useWorkOwnership } from "../hooks/useWorkOwnership";

function ArtistWorksTab({
    GENRES,
    activeGenre,
    setActiveGenre,
    worksPage,
    filters,
    setFilters,
    fetchWorks,
}) {
    const works = worksPage.content || [];
    const { canManageWork } = useWorkOwnership();
    const [deletingId, setDeletingId] = useState(null);

    useEffect(() => {
        fetchWorks(0);
    }, [activeGenre, filters.startDate, filters.endDate, filters.rating, filters.sort, fetchWorks]);

    const handleDeleteWork = async (workId) => {
        if (!window.confirm("Delete this work?")) return;
        setDeletingId(workId);
        try {
            await WorkService.deleteWork(workId);
            await fetchWorks(worksPage.page);
        } catch (err) {
            console.error(err);
        } finally {
            setDeletingId(null);
        }
    };

    return (
        <>
            <div className="border-bottom bg-white py-2 shadow-sm mb-3">
                <Nav variant="tabs" className="gap-1" as="nav">
                    {GENRES.map((g) => (
                        <Nav.Item key={g}>
                            <Nav.Link
                                active={activeGenre === g}
                                onClick={() => setActiveGenre(g)}
                                className="text-dark fw-medium"
                            >
                                {g.charAt(0) + g.slice(1).toLowerCase()}
                            </Nav.Link>
                        </Nav.Item>
                    ))}
                </Nav>
            </div>

            <WorkFilter
                filters={{
                    artistName: "",
                    artistAvatar: "",
                    startDate: filters.startDate,
                    endDate: filters.endDate,
                    rating: filters.rating,
                    sort: filters.sort,
                }}
                hideArtist={true}
                onFiltersChange={(partial) =>
                    setFilters((prev) => ({
                        ...prev,
                        startDate: partial.startDate ?? prev.startDate,
                        endDate: partial.endDate ?? prev.endDate,
                        rating: partial.rating ?? prev.rating,
                        sort: partial.sort ?? prev.sort,
                    }))
                }
                onApply={() => fetchWorks(0)}
            />

            <Row xs={2} sm={3} md={4} lg={4}>
                {works.map((w) => (
                    <Col key={w.workId} className="mb-4">
                        <WorkCard work={w} />
                        {canManageWork(w) && (
                            <div className="d-flex justify-content-center align-items-center gap-3 mt-2 pt-1 work-card-manage-row">
                                <Link
                                    to={`/works/update/${w.workId}`}
                                    className="text-decoration-none"
                                    style={{ color: "#0d6efd" }}
                                    title="Edit"
                                    aria-label="Edit work"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <FaEdit size={20} />
                                </Link>
                                <button
                                    type="button"
                                    className="btn btn-link p-0 border-0"
                                    style={{ color: "#dc3545" }}
                                    title="Delete"
                                    aria-label="Delete work"
                                    disabled={deletingId === w.workId}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeleteWork(w.workId);
                                    }}
                                >
                                    <FaTrash size={20} />
                                </button>
                            </div>
                        )}
                    </Col>
                ))}
                {works.length === 0 && (
                    <Col>
                        <div className="text-muted">No works found.</div>
                    </Col>
                )}
            </Row>

            <Pagination
                page={worksPage.page}
                totalPages={worksPage.totalPages}
                onPageChange={(p) => fetchWorks(p)}
            />
        </>
    );
}

export default ArtistWorksTab;
