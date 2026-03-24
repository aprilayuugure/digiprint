import { useEffect, useState } from "react";
import { Container, Table, Button, Spinner, Badge } from "react-bootstrap";
import { Link, useNavigate } from "react-router-dom";
import { useAuthContext } from "../contexts/AuthContext";
import { useLoginPrompt } from "../contexts/LoginPromptContext";
import { useOrder } from "../hooks/useOrder";
import Pagination from "../components/Pagination";
import OrderFilters from "../components/OrderFilters";
import CompleteOrderModal from "../components/CompleteOrderModal";
import OrderService from "../services/OrderService";
import { normalizeOrderStatus } from "../utils/orderNormalize";
import { useOrdersPageConfig } from "../hooks/useOrdersPageConfig";

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

/**
 * @param {'incoming' | 'myOrders'} variant — incoming: đơn tới artist; myOrders: đơn mình đặt
 * @param {object} [detailState] — state khi mở chi tiết đơn (vd. artistTab)
 */
function OrderStatusActions({
    order,
    variant,
    onUpdated,
    updatingId,
    setUpdatingId,
    detailState,
    onOpenCompleteModal,
}) {
    const navigate = useNavigate();
    const st = normalizeOrderStatus(order.orderStatus);
    const busy = updatingId === order.orderId;

    const run = async (next) => {
        setUpdatingId(order.orderId);
        try {
            await OrderService.updateOrderStatus(order.orderId, next);
            await onUpdated();
        } finally {
            setUpdatingId(null);
        }
    };

    const runUpdateToDraft = async () => {
        setUpdatingId(order.orderId);
        try {
            await OrderService.updateOrderStatus(order.orderId, "DRAFT");
            await onUpdated();
            navigate(`/orders/${order.orderId}/edit`);
        } finally {
            setUpdatingId(null);
        }
    };

    const btnProps = { size: "sm", className: "me-1 mb-1", disabled: busy };

    if (variant === "incoming") {
        if (st === "PENDING") {
            return (
                <>
                    <Button {...btnProps} variant="success" onClick={() => run("ACCEPTED")}>
                        Accept
                    </Button>
                    <Button {...btnProps} variant="outline-danger" onClick={() => run("REJECTED")}>
                        Reject
                    </Button>
                </>
            );
        }
        if (st === "ACCEPTED") {
            return (
                <Button {...btnProps} variant="primary" onClick={() => run("IN_PROGRESS")}>
                    Start
                </Button>
            );
        }
        if (st === "IN_PROGRESS") {
            return (
                <>
                    <Button {...btnProps} variant="outline-warning" onClick={() => run("CANCELLED")}>
                        Cancel
                    </Button>
                    <Button
                        {...btnProps}
                        variant="success"
                        onClick={() => onOpenCompleteModal?.(order.orderId)}
                        title="Open dialog to upload delivered files and mark order completed."
                    >
                        Complete
                    </Button>
                </>
            );
        }
        return <span className="text-muted">—</span>;
    }

    if (variant === "myOrders") {
        if (st === "PENDING") {
            return (
                <>
                    <Button {...btnProps} variant="outline-primary" onClick={() => runUpdateToDraft()}>
                        Update
                    </Button>
                    <Button {...btnProps} variant="outline-danger" onClick={() => run("CANCELLED")}>
                        Cancel
                    </Button>
                </>
            );
        }
        return <span className="text-muted">—</span>;
    }

    return <span className="text-muted">—</span>;
}

/**
 * @param {boolean} embedded — nhúng trong /me (không bọc Container ngoài)
 * @param {'incoming' | 'myPurchases' | null} artistOrderView — chỉ dùng khi embedded + ARTIST:
 *   incoming: đơn khách đặt qua commission của mình; myPurchases: đơn chính mình đặt (mua artist khác)
 */
function Orders({ embedded = false, artistOrderView = null }) {
    const { openLoginPrompt } = useLoginPrompt();
    const { isAuthenticated, user } = useAuthContext();
    const { state, setFilters, fetchOrders } = useOrder();
    const [updatingId, setUpdatingId] = useState(null);
    const [completeModalOrderId, setCompleteModalOrderId] = useState(null);

    const {
        isUserRole,
        isArtist,
        incomingView,
        myPurchasesView,
        showCustomerCol,
        showArtistCol,
        showActionsIncoming,
        showActionsMyOrders,
        showActionsCol,
        showCustomerFilter,
        showArtistFilter,
        tableColCount,
        title,
        description,
        showPlaceOrder,
        detailState,
        refetchOrders,
    } = useOrdersPageConfig({
        userRole: user?.role,
        artistOrderView,
        embedded,
        fetchOrders,
        isArtist: user?.role === "ARTIST",
    });

    useEffect(() => {
        if (!isAuthenticated) return;
        refetchOrders(0);
    }, [isAuthenticated, incomingView, myPurchasesView, isArtist, embedded]);

    const handlePageChange = (p) => {
        refetchOrders(p);
    };

    if (!isAuthenticated) {
        const inner = (
            <>
                <h4 className="mb-3">Orders</h4>
                <p className="text-muted mb-4">Sign in to view your orders.</p>
                <Button variant="primary" onClick={() => openLoginPrompt()}>
                    Log in
                </Button>
            </>
        );
        return embedded ? (
            <div className="py-4 text-center">{inner}</div>
        ) : (
            <Container className="py-5 text-center">{inner}</Container>
        );
    }

    const body = (
        <>
            <CompleteOrderModal
                show={completeModalOrderId != null}
                orderId={completeModalOrderId}
                onHide={() => setCompleteModalOrderId(null)}
                onCompleted={() => {
                    refetchOrders(state.page);
                    setCompleteModalOrderId(null);
                }}
            />
            <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-2">
                <h4 className="mb-0">{title}</h4>
                {showPlaceOrder && (
                    <Button as={Link} to="/orders/new" variant="primary" size="sm">
                        Place order
                    </Button>
                )}
            </div>
            <p className="text-muted small mb-4">{description}</p>

            <OrderFilters
                filters={state.filters}
                onFiltersChange={(partial) => setFilters(partial)}
                onApply={() => refetchOrders(0)}
                showCustomerFilter={showCustomerFilter}
                showArtistFilter={showArtistFilter}
            />

            {state.loading && (
                <div
                    className="d-flex justify-content-center align-items-center"
                    style={{ minHeight: "50vh" }}
                >
                    <Spinner
                        animation="border"
                        role="status"
                        style={{ width: 56, height: 56 }}
                    />
                </div>
            )}

            {state.generalErrors && !state.loading && (
                <div className="alert alert-danger">{state.generalErrors}</div>
            )}

            {!state.loading && !state.generalErrors && (
                <>
                    <div className="table-responsive">
                        <Table striped bordered hover size="sm" className="align-middle">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    {showCustomerCol && <th>Customer</th>}
                                    {showArtistCol && <th>Artist</th>}
                                    <th>Total</th>
                                    <th>Created at</th>
                                    <th>Completed at</th>
                                    <th>Status</th>
                                    <th>Payment</th>
                                    {showActionsCol && <th>Actions</th>}
                                </tr>
                            </thead>
                            <tbody>
                                {state.content.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={tableColCount}
                                            className="text-center text-muted py-4"
                                        >
                                            No orders found.
                                        </td>
                                    </tr>
                                ) : (
                                    state.content.map((o) => (
                                        <tr key={o.orderId}>
                                            <td>
                                                <Link to={`/orders/${o.orderId}`} state={detailState}>
                                                    {o.orderId}
                                                </Link>
                                            </td>
                                            {showCustomerCol && (
                                                <td className="small">{o.customerUsername ?? "—"}</td>
                                            )}
                                            {showArtistCol && (
                                                <td className="small">{o.artistSummary ?? "—"}</td>
                                            )}
                                            <td className="text-end">{formatTotalInt(o.totalPrice)}</td>
                                            <td className="small">{formatDateTime(o.createdAt)}</td>
                                            <td className="small">{formatDateTime(o.completedAt)}</td>
                                            <td>
                                                <Badge bg="secondary">{o.orderStatus}</Badge>
                                            </td>
                                            <td>
                                                <Badge bg={o.paymentStatus === "SUCCESS" ? "success" : "warning"}>
                                                    {o.paymentStatus ?? "UNPAID"}
                                                </Badge>
                                            </td>
                                            {showActionsCol && (
                                                <td className="text-nowrap">
                                                    <OrderStatusActions
                                                        order={o}
                                                        variant={
                                                            showActionsIncoming ? "incoming" : "myOrders"
                                                        }
                                                        onUpdated={() => refetchOrders(state.page)}
                                                        updatingId={updatingId}
                                                        setUpdatingId={setUpdatingId}
                                                        detailState={detailState}
                                                        onOpenCompleteModal={(id) =>
                                                            setCompleteModalOrderId(id)
                                                        }
                                                    />
                                                </td>
                                            )}
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </Table>
                    </div>
                    <Pagination
                        page={state.page}
                        totalPages={state.totalPages}
                        onPageChange={handlePageChange}
                    />
                    <div className="text-muted small mt-2">
                        Page {state.page + 1} of {Math.max(1, state.totalPages)} · {state.totalElements}{" "}
                        order(s)
                    </div>
                </>
            )}
        </>
    );

    return embedded ? (
        <div className="orders-embedded">{body}</div>
    ) : (
        <Container className="py-4">{body}</Container>
    );
}

export default Orders;
