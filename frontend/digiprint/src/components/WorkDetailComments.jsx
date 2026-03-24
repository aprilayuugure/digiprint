import { Button, Form, Image, Spinner } from "react-bootstrap";
import { getServerFileUrl } from "../utils/fileUtils";
import { FaTrash } from "react-icons/fa";
import { useWorkComments } from "../hooks/useWorkComments";
import "../css/work-detail-comments.css";

function WorkDetailComments({ workId }) {
    const {
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
    } = useWorkComments(workId);

    return (
        <div className="work-detail-comments mt-4 pt-3 border-top">
            <div className="fw-semibold mb-3">Comments</div>

            {loading ? (
                <div className="text-muted py-2 d-flex align-items-center gap-2">
                    <Spinner animation="border" size="sm" />
                    Loading comments…
                </div>
            ) : (
                <ul className="list-unstyled mb-3 work-detail-comments-list">
                    {comments.length === 0 ? (
                        <li className="text-muted small">No comments yet.</li>
                    ) : (
                        comments.map((c) => {
                            const parent = c.replyToId ? commentById(c.replyToId) : null;
                            return (
                                <li
                                    key={c.commentId}
                                    className={
                                        "work-detail-comments-item mb-3 " +
                                        (c.replyToId ? "work-detail-comments-item--reply" : "")
                                    }
                                >
                                    <div className="d-flex gap-2">
                                        <Image
                                            src={getServerFileUrl(c.userAvatar, "/images/no_avatar.jpg")}
                                            roundedCircle
                                            width={36}
                                            height={36}
                                            className="flex-shrink-0"
                                        />
                                        <div className="flex-grow-1 min-w-0">
                                            {parent && (
                                                <div className="text-muted small mb-1">
                                                    Replying to{" "}
                                                    <span className="fw-semibold text-body">
                                                        {parent.username || "User"}
                                                    </span>
                                                </div>
                                            )}
                                            <div className="d-flex align-items-center justify-content-between gap-2 flex-wrap">
                                                <span className="fw-semibold small">{c.username || "User"}</span>
                                                <span className="text-muted small">{formatDate(c.commentDate)}</span>
                                            </div>
                                            {editingId === c.commentId ? (
                                                <Form
                                                    className="work-detail-comments-edit-form mt-1"
                                                    onSubmit={(e) => handleEditSubmit(e, c)}
                                                >
                                                    <Form.Control
                                                        as="textarea"
                                                        rows={2}
                                                        value={editText}
                                                        maxLength={2000}
                                                        onChange={(e) => setEditText(e.target.value)}
                                                        disabled={submitting}
                                                        autoFocus
                                                    />
                                                    <div className="d-flex justify-content-end gap-2 mt-2">
                                                        <Button
                                                            type="button"
                                                            variant="outline-secondary"
                                                            size="sm"
                                                            disabled={submitting}
                                                            onClick={cancelEdit}
                                                        >
                                                            Cancel
                                                        </Button>
                                                        <Button
                                                            type="submit"
                                                            size="sm"
                                                            disabled={submitting || !editText.trim()}
                                                        >
                                                            {submitting ? "Saving…" : "Save"}
                                                        </Button>
                                                    </div>
                                                </Form>
                                            ) : (
                                                <>
                                                    <div className="small text-break mt-1">{c.commentContent}</div>
                                                    <div className="d-flex align-items-center justify-content-between gap-2 flex-wrap mt-1">
                                                        <div className="d-flex align-items-center gap-2">
                                                            {isAuthenticated && (
                                                                <button
                                                                    type="button"
                                                                    className="btn btn-link btn-sm text-secondary p-0"
                                                                    onClick={() => toggleReplyTo(c.commentId)}
                                                                    aria-expanded={replyingToId === c.commentId}
                                                                >
                                                                    {replyingToId === c.commentId ? "Cancel" : "Reply"}
                                                                </button>
                                                            )}
                                                        </div>
                                                        <div className="d-flex align-items-center gap-2">
                                                            {canEdit(c) && (
                                                                <button
                                                                    type="button"
                                                                    className="btn btn-link btn-sm text-primary p-0"
                                                                    onClick={() => startEdit(c)}
                                                                >
                                                                    Edit
                                                                </button>
                                                            )}
                                                            {canDelete(c) && (
                                                                <button
                                                                    type="button"
                                                                    className="btn btn-link btn-sm text-danger p-0 d-inline-flex align-items-center gap-1"
                                                                    onClick={() => handleDelete(c.commentId)}
                                                                    aria-label="Delete comment"
                                                                >
                                                                    <FaTrash size={12} />
                                                                    Delete
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                </>
                                            )}

                                            {isAuthenticated && replyingToId === c.commentId && (
                                                <Form
                                                    className="work-detail-comments-reply-form mt-2"
                                                    onSubmit={(e) => handleReplySubmit(e, c.commentId)}
                                                >
                                                    <Form.Control
                                                        as="textarea"
                                                        rows={2}
                                                        placeholder={`Reply to ${c.username || "user"}…`}
                                                        value={replyText}
                                                        maxLength={2000}
                                                        onChange={(e) => setReplyText(e.target.value)}
                                                        disabled={submitting}
                                                        autoFocus
                                                    />
                                                    <div className="d-flex gap-2 mt-2">
                                                        <Button
                                                            type="submit"
                                                            size="sm"
                                                            disabled={submitting || !replyText.trim()}
                                                        >
                                                            {submitting ? "Posting…" : "Post reply"}
                                                        </Button>
                                                        <Button
                                                            type="button"
                                                            variant="outline-secondary"
                                                            size="sm"
                                                            disabled={submitting}
                                                            onClick={() => {
                                                                toggleReplyTo(c.commentId);
                                                            }}
                                                        >
                                                            Cancel
                                                        </Button>
                                                    </div>
                                                </Form>
                                            )}
                                        </div>
                                    </div>
                                </li>
                            );
                        })
                    )}
                </ul>
            )}

            {isAuthenticated ? (
                <Form onSubmit={handleSubmit}>
                    <Form.Group className="mb-2">
                        <Form.Control
                            as="textarea"
                            rows={3}
                            placeholder="Write a comment…"
                            value={text}
                            maxLength={2000}
                            onChange={(e) => setText(e.target.value)}
                            disabled={submitting}
                        />
                    </Form.Group>
                    <Button type="submit" size="sm" disabled={submitting || !text.trim()}>
                        {submitting ? "Posting…" : "Post"}
                    </Button>
                </Form>
            ) : (
                <p className="text-muted small mb-0">
                    <Button
                        type="button"
                        variant="link"
                        className="p-0 align-baseline"
                        onClick={() => openLoginPrompt()}
                    >
                        Log in
                    </Button>{" "}
                    to leave a comment.
                </p>
            )}
        </div>
    );
}

export default WorkDetailComments;
