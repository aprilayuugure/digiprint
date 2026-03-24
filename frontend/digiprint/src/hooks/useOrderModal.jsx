import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import OrderService from "../services/OrderService";

/**
 * Form đặt hàng một commission — tổng tiền do backend tính; note + file mẫu theo genre.
 *
 * @param {{
 *   show: boolean,
 *   commission: { commissionId: number, commissionType?: string, commissionPrice?: number, genre?: string } | null,
 *   onHide: () => void,
 *   onSuccess?: () => void,
 * }} params
 */
export function useOrderModal({ show, commission, onHide, onSuccess }) {
    const navigate = useNavigate();
    const [quantity, setQuantity] = useState(1);
    const [orderDescription, setOrderDescription] = useState("");
    /** @type {[string[], React.Dispatch<React.SetStateAction<string[]>>]} */
    const [attachedPaths, setAttachedPaths] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [errors, setErrors] = useState({});
    const [generalError, setGeneralError] = useState("");

    const unitPrice = commission != null ? Number(commission.commissionPrice) || 0 : 0;

    const computedLineTotal = useMemo(
        () => Math.round(unitPrice * Math.max(1, quantity)),
        [unitPrice, quantity]
    );

    const resetForm = useCallback(() => {
        setQuantity(1);
        setOrderDescription("");
        setAttachedPaths([]);
        setErrors({});
        setGeneralError("");
    }, []);

    useEffect(() => {
        if (!show || !commission) return;
        resetForm();
    }, [show, commission?.commissionId, resetForm]);

    const handleQuantityChange = (e) => {
        const raw = e.target.value;
        const n = parseInt(raw, 10);
        const q = Number.isNaN(n) || n < 1 ? 1 : n;
        setQuantity(q);
        setErrors((prev) => {
            const next = { ...prev };
            delete next.quantity;
            return next;
        });
        setGeneralError("");
    };

    const handleDescriptionChange = (e) => {
        setOrderDescription(e.target.value);
    };

    const handleFiles = async (e) => {
        const files = e.target.files ? Array.from(e.target.files) : [];
        e.target.value = "";
        if (!files.length || !commission) return;
        setUploading(true);
        setGeneralError("");
        try {
            const next = [...attachedPaths];
            for (const file of files) {
                const res = await OrderService.uploadOrderAttachment(file);
                const path = res.data?.path;
                if (path) next.push(path);
            }
            setAttachedPaths(next);
        } catch {
            /* interceptor */
        } finally {
            setUploading(false);
        }
    };

    const removePath = (path) => {
        setAttachedPaths((prev) => prev.filter((p) => p !== path));
    };

    const validate = () => {
        const nextErrors = {};
        if (quantity < 1) {
            nextErrors.quantity = "Quantity must be at least 1.";
        }
        let gen = "";
        if (!commission?.commissionId) {
            gen = "Commission is not loaded.";
        }
        return { nextErrors, gen };
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!commission) return;
        const { nextErrors, gen } = validate();
        if (Object.keys(nextErrors).length > 0 || gen) {
            setErrors(nextErrors);
            setGeneralError(gen);
            return;
        }
        setErrors({});
        setGeneralError("");

        setSubmitting(true);
        try {
            await OrderService.addOrder({
                orderItems: [
                    {
                        commissionId: commission.commissionId,
                        quantity,
                        orderDescription: orderDescription.trim() || undefined,
                        attachedImages: attachedPaths.length > 0 ? attachedPaths : undefined,
                    },
                ],
            });
            toast.success("Order placed.");
            onSuccess?.();
            onHide();
            navigate("/orders");
        } catch {
            /* toast */
        } finally {
            setSubmitting(false);
        }
    };

    const handleModalHide = () => {
        if (submitting || uploading) return;
        onHide();
    };

    return {
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
    };
}
