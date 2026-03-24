import { useCallback, useEffect, useState } from "react";
import { useAuthContext } from "../contexts/AuthContext";
import { useLoginPrompt } from "../contexts/LoginPromptContext";
import CommentService from "../services/CommentService";

/**
 * Comment list + post / reply / delete cho một work.
 */
export function useWorkComments(workId) {
    const { openLoginPrompt } = useLoginPrompt();
    const { isAuthenticated, user } = useAuthContext();

    const [comments, setComments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [text, setText] = useState("");
    const [replyText, setReplyText] = useState("");
    const [replyingToId, setReplyingToId] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [editText, setEditText] = useState("");

    const loadComments = useCallback(async () => {
        if (workId == null) return;
        setLoading(true);
        try {
            const res = await CommentService.getByWork(workId);
            setComments(Array.isArray(res.data) ? res.data : []);
        } catch {
            setComments([]);
        } finally {
            setLoading(false);
        }
    }, [workId]);

    useEffect(() => {
        loadComments();
    }, [loadComments]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        const body = text.trim();
        if (!body || workId == null) return;
        if (!isAuthenticated) {
            openLoginPrompt();
            return;
        }
        setSubmitting(true);
        try {
            await CommentService.add({
                workId: Number(workId),
                commentContent: body,
            });
            setText("");
            await loadComments();
        } finally {
            setSubmitting(false);
        }
    };

    const handleReplySubmit = async (e, parentCommentId) => {
        e.preventDefault();
        const body = replyText.trim();
        if (!body || workId == null || parentCommentId == null) return;
        if (!isAuthenticated) {
            openLoginPrompt();
            return;
        }
        setSubmitting(true);
        try {
            await CommentService.add({
                workId: Number(workId),
                commentContent: body,
                replyToId: parentCommentId,
            });
            setReplyText("");
            setReplyingToId(null);
            await loadComments();
        } finally {
            setSubmitting(false);
        }
    };

    const toggleReplyTo = (commentId) => {
        setReplyingToId((prev) => (prev === commentId ? null : commentId));
        setReplyText("");
    };

    const canEdit = (c) => {
        if (!user || !c) return false;
        if (user.role === "ADMIN") return true;
        if (user.userId == null || c.userId == null) return false;
        return Number(user.userId) === Number(c.userId);
    };

    const startEdit = (c) => {
        if (!canEdit(c)) return;
        setEditingId(c.commentId);
        setEditText(c.commentContent ?? "");
        setReplyingToId(null);
    };

    const cancelEdit = () => {
        setEditingId(null);
        setEditText("");
    };

    const handleEditSubmit = async (e, c) => {
        e.preventDefault();
        const body = editText.trim();
        if (!body || !c?.commentId || workId == null) return;
        setSubmitting(true);
        try {
            await CommentService.update(c.commentId, {
                workId: Number(workId),
                commentContent: body,
                replyToId: c.replyToId ?? null,
            });
            setEditingId(null);
            setEditText("");
            await loadComments();
        } finally {
            setSubmitting(false);
        }
    };

    const commentById = (id) => {
        if (id == null) return null;
        return comments.find((x) => Number(x.commentId) === Number(id)) ?? null;
    };

    const handleDelete = async (commentId) => {
        if (!window.confirm("Delete this comment?")) return;
        try {
            await CommentService.delete(commentId);
            await loadComments();
        } catch {
            /* toast từ axios */
        }
    };

    const canDelete = (c) => {
        if (!user) return false;
        if (user.role === "ADMIN") return true;
        if (user.userId == null || c.userId == null) return false;
        return Number(user.userId) === Number(c.userId);
    };

    const formatDate = (iso) => {
        if (!iso) return "";
        try {
            return new Date(iso).toLocaleString();
        } catch {
            return String(iso);
        }
    };

    return {
        comments,
        loading,
        text,
        setText,
        replyText,
        setReplyText,
        replyingToId,
        editingId,
        editText,
        setEditText,
        submitting,
        isAuthenticated,
        handleSubmit,
        handleReplySubmit,
        handleEditSubmit,
        toggleReplyTo,
        startEdit,
        cancelEdit,
        commentById,
        handleDelete,
        canEdit,
        canDelete,
        formatDate,
        openLoginPrompt,
    };
}
