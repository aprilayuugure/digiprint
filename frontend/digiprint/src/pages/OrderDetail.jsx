import { useEffect, useState, useCallback, useMemo } from "react";
import { Container, Spinner,
    Button,
    Badge,
    Table,
    Card,
    Alert,
    Row,
    Col,
} from "react-bootstrap";
import { Link, useParams, useLocation } from "react-router-dom";
import { useAuthContext } from "../contexts/AuthContext";
import OrderService from "../services/OrderService";
import {
    normalizeOrder,
    normalizeOrderStatus,
    isOrderCustomer,
} from "../utils/orderNormalize";
import { GENRE_LABELS } from "../constants/validGenres";
import OrderDeliverablesCell from "../components/OrderDeliverablesCell";
import CompleteOrderModal from "../components/CompleteOrderModal";
import PaymentService from "../services/PaymentService";

function formatDateTime(iso) {
    if (!iso) return "—";
    try {
        return new Date(iso).toLocaleString();
    } catch {
        return iso;
    }
}

function formatTotalInt(value) {
    const n = Math.trunc(Number(value));
    return Number.isFinite(n) ? String(n) : "0";
}

function deliverablesTableMode(orderSt, user, order) {
    if (isOrderCustomer(user, order)) return "readonly";
    if (user?.role === "ADMIN") return "readonly";
    if (normalizeOrderStatus(orderSt) === "COMPLETED") return "readonly";
    return "hidden";
}

function OrderDetail() {
    const { id } = useParams();
    const location = useLocation();
    const { user } = useAuthContext();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showCompleteModal, setShowCompleteModal] = useState(false);
    const [paying, setPaying] = useState(false);

    useEffect(() => {
        let cancelled = false;
        const run = async () => {
            const oid = parseInt(id, 10);
            if (Number.isNaN(oid)) {
                setError("Invalid order id.");
                setLoading(false);
                return;
            }
            setLoading(true);
            setError(null);
            try {
                const res = await OrderService.getOrderById(oid);
                if (!cancelled) setOrder(normalizeOrder(res.data));
            } catch (err) {
                if (!cancelled) {
                    setError(err.response?.data?.message || "Could not load order.");
                    setOrder(null);
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        };
        run();
        return () => {
            cancelled = true;
        };
    }, [id]);

    const loadOrder = useCallback(() => {
        const oid = parseInt(id, 10);
        if (Number.isNaN(oid)) return Promise.resolve();
        return OrderService.getOrderById(oid)
            .then((res) => setOrder(normalizeOrder(res.data)))
            .catch(() => {});
    }, [id]);

    const orderSt = useMemo(
        () => (order ? normalizeOrderStatus(order.orderStatus) : ""),
        [order]
    );

    const isArtistOnOrder = useMemo(() => {
        if (user?.role !== "ARTIST" || !user?.username || !order) return false;
        const u = String(user.username).toLowerCase();
        return (order.orderItems ?? []).some(
            (it) =>
                it.commissionArtistUsername &&
                String(it.commissionArtistUsername).toLowerCase() === u
        );
    }, [order, user?.role, user?.username]);

    const canShowCompleteOrder = useMemo(() => {
        if (!order) return false;
        if (orderSt !== "IN_PROGRESS") return false;
        return user?.role === "ADMIN";
    }, [order, orderSt, user?.role]);

    const canPayOrder = useMemo(() => {
        if (!order || !isOrderCustomer(user, order)) return false;
        return orderSt === "COMPLETED";
    }, [order, orderSt, user]);
    const paymentCompleted = order?.paymentStatus === "SUCCESS";

    const handlePayWithVnpay = async () => {
        if (!order?.orderId || paying) return;
        setPaying(true);
        try {
            const amount = Math.max(1, Math.trunc(Number(order.totalPrice ?? 0)));
            const res = await PaymentService.createVnpayPayment({
                orderId: order.orderId,
                amount,
                orderInfo: `Thanh toan don hang #${order.orderId}`,
                locale: "vn",
            });
            const paymentUrl = res.data?.paymentUrl;
            if (paymentUrl) {
                window.location.href = paymentUrl;
            }
        } finally {
            setPaying(false);
        }
    };

    const ordersListPath = user?.role === "ARTIST" ? "/me" : "/orders";
    const ordersListState =
        user?.role === "ARTIST"
            ? {
                  artistTab:
                      location.state?.artistTab === "myOrders" ? "myOrders" : "orders",
              }
            : undefined;

    if (loading) {
        return (
            <Container className="py-5 d-flex justify-content-center">
                <Spinner animation="border" role="status" />
            </Container>
        );
    }

    if (error || !order) {
        return (
            <Container className="py-4" style={{ maxWidth: 720 }}>
                <Alert variant="danger">{error || "Order not found."}</Alert>
                <Button as={Link} to={ordersListPath} state={ordersListState} variant="outline-primary">
                    Back to orders
                </Button>
            </Container>
        );
    }

    const total = Number(order.totalPrice ?? 0);
    const delMode = deliverablesTableMode(order.orderStatus, user, order);
    const customerView = isOrderCustomer(user, order);
    const blurDeliverablesForCustomer = customerView && order.paymentStatus !== "SUCCESS";

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

    return (
        <Container className="py-4" style={{ maxWidth: 960 }}>
            <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3">
                <h4 className="mb-0">Order #{order.orderId}</h4>
                <Button as={Link} to={ordersListPath} state={ordersListState} variant="outline-secondary" size="sm">
                    Back
                </Button>
            </div>

            {canShowCompleteOrder ? (
                <Alert variant="info" className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3 py-2">
                    <span className="small mb-0">
                        Upload delivered files and mark completed in one step: open{" "}
                        <strong>Complete order</strong>, attach files for each line, then confirm.
                    </span>
                    <Button variant="success" size="sm" onClick={() => setShowCompleteModal(true)}>
                        Complete order
                    </Button>
                </Alert>
            ) : null}

            {canPayOrder && paymentCompleted ? (
                <Alert variant="success" className="mb-3 py-2">
                    <span className="small mb-0">Payment is completed.</span>
                </Alert>
            ) : null}

            {canPayOrder && !paymentCompleted ? (
                <Alert variant="primary" className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3 py-2">
                    <span className="small mb-0">
                        This order is completed. Continue with VNPay to finish payment.
                    </span>
                    <Button variant="primary" size="sm" onClick={handlePayWithVnpay} disabled={paying}>
                        {paying ? "Redirecting..." : "Pay with VNPay"}
                    </Button>
                </Alert>
            ) : null}

            <CompleteOrderModal
                show={showCompleteModal}
                orderId={order?.orderId ?? null}
                onHide={() => setShowCompleteModal(false)}
                onCompleted={() => {
                    loadOrder();
                    setShowCompleteModal(false);
                }}
            />

            <Card className="mb-4 shadow-sm">
                <Card.Body>
                    <Row className="g-3 small">
                        <Col md={4}>
                            <div className="text-muted">Customer</div>
                            <div className="fw-medium">{order.customerUsername ?? "—"}</div>
                        </Col>
                        <Col md={4}>
                            <div className="text-muted">Artist</div>
                            <div className="fw-medium">{order.artistSummary ?? "—"}</div>
                        </Col>
                        <Col md={4}>
                            <div className="text-muted">Created</div>
                            <div>{formatDateTime(order.createdAt)}</div>
                        </Col>
                        <Col md={4}>
                            <div className="text-muted">Status</div>
                            <div>
                                <Badge bg="secondary">{order.orderStatus}</Badge>
                            </div>
                        </Col>
                        <Col md={4}>
                            <div className="text-muted">Payment</div>
                            <div>
                                <Badge bg={order.paymentStatus === "SUCCESS" ? "success" : "warning"}>
                                    {order.paymentStatus ?? "UNPAID"}
                                </Badge>
                            </div>
                        </Col>
                        <Col md={4}>
                            <div className="text-muted">Completed</div>
                            <div>{formatDateTime(order.completedAt)}</div>
                        </Col>
                        <Col md={4}>
                            <div className="text-muted">Total price</div>
                            <div className="fw-semibold">
                                {formatTotalInt(total)}
                            </div>
                        </Col>
                    </Row>
                </Card.Body>
            </Card>

            <h6 className="mb-2">Order items</h6>
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
                                <tr key={item.orderItemId ?? `${item.commissionId}-${item.quantity}`}>
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
                                            mode={delMode}
                                            blurPreview={blurDeliverablesForCustomer}
                                        />
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </Table>
            </div>
        </Container>
    );
}

export default OrderDetail;
