import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Container, Row, Col, Card, Image, Badge, Modal, Spinner } from "react-bootstrap";
import { useWork } from "../hooks/useWork";
import { useAuthContext } from "../contexts/AuthContext";
import { useLoginPrompt } from "../contexts/LoginPromptContext";
import { useWorkLikeFavorite } from "../hooks/useWorkLikeFavorite";
import { useWorkArtistPreviews } from "../hooks/useWorkArtistPreviews";
import { useWorkLikesModal } from "../hooks/useWorkLikesModal";
import { getServerFileUrl } from "../utils/fileUtils";
import "../css/work-like.css";
import WorkDetailArtistGallery from "../components/WorkDetailArtistGallery";
import WorkDetailComments from "../components/WorkDetailComments";
import { FaHeart, FaRegHeart, FaStar, FaRegStar } from "react-icons/fa";

function WorkDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { openLoginPrompt } = useLoginPrompt();
    const { isAuthenticated, user } = useAuthContext();
    const { state, getWorkById } = useWork();

    const work = state.work;
    const {
        likesModalOpen,
        likesLoading,
        likedUsers,
        openLikesModal,
        closeLikesModal,
    } = useWorkLikesModal(work?.workId);

    const {
        liked,
        favorited,
        likeCount,
        busyLike,
        busyFavorite,
        toggleLike,
        toggleFavorite,
    } = useWorkLikeFavorite(work, {
        isAuthenticated,
        userId: user?.userId,
        openLoginPrompt,
    });

    const artistGenreWorks = useWorkArtistPreviews(work);

    useEffect(() => {
        if (id) {
            getWorkById(id);
        }
    }, [id, getWorkById]);

    if (!work || !work.workId) {
        return (
            <Container className="py-4">
                <p>Loading work...</p>
            </Container>
        );
    }

    const mediaSrc = getServerFileUrl(work.workSource);

    const renderMedia = () => {
        if (!mediaSrc) return null;

        if (work.genre === "ART") {
            return (
                <img
                    src={mediaSrc}
                    alt={work.workTitle}
                    style={{ maxWidth: "100%", maxHeight: "480px", objectFit: "contain" }}
                />
            );
        }

        if (work.genre === "MUSIC") {
            return (
                <video
                    controls
                    src={mediaSrc}
                    style={{ maxWidth: "100%", maxHeight: "480px" }}
                />
            );
        }

        if (work.genre === "LITERATURE") {
            return (
                <iframe
                    src={mediaSrc}
                    title={work.workTitle}
                    style={{ width: "100%", height: "480px", border: "none" }}
                />
            );
        }

        return null;
    };

    const getRatingVariant = () => {
        switch (work.rating) {
            case "SAFE":
                return "success";
            case "SUGGESTIVE":
                return "warning";
            case "NSFW":
                return "danger";
            default:
                return "secondary";
        }
    };

    return (
        <Container className="py-4">
            <Row className="justify-content-center mb-4">
                <Col md={8} className="d-flex justify-content-center">
                    {renderMedia()}
                </Col>
            </Row>

            <Row className="justify-content-center">
                <Col md={8}>
                    <Card className="p-4">
                        <div className="d-flex justify-content-between align-items-start gap-3 mb-2">
                            <h2 className="fw-bold mb-0 flex-grow-1">{work.workTitle}</h2>
                            <div className="work-favorite-control flex-shrink-0">
                                <button
                                    type="button"
                                    className={`work-favorite-button ${favorited ? "favorited" : ""}`}
                                    onClick={toggleFavorite}
                                    disabled={busyFavorite}
                                    title={favorited ? "Remove from favourites" : "Add to favourites"}
                                    aria-label={favorited ? "Remove from favourites" : "Add to favourites"}
                                >
                                    {favorited ? <FaStar /> : <FaRegStar />}
                                </button>
                            </div>
                        </div>

                        {work.workDescription && (
                            <p className="text-muted mb-3">{work.workDescription}</p>
                        )}

                        <div className="mb-3 d-flex align-items-center justify-content-between gap-2 flex-wrap">
                            <div className="d-flex align-items-center gap-2">
                                <span>Rating:</span>
                                <Badge bg={getRatingVariant()}>{work.rating}</Badge>
                            </div>

                            <div className="work-like-control">
                                <button
                                    type="button"
                                    className={`work-like-button ${liked ? "liked" : ""}`}
                                    onClick={toggleLike}
                                    disabled={busyLike}
                                    title={liked ? "Unlike" : "Like"}
                                    aria-label={liked ? "Unlike" : "Like"}
                                >
                                    {liked ? <FaHeart /> : <FaRegHeart />}
                                </button>
                                <button
                                    type="button"
                                    className="btn btn-link p-0 text-decoration-none work-like-count"
                                    onClick={openLikesModal}
                                    title="View users who liked this work"
                                    aria-label="View likes list"
                                >
                                    {likeCount ?? 0}
                                </button>
                            </div>
                        </div>

                        {Array.isArray(work.workTags) && work.workTags.length > 0 && (
                            <div className="mb-3">
                                <div className="mb-2 fw-semibold">Tags</div>
                                <div className="d-flex flex-wrap gap-2">
                                    {work.workTags.map((tag) => (
                                        <Badge
                                            key={tag.tagName}
                                            bg="light"
                                            text="dark"
                                            className="border"
                                            style={{ cursor: "pointer" }}
                                            onClick={() =>
                                                navigate(`/tags/${encodeURIComponent(tag.tagName)}`)
                                            }
                                        >
                                            {tag.tagName}{" "}
                                            <span className="text-muted">
                                                ({tag.tagWorkCount})
                                            </span>
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="d-flex align-items-center mt-3 flex-wrap gap-2">
                            <div className="d-flex align-items-center">
                                <Image
                                    src={getServerFileUrl(work.avatar, "/images/no_avatar.jpg")}
                                    roundedCircle
                                    width={48}
                                    height={48}
                                    className="me-3"
                                    style={{ cursor: "pointer" }}
                                    onClick={() => navigate(`/artist/${work.creator}`)}
                                />
                                <div>
                                    <div
                                        className="fw-semibold"
                                        style={{ cursor: "pointer" }}
                                        onClick={() => navigate(`/artist/${work.creator}`)}
                                    >
                                        {work.creator}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <WorkDetailComments workId={work.workId} />
                    </Card>

                    <WorkDetailArtistGallery
                        previews={artistGenreWorks}
                        currentWork={{
                            workId: work.workId,
                            thumbnail: work.thumbnail,
                        }}
                        onSelectWork={(workId) => navigate(`/work/${workId}`)}
                    />
                </Col>
            </Row>

            <Modal
                show={likesModalOpen}
                onHide={closeLikesModal}
                centered
                scrollable
            >
                <Modal.Header closeButton>
                    <Modal.Title>Likes</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {likesLoading ? (
                        <div className="d-flex justify-content-center py-4">
                            <Spinner animation="border" size="sm" />
                        </div>
                    ) : likedUsers.length === 0 ? (
                        <div className="text-muted small">No likes yet.</div>
                    ) : (
                        <div className="d-flex flex-column gap-2">
                            {likedUsers.map((u) => (
                                <div
                                    key={u.userId ?? u.username}
                                    className="d-flex align-items-center gap-2 border rounded px-2 py-1"
                                >
                                    <Image
                                        src={getServerFileUrl(
                                            u.avatar ?? u.userAvatar,
                                            "/images/no_avatar.jpg"
                                        )}
                                        roundedCircle
                                        width={36}
                                        height={36}
                                        style={{ cursor: u.username ? "pointer" : "default" }}
                                        onClick={() =>
                                            u.username
                                                ? navigate(`/artist/${encodeURIComponent(u.username)}`)
                                                : undefined
                                        }
                                    />
                                    <span className="fw-medium text-dark">
                                        {u.username ?? "Unknown user"}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </Modal.Body>
            </Modal>
        </Container>
    );
}

export default WorkDetail;
