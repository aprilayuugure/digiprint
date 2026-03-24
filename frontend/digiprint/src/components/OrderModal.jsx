import { Modal, Button, Form, Spinner, Alert } from "react-bootstrap";
import { GENRE_LABELS } from "../constants/validGenres";
import { GENRE_FILE_TYPES } from "../constants/fileTypes";
import { useOrderModal } from "../hooks/useOrderModal";
import "../css/artist-commissions-tab.css";

/**
 * Đặt hàng một commission — file đính kèm theo genre (giống CommissionModal).
 *
 * @param {{
 *   show: boolean,
 *   onHide: () => void,
 *   commission: { commissionId: number, commissionType?: string, commissionPrice?: number, genre?: string } | null,
 *   onSuccess?: () => void,
 * }} props
 */
function OrderModal({ show, onHide, commission, onSuccess }) {
    const {
        quantity,
        orderDescription,
        computedLineTotal,
        attachedPaths,
        uploading,
        submitting,
        errors,
        generalError,
        unitPrice,
        handleQuantityChange,
        handleDescriptionChange,
        handleFiles,
        removePath,
        handleSubmit,
        handleModalHide,
    } = useOrderModal({ show, commission, onHide, onSuccess });

    if (!commission) {
        return null;
    }

    const genre = commission.genre;
    const accept = genre ? GENRE_FILE_TYPES[genre] ?? "" : "";

    return (
        <Modal
            show={show}
            onHide={handleModalHide}
            centered
            size="lg"
            dialogClassName="modal-commission-form"
            backdrop={submitting || uploading ? "static" : true}
            keyboard={!submitting && !uploading}
        >
            <Modal.Header closeButton={!submitting && !uploading}>
                <Modal.Title>Place order</Modal.Title>
            </Modal.Header>
            <Modal.Body className="commission-modal-form">
                {generalError ? (
                    <Alert variant="danger" className="mb-3">
                        {generalError}
                    </Alert>
                ) : null}
                <Form onSubmit={handleSubmit}>
                    <Form.Group className="mb-3">
                        <Form.Label>Commission</Form.Label>
                        <Form.Control type="text" readOnly value={commission.commissionType ?? ""} />
                    </Form.Group>
                    <Form.Group className="mb-3">
                        <Form.Label>Genre</Form.Label>
                        <Form.Control
                            type="text"
                            readOnly
                            value={genre ? GENRE_LABELS[genre] ?? String(genre) : ""}
                        />
                    </Form.Group>
                    <Form.Group className="mb-3">
                        <Form.Label>Unit price</Form.Label>
                        <Form.Control type="text" readOnly value={String(unitPrice)} />
                    </Form.Group>
                    <Form.Group className="mb-3">
                        <Form.Label>Quantity</Form.Label>
                        <Form.Control
                            type="number"
                            min={1}
                            step={1}
                            value={quantity}
                            onChange={handleQuantityChange}
                            isInvalid={!!errors.quantity}
                            disabled={submitting}
                        />
                        <Form.Control.Feedback type="invalid">{errors.quantity}</Form.Control.Feedback>
                    </Form.Group>
                    <Form.Group className="mb-3">
                        <Form.Label>Total (estimated)</Form.Label>
                        <Form.Control type="text" readOnly value={String(computedLineTotal)} disabled={submitting} />
                        <Form.Text className="text-muted">
                            Final order total is calculated on the server (unit price × quantity per item).
                        </Form.Text>
                    </Form.Group>
                    <Form.Group className="mb-3">
                        <Form.Label>Note (optional)</Form.Label>
                        <Form.Control
                            as="textarea"
                            rows={2}
                            value={orderDescription}
                            onChange={handleDescriptionChange}
                            disabled={submitting}
                        />
                    </Form.Group>
                    <Form.Group className="mb-0">
                        <Form.Label>Samples (optional)</Form.Label>
                        <Form.Text className="d-block text-muted mb-2">
                            Upload reference files matching this commission&apos;s genre. Types allowed follow the genre
                            (same as commission samples).
                        </Form.Text>
                        <Form.Control
                            type="file"
                            multiple
                            accept={accept}
                            disabled={submitting || uploading || !genre}
                            onChange={handleFiles}
                        />
                        {uploading && (
                            <div className="small text-muted mt-1">
                                <Spinner animation="border" size="sm" className="me-1" />
                                Uploading…
                            </div>
                        )}
                        {attachedPaths.length > 0 && (
                            <ul className="small mb-0 ps-3 mt-2">
                                {attachedPaths.map((p, idx) => (
                                    <li key={p} className="d-flex align-items-start gap-2">
                                        <span className="text-muted">Sample {idx + 1}</span>
                                        <Button
                                            type="button"
                                            variant="link"
                                            size="sm"
                                            className="p-0 text-danger"
                                            onClick={() => removePath(p)}
                                            disabled={submitting}
                                        >
                                            Remove
                                        </Button>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </Form.Group>

                    <div className="mt-4 d-flex gap-2">
                        <Button variant="primary" type="submit" disabled={submitting || uploading}>
                            {submitting ? (
                                <>
                                    <Spinner animation="border" size="sm" className="me-1" />
                                    Submitting…
                                </>
                            ) : (
                                "Submit order"
                            )}
                        </Button>
                        <Button
                            variant="outline-secondary"
                            type="button"
                            onClick={handleModalHide}
                            disabled={submitting || uploading}
                        >
                            Cancel
                        </Button>
                    </div>
                </Form>
            </Modal.Body>
        </Modal>
    );
}

export default OrderModal;
