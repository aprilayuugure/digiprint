import { useEffect, useMemo, useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import { Container, Card, Row, Col, Badge, Spinner, Button, Form } from "react-bootstrap";
import TagService from "../services/TagService";
import Pagination from "../components/Pagination";
import WorkCard from "../components/WorkCard";
import { useAuthContext } from "../contexts/AuthContext";

const PAGE_SIZE = 20;

function TagDetail() {
    const { tagName: tagNameParam } = useParams();
    // React Router already decodes path params.
    const tagName = useMemo(() => tagNameParam ?? "", [tagNameParam]);
    const { canManageWorks } = useAuthContext();

    const [tag, setTag] = useState(null);
    const [works, setWorks] = useState([]);
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [loading, setLoading] = useState(true);
    const [loadingWorks, setLoadingWorks] = useState(false);
    const [error, setError] = useState("");
    const [editingDescription, setEditingDescription] = useState(false);
    const [descriptionDraft, setDescriptionDraft] = useState("");

    const loadTag = useCallback(async () => {
        if (!tagName) return;
        setLoading(true);
        setError("");
        try {
            const res = await TagService.getTagByName(tagName);
            setTag(res.data);
            setDescriptionDraft(res.data?.tagDescription ?? "");
        } catch (e) {
            setError("Tag not found");
            setTag(null);
        } finally {
            setLoading(false);
        }
    }, [tagName]);

    const loadWorks = useCallback(async () => {
        if (!tagName) return;
        setLoadingWorks(true);
        try {
            const res = await TagService.getWorksByTagName(tagName, { page, size: PAGE_SIZE });
            const d = res.data;
            setWorks(d?.content ?? []);
            setTotalPages(d?.totalPages ?? 0);
        } catch (e) {
            setWorks([]);
            setTotalPages(0);
        } finally {
            setLoadingWorks(false);
        }
    }, [tagName, page]);

    useEffect(() => {
        setPage(0);
        setEditingDescription(false);
    }, [tagName]);

    useEffect(() => {
        loadTag();
    }, [loadTag]);

    useEffect(() => {
        loadWorks();
    }, [loadWorks]);

    if (loading) {
        return (
            <Container className="py-5 d-flex justify-content-center align-items-center">
                <Spinner animation="border" role="status" />
            </Container>
        );
    }

    if (!tag) {
        return (
            <Container className="py-5 text-center">
                <h4 className="mb-3">{error || "Tag not found"}</h4>
            </Container>
        );
    }

    return (
        <Container className="py-4">
            <Card className="p-4 mb-4">
                <div className="d-flex flex-wrap align-items-center justify-content-between gap-2">
                    <div>
                        <h2 className="fw-bold mb-1">{tag.tagName}</h2>
                        <div className="text-muted small">
                            <span className="me-2">{tag.tagWorkCount} work(s)</span>
                            <Badge bg="light" text="dark" className="border">
                                {tag.tagGenre}
                            </Badge>
                        </div>
                    </div>
                </div>

                <div className="mt-3">
                    {!editingDescription && (
                        <>
                            <p className="mb-2 text-muted">
                                {tag.tagDescription?.trim() || "This tag currently has no definition."}
                            </p>

                            {canManageWorks && (
                                <div className="d-flex justify-content-end">
                                    <Button
                                        variant="outline-secondary"
                                        size="sm"
                                        onClick={() => setEditingDescription(true)}
                                    >
                                        Edit
                                    </Button>
                                </div>
                            )}
                        </>
                    )}

                    {editingDescription && (
                        <>
                            <Form.Control
                                as="textarea"
                                rows={4}
                                value={descriptionDraft}
                                onChange={(e) => setDescriptionDraft(e.target.value)}
                                placeholder="Enter tag description..."
                            />
                            <div className="d-flex justify-content-end gap-2 mt-2">
                                <Button
                                    variant="outline-secondary"
                                    size="sm"
                                    onClick={() => {
                                        setDescriptionDraft(tag.tagDescription ?? "");
                                        setEditingDescription(false);
                                    }}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    variant="primary"
                                    size="sm"
                                    onClick={async () => {
                                        const res = await TagService.updateTagDescriptionByName(
                                            tag.tagName,
                                            descriptionDraft
                                        );
                                        setTag(res.data);
                                        setDescriptionDraft(res.data?.tagDescription ?? "");
                                        setEditingDescription(false);
                                    }}
                                >
                                    Save
                                </Button>
                            </div>
                        </>
                    )}
                </div>
            </Card>

            <Row xs={2} sm={3} md={4} lg={5}>
                {works.map((w) => (
                    <Col key={w.workId} className="mb-4">
                        <WorkCard work={w} />
                    </Col>
                ))}
            </Row>

            {loadingWorks && (
                <div className="d-flex justify-content-center mt-3">
                    <Spinner animation="border" role="status" />
                </div>
            )}

            {!loadingWorks && works.length === 0 && (
                <div className="text-muted text-center mt-4">No works found for this tag.</div>
            )}

            <Pagination
                page={page}
                totalPages={totalPages}
                onPageChange={(p) => setPage(p)}
            />
        </Container>
    );
}

export default TagDetail;

