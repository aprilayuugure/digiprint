import { useEffect, useMemo, useState } from "react";
import { Badge, Button, Card, Form, Modal, Table } from "react-bootstrap";
import { FaEdit, FaTrash } from "react-icons/fa";
import TagService from "../services/TagService";

const GENRES = ["ART", "MUSIC", "LITERATURE"];

const emptyDraft = { tagName: "", tagDescription: "", tagGenre: "ART" };

export default function AdminManageTags() {
    const [tags, setTags] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showAdd, setShowAdd] = useState(false);
    const [showEdit, setShowEdit] = useState(false);
    const [showMerge, setShowMerge] = useState(false);
    const [draft, setDraft] = useState(emptyDraft);
    const [editing, setEditing] = useState(null);
    const [mergeTargetId, setMergeTargetId] = useState("");
    const [mergeSourceId, setMergeSourceId] = useState("");

    const loadTags = async () => {
        setLoading(true);
        try {
            const res = await TagService.getAllTags();
            setTags(Array.isArray(res.data) ? res.data : []);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadTags();
    }, []);

    const sortedTags = useMemo(
        () => [...tags].sort((a, b) => String(a.tagName || "").localeCompare(String(b.tagName || ""))),
        [tags]
    );

    const onAdd = async (e) => {
        e.preventDefault();
        await TagService.addTag(draft);
        setShowAdd(false);
        setDraft(emptyDraft);
        await loadTags();
    };

    const onEdit = async (e) => {
        e.preventDefault();
        if (!editing?.tagId) return;
        await TagService.updateTag(editing.tagId, draft);
        setShowEdit(false);
        setEditing(null);
        setDraft(emptyDraft);
        await loadTags();
    };

    const onDelete = async (id) => {
        if (!window.confirm("Delete this tag?")) return;
        await TagService.deleteTag(id);
        await loadTags();
    };

    const onMerge = async (e) => {
        e.preventDefault();
        if (!mergeTargetId || !mergeSourceId) return;
        await TagService.mergeTags({
            targetTagId: Number(mergeTargetId),
            sourceTagId: Number(mergeSourceId),
        });
        setShowMerge(false);
        setMergeTargetId("");
        setMergeSourceId("");
        await loadTags();
    };

    return (
        <Card className="border-0 shadow-sm">
            <Card.Body>
                <div className="d-flex justify-content-between align-items-center mb-3">
                    <h5 className="mb-0">Manage tags</h5>
                    <div className="d-flex gap-2">
                        <Button size="sm" onClick={() => setShowAdd(true)}>Add tag</Button>
                        <Button size="sm" variant="outline-secondary" onClick={() => setShowMerge(true)}>
                            Merge tags
                        </Button>
                    </div>
                </div>

                <div className="table-responsive">
                    <Table bordered hover size="sm" className="align-middle">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Genre</th>
                                <th>Description</th>
                                <th className="text-end">Work count</th>
                                <th className="text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={5} className="text-center text-muted py-3">Loading...</td></tr>
                            ) : sortedTags.length === 0 ? (
                                <tr><td colSpan={5} className="text-center text-muted py-3">No tags.</td></tr>
                            ) : (
                                sortedTags.map((t) => (
                                    <tr key={t.tagId}>
                                        <td>{t.tagName}</td>
                                        <td><Badge bg="light" text="dark" className="border">{t.tagGenre}</Badge></td>
                                        <td className="small">{t.tagDescription || "—"}</td>
                                        <td className="text-end">{t.tagWorkCount ?? 0}</td>
                                        <td className="text-center">
                                            <Button
                                                variant="link"
                                                size="sm"
                                                className="p-0 me-3"
                                                onClick={() => {
                                                    setEditing(t);
                                                    setDraft({
                                                        tagName: t.tagName || "",
                                                        tagDescription: t.tagDescription || "",
                                                        tagGenre: t.tagGenre || "ART",
                                                    });
                                                    setShowEdit(true);
                                                }}
                                            >
                                                <FaEdit />
                                            </Button>
                                            <Button variant="link" size="sm" className="p-0 text-danger" onClick={() => onDelete(t.tagId)}>
                                                <FaTrash />
                                            </Button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </Table>
                </div>

                <Modal show={showAdd} onHide={() => setShowAdd(false)} centered>
                    <Modal.Header closeButton><Modal.Title>Add tag</Modal.Title></Modal.Header>
                    <Form onSubmit={onAdd}>
                        <Modal.Body>{renderTagFields(draft, setDraft)}</Modal.Body>
                        <Modal.Footer><Button type="submit">Save</Button></Modal.Footer>
                    </Form>
                </Modal>

                <Modal show={showEdit} onHide={() => setShowEdit(false)} centered>
                    <Modal.Header closeButton><Modal.Title>Edit tag</Modal.Title></Modal.Header>
                    <Form onSubmit={onEdit}>
                        <Modal.Body>{renderTagFields(draft, setDraft)}</Modal.Body>
                        <Modal.Footer><Button type="submit">Save</Button></Modal.Footer>
                    </Form>
                </Modal>

                <Modal show={showMerge} onHide={() => setShowMerge(false)} centered>
                    <Modal.Header closeButton><Modal.Title>Merge tags</Modal.Title></Modal.Header>
                    <Form onSubmit={onMerge}>
                        <Modal.Body>
                            <Form.Group className="mb-3">
                                <Form.Label>Target tag (keep)</Form.Label>
                                <Form.Select value={mergeTargetId} onChange={(e) => setMergeTargetId(e.target.value)} required>
                                    <option value="">Select target</option>
                                    {sortedTags.map((t) => <option key={t.tagId} value={t.tagId}>{t.tagName}</option>)}
                                </Form.Select>
                            </Form.Group>
                            <Form.Group>
                                <Form.Label>Source tag (remove)</Form.Label>
                                <Form.Select value={mergeSourceId} onChange={(e) => setMergeSourceId(e.target.value)} required>
                                    <option value="">Select source</option>
                                    {sortedTags.map((t) => <option key={t.tagId} value={t.tagId}>{t.tagName}</option>)}
                                </Form.Select>
                            </Form.Group>
                        </Modal.Body>
                        <Modal.Footer><Button type="submit">Merge</Button></Modal.Footer>
                    </Form>
                </Modal>
            </Card.Body>
        </Card>
    );
}

function renderTagFields(draft, setDraft) {
    return (
        <>
            <Form.Group className="mb-3">
                <Form.Label>Name</Form.Label>
                <Form.Control
                    value={draft.tagName}
                    onChange={(e) => setDraft((p) => ({ ...p, tagName: e.target.value }))}
                    required
                />
            </Form.Group>
            <Form.Group className="mb-3">
                <Form.Label>Description</Form.Label>
                <Form.Control
                    value={draft.tagDescription}
                    onChange={(e) => setDraft((p) => ({ ...p, tagDescription: e.target.value }))}
                    required
                />
            </Form.Group>
            <Form.Group>
                <Form.Label>Genre</Form.Label>
                <Form.Select
                    value={draft.tagGenre}
                    onChange={(e) => setDraft((p) => ({ ...p, tagGenre: e.target.value }))}
                >
                    {GENRES.map((g) => <option key={g} value={g}>{g}</option>)}
                </Form.Select>
            </Form.Group>
        </>
    );
}
