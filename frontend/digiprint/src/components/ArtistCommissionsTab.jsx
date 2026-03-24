import { useEffect, useState, useCallback } from "react";
import { Spinner, Button } from "react-bootstrap";
import CommissionService from "../services/CommissionService";
import CommissionModal from "./CommissionModal";
import OrderModal from "./OrderModal";
import { useNavigate } from "react-router-dom";
import { useAuthContext } from "../contexts/AuthContext";
import { useLoginPrompt } from "../contexts/LoginPromptContext";
import "../css/artist-commissions-tab.css";

function formatPriceInt(value) {
    const n = Number(value);
    if (Number.isNaN(n)) return "0";
    return String(Math.trunc(n));
}

function GenreSection({
    title,
    items,
    showManageActions,
    showOrder,
    onDelete,
    onOpenView,
    onOpenEdit,
    onOpenOrder,
}) {
    const colSpan = 3;
    return (
        <div className="mb-4">
            <h5 className="mb-2">{title}</h5>
            <div className="table-responsive">
                <table className="table table-sm table-bordered align-middle mb-0 artist-commissions-table">
                    <thead>
                        <tr className="text-center">
                            <th>Type</th>
                            <th>Price</th>
                            <th className="text-nowrap">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {items.length === 0 ? (
                            <tr>
                                <td colSpan={colSpan} className="text-center text-muted py-3">
                                    No commissions yet.
                                </td>
                            </tr>
                        ) : (
                            items.map((c) => (
                                <tr key={c.commissionId}>
                                    <td className="text-center text-body">{c.commissionType}</td>
                                    <td className="text-center">{formatPriceInt(c.commissionPrice)}</td>
                                    <td className="text-center text-nowrap">
                                        <Button
                                            variant="link"
                                            size="sm"
                                            className="p-1 me-1"
                                            title="View"
                                            aria-label="View commission"
                                            onClick={() => onOpenView?.(c.commissionId)}
                                        >
                                            <i className="bi bi-eye" />
                                        </Button>
                                        {showOrder && (
                                            <Button
                                                variant="link"
                                                size="sm"
                                                className="p-1 me-1"
                                                title="Place order"
                                                aria-label="Place order"
                                                onClick={() => onOpenOrder?.(c)}
                                            >
                                                <i className="bi bi-cart-plus" />
                                            </Button>
                                        )}
                                        {showManageActions && (
                                            <>
                                                <Button
                                                    variant="link"
                                                    size="sm"
                                                    className="p-1 me-1"
                                                    title="Edit"
                                                    aria-label="Edit commission"
                                                    onClick={() => onOpenEdit?.(c.commissionId)}
                                                >
                                                    <i className="bi bi-pencil" />
                                                </Button>
                                                <Button
                                                    variant="link"
                                                    size="sm"
                                                    className="p-1 text-danger"
                                                    title="Delete"
                                                    aria-label="Delete commission"
                                                    onClick={() => onDelete?.(c)}
                                                >
                                                    <i className="bi bi-trash" />
                                                </Button>
                                            </>
                                        )}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

function ArtistCommissionsTab({
    commissionsState,
    fetchCommissions,
    showAddCommission,
    showManageActions,
    showOrder = false,
    targetUserId,
    /** @type {string | undefined} */
    artistUsername,
}) {
    const navigate = useNavigate();
    const { isAuthenticated } = useAuthContext();
    const { openLoginPrompt } = useLoginPrompt();

    const [modal, setModal] = useState({
        open: false,
        mode: null,
        /** @type {number | null} */
        id: null,
    });

    const [orderModal, setOrderModal] = useState({
        open: false,
        /** @type {object | null} */
        commission: null,
    });

    const closeModal = useCallback(() => {
        setModal({ open: false, mode: null, id: null });
    }, []);

    const openAdd = useCallback(() => {
        setModal({ open: true, mode: "add", id: null });
    }, []);

    const openView = useCallback((commissionId) => {
        setModal({ open: true, mode: "view", id: commissionId });
    }, []);

    const openEdit = useCallback((commissionId) => {
        setModal({ open: true, mode: "edit", id: commissionId });
    }, []);

    const closeOrderModal = useCallback(() => {
        setOrderModal({ open: false, commission: null });
    }, []);

    const openOrder = useCallback(
        (c) => {
            if (!isAuthenticated) {
                openLoginPrompt();
                return;
            }
            setOrderModal({ open: true, commission: c });
        },
        [isAuthenticated, openLoginPrompt]
    );

    const handleMakeOrder = useCallback(() => {
        if (!artistUsername?.trim()) return;
        if (!isAuthenticated) {
            openLoginPrompt();
            return;
        }
        navigate(`/orders/new?artist=${encodeURIComponent(artistUsername.trim())}`);
    }, [artistUsername, isAuthenticated, navigate, openLoginPrompt]);

    const handleSuccess = useCallback(() => {
        fetchCommissions();
    }, [fetchCommissions]);

    useEffect(() => {
        fetchCommissions();
    }, [fetchCommissions]);

    const byGenre = (genre) => (commissionsState.commissions || []).filter((c) => c.genre === genre);

    const handleDelete = (c) => {
        if (!c?.commissionId) return;
        const ok = window.confirm(
            `Delete commission "${c.commissionType}"? This cannot be undone.`
        );
        if (!ok) return;
        CommissionService.deleteCommission(c.commissionId)
            .then(() => {
                fetchCommissions();
            })
            .catch(() => {
                /* toast from interceptor */
            });
    };

    return (
        <>
            <CommissionModal
                show={modal.open}
                onHide={closeModal}
                mode={modal.mode}
                commissionId={modal.id}
                targetUserId={targetUserId}
                onSuccess={handleSuccess}
                onRequestEdit={() => setModal((m) => ({ ...m, mode: "edit" }))}
            />

            <OrderModal
                show={orderModal.open}
                commission={orderModal.commission}
                onHide={closeOrderModal}
            />

            <div className="text-center mb-3 pb-3 border-bottom">
                <div className="fw-medium fs-5">Commissions</div>
                {showOrder && artistUsername?.trim() && (
                    <Button
                        variant="outline-primary"
                        size="sm"
                        className="mt-2"
                        onClick={handleMakeOrder}
                    >
                        Make order
                    </Button>
                )}
                {showAddCommission && (
                    <Button variant="primary" size="sm" className="mt-2" onClick={openAdd}>
                        Add commission
                    </Button>
                )}
            </div>

            {commissionsState.loading && (
                <div
                    className="d-flex justify-content-center align-items-center"
                    style={{ minHeight: "40vh" }}
                >
                    <Spinner animation="border" role="status" style={{ width: 56, height: 56 }} />
                </div>
            )}

            {commissionsState.generalErrors && !commissionsState.loading && (
                <div className="alert alert-danger">{commissionsState.generalErrors}</div>
            )}

            {!commissionsState.loading && !commissionsState.generalErrors && (
                <>
                    <GenreSection
                        title="Art Commission"
                        items={byGenre("ART")}
                        showManageActions={showManageActions}
                        showOrder={showOrder}
                        onDelete={handleDelete}
                        onOpenView={openView}
                        onOpenEdit={openEdit}
                        onOpenOrder={openOrder}
                    />
                    <GenreSection
                        title="Music Commission"
                        items={byGenre("MUSIC")}
                        showManageActions={showManageActions}
                        showOrder={showOrder}
                        onDelete={handleDelete}
                        onOpenView={openView}
                        onOpenEdit={openEdit}
                        onOpenOrder={openOrder}
                    />
                    <GenreSection
                        title="Literature Commission"
                        items={byGenre("LITERATURE")}
                        showManageActions={showManageActions}
                        showOrder={showOrder}
                        onDelete={handleDelete}
                        onOpenView={openView}
                        onOpenEdit={openEdit}
                        onOpenOrder={openOrder}
                    />
                </>
            )}
        </>
    );
}

export default ArtistCommissionsTab;
