import { useState } from "react";
import { Button, Form } from "react-bootstrap";
import OrderService from "../services/OrderService";
import {
    fileNameFromPath,
    previewKindFromPath,
    storageAbsoluteUrl,
} from "../utils/commissionModalUtils";

/**
 * @param {'manage' | 'readonly' | 'hidden'} [mode='manage'] — hidden: không hiện file/up; readonly: chỉ link tải; manage: upload/xóa (modal Complete).
 */
export default function OrderDeliverablesCell({
    item,
    canManage,
    onRefresh,
    mode = "manage",
    blurPreview = false,
}) {
    const [busy, setBusy] = useState(false);
    const paths = item.completedDeliverables ?? [];

    if (mode === "hidden") {
        return <span className="text-muted">—</span>;
    }

    const handleFile = async (e) => {
        const f = e.target.files?.[0];
        if (!f || item.orderItemId == null) return;
        setBusy(true);
        try {
            const res = await OrderService.uploadOrderCompletedDeliverable(item.orderItemId, f);
            const path = res.data?.path;
            if (path) {
                await OrderService.patchOrderItemCompletedDeliverables(item.orderItemId, [...paths, path]);
                await onRefresh();
            }
        } finally {
            setBusy(false);
            e.target.value = "";
        }
    };

    const remove = async (path) => {
        setBusy(true);
        try {
            await OrderService.patchOrderItemCompletedDeliverables(
                item.orderItemId,
                paths.filter((p) => p !== path)
            );
            await onRefresh();
        } finally {
            setBusy(false);
        }
    };

    const showRemove = mode === "manage" && canManage;
    const showUpload = mode === "manage" && canManage;

    const renderPreview = (path, idx) => {
        const url = storageAbsoluteUrl(path);
        const kind = previewKindFromPath(path);
        const name = fileNameFromPath(path) || `Sample ${idx + 1}`;
        const blurStyle = blurPreview
            ? { filter: "blur(8px)", pointerEvents: "none", userSelect: "none" }
            : undefined;

        if (kind === "image") {
            return (
                <div className="d-flex justify-content-center align-items-center">
                    <img
                        src={url}
                        alt={name}
                        className="img-fluid rounded border bg-white"
                        style={{ maxHeight: 120, objectFit: "contain", ...blurStyle }}
                    />
                </div>
            );
        }
        if (kind === "video") {
            return (
                <div className="d-flex justify-content-center align-items-center">
                    <video
                        src={url}
                        controls={!blurPreview}
                        muted
                        playsInline
                        className="w-100 rounded border bg-dark"
                        style={{ maxHeight: 140, ...blurStyle }}
                    />
                </div>
            );
        }
        if (kind === "pdf") {
            return (
                <div className="d-flex justify-content-center align-items-center">
                    <iframe
                        title={name}
                        src={url}
                        className="w-100 rounded border bg-white"
                        style={{ height: 140, ...blurStyle }}
                    />
                </div>
            );
        }
        return (
            <a
                href={blurPreview ? undefined : url}
                target="_blank"
                rel="noreferrer"
                className="small"
                style={blurStyle}
                onClick={blurPreview ? (e) => e.preventDefault() : undefined}
            >
                {name}
            </a>
        );
    };

    return (
        <div className="small">
            {!paths.length ? (
                <span className="text-muted">—</span>
            ) : (
                <div className="d-flex flex-column gap-2">
                    {paths.map((p, i) => (
                        <div key={p} className="border rounded p-2 bg-light">
                            <div className="mb-1 text-muted small text-truncate" title={p}>
                                {fileNameFromPath(p) || `Sample ${i + 1}`}
                            </div>
                            {renderPreview(p, i)}
                            {blurPreview ? (
                                <div className="small text-muted mt-1">
                                    Preview locked until payment is completed.
                                </div>
                            ) : null}
                            {showRemove ? (
                                <div className="mt-1">
                                    <Button
                                        variant="link"
                                        size="sm"
                                        className="p-0 text-danger"
                                        disabled={busy}
                                        onClick={() => remove(p)}
                                    >
                                        Remove
                                    </Button>
                                </div>
                            ) : null}
                        </div>
                    ))}
                </div>
            )}
            {showUpload ? (
                <Form.Control
                    type="file"
                    size="sm"
                    className="mt-1"
                    disabled={busy}
                    onChange={handleFile}
                />
            ) : null}
        </div>
    );
}
