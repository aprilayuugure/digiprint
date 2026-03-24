import { useEffect, useState, useCallback, useMemo } from "react";
import { Modal, Button, Spinner, Alert, Table } from "react-bootstrap";
import { useAuthContext } from "../contexts/AuthContext";
import OrderService from "../services/OrderService";
import {
    normalizeOrder,
    normalizeOrderStatus,
    orderHasAllCompletedDeliverables,
} from "../utils/orderNormalize";
import { GENRE_LABELS } from "../constants/validGenres";
import OrderDeliverablesCell from "./OrderDeliverablesCell";

function formatTotalInt(value) {
    const n = Math.trunc(Number(value));
    return Number.isFinite(n) ? String(n) : "0";
}

/**
 * Modal: xem đơn, upload completedDeliverables từng dòng, rồi mới gọi COMPLETED.
 */
export default function CompleteOrderModal({ show, orderId, onHide, onCompleted }) {
    const { user } = useAuthContext();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [completing, setCompleting] = useState(false);

    const loadOrder = useCallback(async () => {
        if (orderId == null) return;
        setLoading(true);
        setError(null);
        try {
            const res = await OrderService.getOrderById(orderId);
            setOrder(normalizeOrder(res.data));
        } catch (err) {
            setError(err.response?.data?.message || "Could not load order.");
            setOrder(null);
        } finally {
            setLoading(false);
        }
    }, [orderId]);

    useEffect(() => {
        if (show && orderId != null) {
            loadOrder();
        } else if (!show) {
            setOrder(null);
            setError(null);
        }
    }, [show, orderId, loadOrder]);

    const orderSt = useMemo(
        () => (order ? normalizeOrderStatus(order.orderStatus) : ""),
        [order]
    );
    const allDelivered = useMemo(
        () => (order ? orderHasAllCompletedDeliverables(order) : false),
        [order]
    );

    const canManageDeliverables = (item) => {
        if (user?.role === "ADMIN") return true;
        if (user?.role !== "ARTIST" || !user?.username || !item.commissionArtistUsername) {
            return false;
        }
        return (
            String(item.commissionArtistUsername).toLowerCase() ===
            String(user.username).toLowerCase()
        );
    };

    const handleConfirmComplete = async () => {
        if (!order?.orderId || !allDelivered) return;
        setCompleting(true);
        try {
            await OrderService.updateOrderStatus(order.orderId, "COMPLETED");
            await onCompleted?.();
            onHide?.();
        } finally {
            setCompleting(false);
        }
    };

    return (
        <Modal show={show} onHide={onHide} size="lg" centered scrollable>
            <Modal.Header closeButton>
                <Modal.Title>
                    {orderId != null ? `Complete order #${orderId}` : "Complete order"}
                </Modal.Title>
            </Modal.Header>
            <Modal.Body>
                {loading && (
                    <div className="d-flex justify-content-center py-4">
                        <Spinner animation="border" size="sm" />
                    </div>
                )}
                {error && !loading && <Alert variant="danger">{error}</Alert>}
                {!loading && !error && order && (
                    <>
                        {orderSt !== "IN_PROGRESS" && (
                            <Alert variant="warning" className="small">
                                This order is not in progress ({order.orderStatus}). You may close this
                                dialog.
                            </Alert>
                        )}
                        <p className="text-muted small">
                            Upload at least one delivered file for every commission line, then confirm
                            completion. Status will only change to Completed after you confirm.
                        </p>
                        <div className="table-responsive">
                            <Table bordered hover size="sm" className="align-middle">
                                <thead className="table-light">
                                    <tr>
                                        <th className="text-center">Commission type</th>
                                        <th className="text-center">Genre</th>
                                        <th className="text-center">Quantity</th>
                                        <th className="text-center">Unit</th>
                                        <th className="text-center">Total</th>
                                        <th className="text-center">Deliverables</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {(order.orderItems || []).length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="text-center text-muted py-3">
                                                No items.
                                            </td>
                                        </tr>
                                    ) : (
                                        order.orderItems.map((item) => (
                                            <tr
                                                key={
                                                    item.orderItemId ??
                                                    `${item.commissionId}-${item.quantity}`
                                                }
                                            >
                                                <td>{item.commissionType ?? "—"}</td>
                                                <td>
                                                    {item.genre
                                                        ? GENRE_LABELS[item.genre] ?? item.genre
                                                        : "—"}
                                                </td>
                                                <td className="text-center">{item.quantity}</td>
                                                <td className="text-end">{formatTotalInt(item.unitPrice)}</td>
                                                <td className="text-end fw-medium">{formatTotalInt(item.lineTotal)}</td>
                                                <td className="small">
                                                    <OrderDeliverablesCell
                                                        item={item}
                                                        canManage={canManageDeliverables(item)}
                                                        onRefresh={loadOrder}
                                                    />
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </Table>
                        </div>
                        {!allDelivered && orderSt === "IN_PROGRESS" && (
                            <Alert variant="secondary" className="small mb-0">
                                Add delivered files for every row above to enable &quot;Mark as
                                completed&quot;.
                            </Alert>
                        )}
                    </>
                )}
            </Modal.Body>
            <Modal.Footer>
                <Button variant="outline-secondary" onClick={onHide} disabled={completing}>
                    Cancel
                </Button>
                <Button
                    variant="success"
                    onClick={handleConfirmComplete}
                    disabled={
                        loading ||
                        !!error ||
                        !order ||
                        orderSt !== "IN_PROGRESS" ||
                        !allDelivered ||
                        completing
                    }
                >
                    {completing ? "Saving…" : "Mark as completed"}
                </Button>
            </Modal.Footer>
        </Modal>
    );
}
