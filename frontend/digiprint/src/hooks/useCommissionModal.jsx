import { useCallback, useEffect, useLayoutEffect, useReducer, useRef, useState } from "react";
import { toast } from "react-toastify";
import CommissionService from "../services/CommissionService";
import { useAuthContext } from "../contexts/AuthContext";
import { commissionModalInitialState, commissionModalReducer } from "../reducers/CommissionReducer";
import {
    newAttachmentId,
    previewKindFromFile,
    revokeAttachmentPreviews,
} from "../utils/commissionModalUtils";

/**
 * Logic state + handlers cho CommissionModal (load commission, form reducer, submit, samples).
 *
 * @param {{
 *   show: boolean,
 *   onHide: () => void,
 *   mode: "add" | "edit" | "view" | null,
 *   commissionId: number | null,
 *   targetUserId: number | null,
 *   onSuccess: () => void,
 * }} params
 */
export function useCommissionModal({ show, onHide, mode, commissionId: idParam, targetUserId, onSuccess }) {
    const { user } = useAuthContext();
    const commissionId = idParam != null ? parseInt(String(idParam), 10) : NaN;

    const [loading, setLoading] = useState(false);
    const [loadError, setLoadError] = useState(null);
    const [commission, setCommission] = useState(null);
    const [modalForm, dispatchModal] = useReducer(commissionModalReducer, commissionModalInitialState);
    const [submitting, setSubmitting] = useState(false);
    const previewAnchorRef = useRef(null);

    const finishSuccess = useCallback(() => {
        onSuccess?.();
        onHide();
    }, [onSuccess, onHide]);

    const canManageThis =
        commission &&
        user &&
        (user.role === "ADMIN" || Number(commission.userId) === Number(user.userId));

    useEffect(() => {
        if (!show || !mode) return;

        if (mode === "add") {
            setLoading(false);
            setCommission(null);
            dispatchModal({ type: "RESET" });
            setLoadError(null);
            return;
        }
        if (!Number.isFinite(commissionId)) {
            setLoadError("Invalid commission.");
            setLoading(false);
            return;
        }
        let cancelled = false;
        setLoading(true);
        setLoadError(null);
        CommissionService.getById(commissionId, { skipSuccessToast: true })
            .then((res) => {
                if (cancelled) return;
                const c = res.data;
                setCommission(c);
                if (mode === "edit" || mode === "view") {
                    dispatchModal({
                        type: "LOAD_DRAFT",
                        payload: {
                            commissionType: c.commissionType,
                            commissionPrice: c.commissionPrice,
                            commissionDescription: c.commissionDescription,
                            genre: c.genre,
                            attachedFiles: c.attachedFiles,
                        },
                    });
                }
            })
            .catch(() => {
                if (!cancelled) setLoadError("Could not load commission.");
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });
        return () => {
            cancelled = true;
        };
    }, [show, mode, commissionId]);

    useLayoutEffect(() => {
        if (modalForm.newFiles.length > 0) {
            previewAnchorRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
        }
    }, [modalForm.newFiles.length]);

    useEffect(() => {
        return () => revokeAttachmentPreviews(modalForm.newFiles);
    }, [modalForm.newFiles]);

    const handleField = (field, value) => {
        dispatchModal({ type: "FIELD_CHANGE", field, value });
    };

    const handleGenreChange = (e) => {
        const raw = e.target.value;
        const nextGenre = raw === "" ? null : raw;
        revokeAttachmentPreviews(modalForm.newFiles);
        dispatchModal({ type: "GENRE_CHANGE", genre: nextGenre });
    };

    const handleNewFiles = (e) => {
        const picked = e.target.files ? Array.from(e.target.files) : [];
        e.target.value = "";
        if (!picked.length) return;
        const batch = picked.map((file) => {
            const id = newAttachmentId();
            const previewUrl = URL.createObjectURL(file);
            const previewKind = previewKindFromFile(file);
            return { id, file, previewUrl, name: file.name, previewKind };
        });
        dispatchModal({ type: "ADD_NEW_FILES", payload: batch });
    };

    const removeNewFile = (id) => {
        const victim = modalForm.newFiles.find((a) => a.id === id);
        if (victim?.previewUrl?.startsWith("blob:")) {
            try {
                URL.revokeObjectURL(victim.previewUrl);
            } catch {
                /* ignore */
            }
        }
        dispatchModal({ type: "REMOVE_NEW_FILE", id });
    };

    const removeExistingPath = (path) => {
        dispatchModal({ type: "REMOVE_EXISTING_PATH", path });
    };

    const handlePriceChange = (e) => {
        const raw = e.target.value;
        if (raw === "") {
            dispatchModal({ type: "FIELD_CHANGE", field: "commissionPrice", value: "" });
            return;
        }
        const n = parseInt(raw.replace(/\D/g, ""), 10);
        dispatchModal({
            type: "FIELD_CHANGE",
            field: "commissionPrice",
            value: Number.isNaN(n) ? "" : String(n),
        });
    };

    const validateModalForm = () => {
        const errors = {};
        if (!modalForm.commissionType.trim()) {
            errors.commissionType = "Type is required.";
        }
        const price = parseInt(modalForm.commissionPrice, 10);
        if (modalForm.commissionPrice.trim() === "" || Number.isNaN(price)) {
            errors.commissionPrice = "Enter a valid integer price.";
        } else if (price < 0) {
            errors.commissionPrice = "Price must be 0 or greater.";
        }
        if (modalForm.genre == null) {
            errors.genre = "Please select a genre.";
        }
        let generalError = "";
        const uid = targetUserId ?? user?.userId;
        if (mode === "add" && uid == null) {
            generalError = "User profile is not loaded. Please try again.";
        }
        return { errors, generalError, price, uid };
    };

    const handleSubmitAdd = async (e) => {
        e.preventDefault();
        const { errors, generalError, price, uid } = validateModalForm();
        if (Object.keys(errors).length > 0 || generalError) {
            dispatchModal({ type: "SET_ERRORS", payload: { errors, generalError } });
            return;
        }
        dispatchModal({ type: "CLEAR_ERRORS" });

        setSubmitting(true);
        try {
            const body = {
                commissionType: modalForm.commissionType.trim(),
                commissionPrice: price,
                commissionDescription: modalForm.commissionDescription?.trim() ?? "",
                genre: modalForm.genre,
                userId: uid,
            };
            const res = await CommissionService.addCommission(body, { skipSuccessToast: true });
            const newId = res.data?.commissionId;
            if (newId == null) throw new Error("No commission id");

            for (const item of modalForm.newFiles) {
                if (item.file) {
                    await CommissionService.uploadCommissionAttachment(newId, item.file, modalForm.genre, {
                        skipSuccessToast: true,
                    });
                }
            }
            toast.success("Commission created.");
            revokeAttachmentPreviews(modalForm.newFiles);
            finishSuccess();
        } catch {
            /* toast from interceptor */
        } finally {
            setSubmitting(false);
        }
    };

    const handleSubmitEdit = async (e) => {
        e.preventDefault();
        if (!commission || !Number.isFinite(commissionId)) return;
        if (!canManageThis) return;
        const { errors, generalError, price } = validateModalForm();
        if (Object.keys(errors).length > 0 || generalError) {
            dispatchModal({ type: "SET_ERRORS", payload: { errors, generalError } });
            return;
        }
        dispatchModal({ type: "CLEAR_ERRORS" });

        setSubmitting(true);
        try {
            const uploadedPaths = [];
            for (const item of modalForm.newFiles) {
                if (item.file) {
                    const up = await CommissionService.uploadCommissionAttachment(
                        commissionId,
                        item.file,
                        modalForm.genre,
                        { skipSuccessToast: true }
                    );
                    const p = up.data?.path;
                    if (p) uploadedPaths.push(p);
                }
            }
            const attachedFiles = [...modalForm.existingPaths, ...uploadedPaths];
            await CommissionService.updateCommission(
                commissionId,
                {
                    commissionType: modalForm.commissionType.trim(),
                    commissionPrice: price,
                    commissionDescription: modalForm.commissionDescription?.trim() ?? "",
                    genre: modalForm.genre,
                    userId: commission.userId,
                    attachedFiles,
                },
                { skipSuccessToast: true }
            );
            toast.success("Commission updated.");
            revokeAttachmentPreviews(modalForm.newFiles);
            finishSuccess();
        } catch {
            /* interceptor */
        } finally {
            setSubmitting(false);
        }
    };

    const handleModalHide = () => {
        if (submitting) return;
        onHide();
    };

    const isEdit = mode === "edit";
    const formTitle = mode === "add" ? "New commission" : "Edit commission";

    return {
        loading,
        loadError,
        commission,
        modalForm,
        submitting,
        previewAnchorRef,
        commissionId,
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
    };
}
