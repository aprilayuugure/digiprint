import { useState } from "react";
import { Modal, Spinner, Button, Form, Row, Col, Badge, Alert } from "react-bootstrap";
import { VALID_GENRES, GENRE_LABELS } from "../constants/validGenres";
import { GENRE_FILE_TYPES } from "../constants/fileTypes";
import { useCommissionModal } from "../hooks/useCommissionModal";
import { fileNameFromPath, previewKindFromPath, storageAbsoluteUrl } from "../utils/commissionModalUtils";
import "../css/artist-commissions-tab.css";

function ImageBlobPreview({ previewUrl, name, compact = false, imageAlt }) {
    const [broken, setBroken] = useState(false);
    if (broken) {
        return (
            <div
                className = "rounded border bg-warning bg-opacity-10 p-2 text-center text-muted small"
                style = {{ minHeight: compact ? 72 : 120 }}
            >
                Could not load image.
            </div>
        );
    }
    return (
        <div
            className="rounded border bg-white p-1 d-flex align-items-center justify-content-center"
            style = {{ minHeight: compact ? 88 : 120, maxHeight: compact ? 140 : undefined }}
        >
            <img
                src = {previewUrl}
                alt = {imageAlt ?? name}
                className = "img-fluid d-block mx-auto rounded"
                style = {{ maxHeight: compact ? 120 : 220, maxWidth: "100%", objectFit: "contain" }}
                onError={() => setBroken(true)}
            />
        </div>
    );
}

function AttachmentPreview({ previewKind, previewUrl, name, compact = false, hideFileName = false }) {
    if (!previewUrl) {
        return (
            <div
                className = "rounded border bg-secondary bg-opacity-10 d-flex align-items-center justify-content-center text-muted small"
                style = {{ minHeight: compact ? 72 : 120 }}
            >
                No preview
            </div>
        );
    }
    if (previewKind === "image") {
        return (
            <ImageBlobPreview
                previewUrl = {previewUrl}
                name = {name}
                compact = {compact}
                imageAlt = {hideFileName ? "Sample" : undefined}
            />
        );
    }
    if (previewKind === "video") {
        return (
            <video
                src={previewUrl}
                controls
                muted
                playsInline
                className="w-100 rounded border bg-dark"
                style={compact ? { minHeight: 88, maxHeight: 140 } : { minHeight: 160, maxHeight: 260 }}
            />
        );
    }
    if (previewKind === "pdf") {
        return (
            <iframe
                title={hideFileName ? "Sample" : name}
                src={previewUrl}
                className="w-100 rounded border bg-white"
                style={compact ? { height: 160, minHeight: 120 } : { height: 280, minHeight: 200 }}
            />
        );
    }
    return (
        <div
            className="rounded border bg-light p-2 text-center text-muted small"
            style={{ minHeight: compact ? 72 : 100 }}
        >
            {!hideFileName && (
                <div className="fw-medium text-body text-truncate" title={name}>
                    {name}
                </div>
            )}
            <a href={previewUrl} target="_blank" rel="noreferrer" className="small">
                Open file
            </a>
        </div>
    );
}

/**
 * @param {{
 *   show: boolean,
 *   onHide: () => void,
 *   mode: "add" | "edit" | "view" | null,
 *   commissionId: number | null,
 *   targetUserId: number | null,
 *   onSuccess: () => void,
 *   onRequestEdit?: () => void,
 * }} props
 */
function CommissionModal({
    show,
    onHide,
    mode,
    commissionId: idParam,
    targetUserId,
    onSuccess,
    onRequestEdit,
}) {
    const {
        loading,
        loadError,
        commission,
        modalForm,
        submitting,
        previewAnchorRef,
        canManageThis,
        handleField,
        handleGenreChange,
        handleNewFiles,
        removeNewFile,
        removeExistingPath,
        handlePriceChange,
        handleSubmitAdd,
        handleSubmitEdit,
        handleModalHide,
        isEdit,
        formTitle,
    } = useCommissionModal({
        show,
        onHide,
        mode,
        commissionId: idParam,
        targetUserId,
        onSuccess,
    });

    if (!show || !mode) {
        return null;
    }

    let bodyContent = null;

    if (loading) {
        bodyContent = (
            <div className="d-flex justify-content-center py-5">
                <Spinner animation="border" role="status" />
            </div>
        );
    } else if (loadError || (mode !== "add" && !commission)) {
        bodyContent = (
            <>
                <p className="text-danger">{loadError || "Not found."}</p>
                <Button variant="outline-primary" onClick={handleModalHide}>
                    Close
                </Button>
            </>
        );
    } else if (mode === "edit" && commission && !canManageThis) {
        bodyContent = (
            <>
                <p className="text-danger">You cannot edit this commission.</p>
                <Button variant="outline-primary" onClick={handleModalHide}>
                    Close
                </Button>
            </>
        );
    } else if (mode === "view" && commission) {
        bodyContent = (
            <>
                <Form.Group className="mb-3">
                    <Form.Label>Type</Form.Label>
                    <Form.Control type="text" readOnly value={commission.commissionType} />
                </Form.Group>
                <Row className="g-3 mb-3">
                    <Col md={6}>
                        <Form.Group>
                            <Form.Label>Price</Form.Label>
                            <Form.Control type="text" readOnly value={String(commission.commissionPrice)} />
                        </Form.Group>
                    </Col>
                    <Col md={6}>
                        <Form.Group>
                            <Form.Label>Genre</Form.Label>
                            <Form.Control
                                type="text"
                                readOnly
                                value={
                                    commission.genre
                                        ? GENRE_LABELS[commission.genre] ?? String(commission.genre)
                                        : ""
                                }
                            />
                        </Form.Group>
                    </Col>
                </Row>
                <Form.Group className="mb-3">
                    <Form.Label>Description</Form.Label>
                    <Form.Control
                        as="textarea"
                        rows={3}
                        readOnly
                        value={commission.commissionDescription ?? ""}
                    />
                </Form.Group>
                <Form.Label>Samples</Form.Label>
                <Row className="g-2 mt-1">
                    {(commission.attachedFiles || []).length === 0 ? (
                        <Col xs={12} className="text-muted small">
                            None
                        </Col>
                    ) : (
                        commission.attachedFiles.map((path) => {
                            const url = storageAbsoluteUrl(path);
                            const kind = previewKindFromPath(path);
                            const name = fileNameFromPath(path);
                            return (
                                <Col key={path} xs={12} md={6} lg={4}>
                                    <div className="border rounded p-2 bg-light h-100">
                                        <AttachmentPreview
                                            previewKind={kind}
                                            previewUrl={url}
                                            name={name}
                                            compact
                                            hideFileName
                                        />
                                    </div>
                                </Col>
                            );
                        })
                    )}
                </Row>
            </>
        );
    } else if (mode === "add" || mode === "edit") {
        bodyContent = (
            <Form onSubmit={mode === "add" ? handleSubmitAdd : handleSubmitEdit}>
                {modalForm.generalError ? (
                    <Alert variant="danger" className="mb-3">
                        {modalForm.generalError}
                    </Alert>
                ) : null}
                <Form.Group className="mb-3">
                    <Form.Label>Type</Form.Label>
                    <Form.Control
                        type="text"
                        value={modalForm.commissionType}
                        onChange={(e) => handleField("commissionType", e.target.value)}
                        placeholder="e.g. Portrait, Cover art…"
                        isInvalid={!!modalForm.errors.commissionType}
                        disabled={submitting}
                    />
                    <Form.Control.Feedback type="invalid">{modalForm.errors.commissionType}</Form.Control.Feedback>
                </Form.Group>
                <Row className="g-3 mb-3">
                    <Col md={6}>
                        <Form.Group>
                            <Form.Label>Price (integer)</Form.Label>
                            <Form.Control
                                type="text"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                value={modalForm.commissionPrice}
                                onChange={handlePriceChange}
                                placeholder="0"
                                isInvalid={!!modalForm.errors.commissionPrice}
                                disabled={submitting}
                            />
                            <Form.Control.Feedback type="invalid">{modalForm.errors.commissionPrice}</Form.Control.Feedback>
                        </Form.Group>
                    </Col>
                    <Col md={6}>
                        <Form.Group>
                            <Form.Label>Genre</Form.Label>
                            <Form.Select
                                value={modalForm.genre ?? ""}
                                onChange={handleGenreChange}
                                disabled={submitting || isEdit}
                                isInvalid={!!modalForm.errors.genre}
                            >
                                <option value="">Select genre</option>
                                {VALID_GENRES.map((g) => (
                                    <option key={g} value={g}>
                                        {GENRE_LABELS[g]}
                                    </option>
                                ))}
                            </Form.Select>
                            <Form.Control.Feedback type="invalid">{modalForm.errors.genre}</Form.Control.Feedback>
                            {isEdit && (
                                <Form.Text className="text-muted">Genre cannot be changed after creation.</Form.Text>
                            )}
                        </Form.Group>
                    </Col>
                </Row>
                <Form.Group className="mb-3">
                    <Form.Label>Description (optional)</Form.Label>
                    <Form.Control
                        as="textarea"
                        rows={3}
                        value={modalForm.commissionDescription}
                        onChange={(e) => handleField("commissionDescription", e.target.value)}
                        disabled={submitting}
                    />
                </Form.Group>

                <Form.Group className="mb-0">
                    <Form.Label>{isEdit ? "Samples" : "Samples (optional)"}</Form.Label>

                    {isEdit && modalForm.existingPaths.length > 0 && (
                        <Row className="g-2 mb-3">
                            {modalForm.existingPaths.map((path) => {
                                const url = storageAbsoluteUrl(path);
                                const kind = previewKindFromPath(path);
                                const name = fileNameFromPath(path);
                                return (
                                    <Col key={path} xs={12} md={6} lg={4}>
                                        <div className="border rounded p-2 pt-3 bg-light h-100 position-relative">
                                            <Badge
                                                bg="danger"
                                                pill
                                                className="position-absolute top-0 end-0 m-1 shadow-sm"
                                                style={{
                                                    cursor: submitting ? "not-allowed" : "pointer",
                                                    zIndex: 2,
                                                }}
                                                role="button"
                                                onClick={() => !submitting && removeExistingPath(path)}
                                                aria-label="Remove sample"
                                            >
                                                ×
                                            </Badge>
                                            <AttachmentPreview
                                                previewKind={kind}
                                                previewUrl={url}
                                                name={name}
                                                compact
                                                hideFileName
                                            />
                                        </div>
                                    </Col>
                                );
                            })}
                        </Row>
                    )}

                    <Form.Control
                        key={`${modalForm.genre ?? "none"}-${isEdit ? "e" : "a"}`}
                        type="file"
                        multiple
                        accept={modalForm.genre ? GENRE_FILE_TYPES[modalForm.genre] ?? "" : ""}
                        disabled={submitting || !modalForm.genre}
                        onChange={handleNewFiles}
                    />
                    {modalForm.newFiles.length > 0 && (
                        <div ref={previewAnchorRef}>
                            <Row className="g-2 mt-2">
                                {modalForm.newFiles.map((item) => (
                                    <Col key={item.id} xs={12} md={6} lg={4}>
                                        <div className="border rounded p-2 pt-3 bg-light h-100 d-flex flex-column position-relative">
                                            <Badge
                                                bg="danger"
                                                pill
                                                className="position-absolute top-0 end-0 m-1 shadow-sm"
                                                style={{
                                                    cursor: submitting ? "not-allowed" : "pointer",
                                                    zIndex: 2,
                                                }}
                                                role="button"
                                                onClick={() => !submitting && removeNewFile(item.id)}
                                                aria-label="Remove sample"
                                            >
                                                ×
                                            </Badge>
                                            <div className="flex-grow-1">
                                                <AttachmentPreview
                                                    previewKind={item.previewKind}
                                                    previewUrl={item.previewUrl}
                                                    name={item.name}
                                                    compact
                                                    hideFileName
                                                />
                                            </div>
                                            <span className="small text-muted mt-1">New — uploads on save</span>
                                        </div>
                                    </Col>
                                ))}
                            </Row>
                        </div>
                    )}
                </Form.Group>

                <div className="mt-4 d-flex gap-2">
                    <Button variant="primary" type="submit" disabled={submitting}>
                        {submitting ? (
                            <>
                                <Spinner animation="border" size="sm" className="me-1" />
                                Saving…
                            </>
                        ) : (
                            "Save"
                        )}
                    </Button>
                    <Button variant="outline-secondary" type="button" onClick={handleModalHide} disabled={submitting}>
                        Cancel
                    </Button>
                </div>
            </Form>
        );
    }

    const modalTitle =
        mode === "view" ? "Commission" : mode === "add" || mode === "edit" ? formTitle : "Commission";

    return (
        <Modal
            show={show}
            onHide={handleModalHide}
            centered
            size="lg"
            dialogClassName="modal-commission-form"
            backdrop={submitting ? "static" : true}
            keyboard={!submitting}
        >
            <Modal.Header closeButton={!submitting}>
                <Modal.Title>{modalTitle}</Modal.Title>
            </Modal.Header>
            <Modal.Body
                className="commission-form-body commission-modal-form"
                style={{
                    maxHeight: "min(78vh, 620px)",
                    overflowY: "auto",
                }}
            >
                {bodyContent}
            </Modal.Body>
            {mode === "view" && commission && !loading && !loadError && (
                <Modal.Footer>
                    {canManageThis && (
                        <Button variant="primary" size="sm" onClick={() => onRequestEdit?.()}>
                            Edit
                        </Button>
                    )}
                    <Button variant="outline-secondary" size="sm" type="button" onClick={handleModalHide}>
                        Close
                    </Button>
                </Modal.Footer>
            )}
        </Modal>
    );
}

export default CommissionModal;
