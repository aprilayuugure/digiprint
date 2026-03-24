import { Link } from "react-router-dom";
import { Row, Col } from "react-bootstrap";
import { FaEdit, FaTrash } from "react-icons/fa";
import WorkCard from "./WorkCard";
import Pagination from "./Pagination";
import { useMyFavourites } from "../hooks/useFavorite";
import { useWorkOwnership } from "../hooks/useWorkOwnership";
import "../css/artist-favourites-tab.css";

function ArtistFavouritesTab() {
    const { works, worksPage, fetchFavourites, deletingId, deleteWork } = useMyFavourites();
    const { canManageWork } = useWorkOwnership();

    if (works.length === 0) {
        return (
            <div className="artist-favourites-empty text-muted">No favourite works yet</div>
        );
    }

    return (
        <>
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
                                        deleteWork(w.workId);
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
                page={worksPage.page}
                totalPages={worksPage.totalPages}
                onPageChange={(p) => fetchFavourites(p)}
            />
        </>
    );
}

export default ArtistFavouritesTab;
