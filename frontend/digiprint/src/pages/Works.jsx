import { Container, Row, Col } from "react-bootstrap";
import Pagination from "../components/Pagination";
import WorkCard from "../components/WorkCard";
import { Link } from "react-router-dom";
import { FaEdit, FaTrash } from "react-icons/fa";
import WorkFilter from "../components/WorkFilter";
import { useWorksListPage } from "../hooks/useWorksListPage";

function Works(props) {
    const {
        hideArtist,
        works,
        draftFilters,
        onFiltersChange,
        onApplyFilters,
        handlePageChange,
        activePageIndex,
        totalPages,
        showAddWorkButton,
        showArtistProfileManageIcons,
        adminManageMode,
        deletingId,
        handleDeleteWork,
    } = useWorksListPage(props);

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
                onFiltersChange={onFiltersChange}
                onApply={onApplyFilters}
            />

            <Row xs={2} sm={3} md={4} lg={5}>
                {works.map((work) => (
                    <Col key={work.workId} className="mb-4">
                        <WorkCard work={work} />
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

            <Pagination page={activePageIndex} totalPages={totalPages} onPageChange={handlePageChange} />
        </Container>
    );
}

export default Works;
