import { useState, useEffect } from "react";
import {
    Container,
    Row,
    Col,
    Card,
    Button,
    Form,
    Modal,
    InputGroup,
    Spinner,
} from "react-bootstrap";
import { Link, Navigate } from "react-router-dom";
import { useAuthContext } from "../contexts/AuthContext";
import ProfileService from "../services/ProfileService";
import { useAccountApplyArtist } from "../hooks/useAccountApplyArtist";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import "../css/account.css";

function Account() {
    const { user, isAuthenticated, mergeUser } = useAuthContext();
    const role = user?.role ?? "—";
    const {
        applyModal,
        applyReason,
        setApplyReason,
        applySubmitting,
        latestApplication,
        applicationLoading,
        openApplyModal,
        closeApplyModal,
        submitApplyArtist,
    } = useAccountApplyArtist(isAuthenticated, role);

    const [usernameDraft, setUsernameDraft] = useState("");
    const [usernameSaving, setUsernameSaving] = useState(false);
    const [usernameEditOpen, setUsernameEditOpen] = useState(false);

    const [pwdModal, setPwdModal] = useState(false);
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [pwdSaving, setPwdSaving] = useState(false);
    const [showCurrent, setShowCurrent] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    useEffect(() => {
        setUsernameDraft(user?.username ?? "");
    }, [user?.username]);

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    const email = user?.email ?? "—";
    const isUserRole = role === "USER";

    const openPwdModal = () => {
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setShowCurrent(false);
        setShowNew(false);
        setShowConfirm(false);
        setPwdModal(true);
    };

    const closePwdModal = () => {
        if (!pwdSaving) setPwdModal(false);
    };

    const handleSaveUsername = async (e) => {
        e.preventDefault();
        const next = usernameDraft.trim();
        if (!next || next === user?.username) return;

        setUsernameSaving(true);
        try {
            const res = await ProfileService.updateUsername(next);
            mergeUser({ username: res.data.username });
            setUsernameEditOpen(false);
        } catch {
            /* toast from axios */
        } finally {
            setUsernameSaving(false);
        }
    };

    const openUsernameEdit = () => {
        setUsernameDraft(user?.username ?? "");
        setUsernameEditOpen(true);
    };

    const cancelUsernameEdit = () => {
        setUsernameDraft(user?.username ?? "");
        setUsernameEditOpen(false);
    };

    const handleChangePassword = async (e) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) return;

        setPwdSaving(true);
        try {
            await ProfileService.changePassword({
                currentPassword,
                newPassword,
                confirmNewPassword: confirmPassword,
            });
            setPwdModal(false);
            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");
        } catch {
            /* toast from axios */
        } finally {
            setPwdSaving(false);
        }
    };

    const pwdMismatch = confirmPassword.length > 0 && newPassword !== confirmPassword;

    return (
        <Container className="py-4 account-page">
            <h1 className="h3 account-page-title">Account</h1>
            <p className="text-muted small mb-4">
                Login details and role. Edit your public profile under{" "}
                <Link to="/me">Profile</Link>.
            </p>

            <Row className="g-3">
                <Col xs={12}>
                    <Card className="account-card border-0 shadow-sm">
                        <Card.Body className="py-3 px-4">
                            <div className="account-card-label">Username</div>
                            {!usernameEditOpen ? (
                                <div className="account-row-inline mt-2">
                                    <span className="account-card-value account-row-value">
                                        {user?.username ?? "—"}
                                    </span>
                                    <Button variant="outline-primary" size="sm" onClick={openUsernameEdit}>
                                        Change username
                                    </Button>
                                </div>
                            ) : (
                                <Form onSubmit={handleSaveUsername} className="mt-2">
                                    <Form.Group className="mb-2">
                                        <Form.Control
                                            as="text"
                                            value={usernameDraft}
                                            onChange={(ev) => setUsernameDraft(ev.target.value)}
                                            autoComplete="username"
                                            disabled={usernameSaving}
                                            placeholder="New username"
                                            className="account-edit"
                                        />
                                    </Form.Group>
                                    <div className="d-flex flex-wrap gap-2">
                                        <Button
                                            type="submit"
                                            variant="primary"
                                            size="sm"
                                            disabled={
                                                usernameSaving ||
                                                !usernameDraft.trim() ||
                                                usernameDraft.trim() === user?.username
                                            }
                                        >
                                            {usernameSaving ? (
                                                <>
                                                    <Spinner animation="border" size="sm" className="me-1" />
                                                    Saving
                                                </>
                                            ) : (
                                                "Save"
                                            )}
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="outline-secondary"
                                            size="sm"
                                            onClick={cancelUsernameEdit}
                                            disabled={usernameSaving}
                                        >
                                            Cancel
                                        </Button>
                                    </div>
                                </Form>
                            )}
                        </Card.Body>
                    </Card>
                </Col>

                <Col xs={12}>
                    <Card className="account-card border-0 shadow-sm">
                        <Card.Body className="py-3 px-4">
                            <div className="account-card-label">Email</div>
                            <p className="account-card-value mb-0 mt-2">{email}</p>
                        </Card.Body>
                    </Card>
                </Col>

                <Col xs={12}>
                    <Card className="account-card border-0 shadow-sm">
                        <Card.Body className="py-3 px-4">
                            <div className="account-card-label">Password</div>
                            <div className="account-row-inline account-password-row mt-2">
                                <InputGroup className="account-password-mask flex-grow-1 min-width-0">
                                    <Form.Control
                                        readOnly
                                        type="password"
                                        value="••••••••"
                                        className="account-fake-password-input"
                                        aria-label="Password hidden"
                                    />
                                </InputGroup>
                                <Button variant="outline-primary" size="sm" onClick={openPwdModal}>
                                    Change password
                                </Button>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>

                <Col xs={12}>
                    <Card className="account-card border-0 shadow-sm">
                        <Card.Body className="py-3 px-4">
                            <div className="account-card-label">Role</div>
                            <div className="mt-2 d-flex flex-wrap align-items-center gap-2">
                                <span className="account-role-badge">{role}</span>
                                {isUserRole && (
                                    <>
                                        {applicationLoading ? (
                                            <Spinner animation="border" size="sm" />
                                        ) : latestApplication?.status === "PENDING" ? (
                                            <span className="text-muted small">
                                                Artist application pending review.
                                            </span>
                                        ) : (
                                            <Button
                                                variant="primary"
                                                size="sm"
                                                onClick={openApplyModal}
                                            >
                                                Apply to be artist
                                            </Button>
                                        )}
                                    </>
                                )}
                            </div>
                            {isUserRole &&
                                latestApplication &&
                                latestApplication.status === "REJECTED" && (
                                    <p className="small text-muted mb-0 mt-2">
                                        Your previous application was rejected. You can submit a new one.
                                    </p>
                                )}
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            <Modal
                show={applyModal}
                onHide={closeApplyModal}
                centered
                backdrop={applySubmitting ? "static" : true}
            >
                <Modal.Header closeButton={!applySubmitting}>
                    <Modal.Title>Apply to be an artist</Modal.Title>
                </Modal.Header>
                <Form onSubmit={submitApplyArtist}>
                    <Modal.Body>
                        <p className="small text-muted">
                            Tell us why you want to become an artist. An admin will review your request.
                        </p>
                        <Form.Group>
                            <Form.Label>Reason</Form.Label>
                            <Form.Control
                                as="textarea"
                                rows={4}
                                value={applyReason}
                                onChange={(ev) => setApplyReason(ev.target.value)}
                                placeholder="Describe your experience, portfolio, or motivation…"
                                required
                                disabled={applySubmitting}
                            />
                        </Form.Group>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={closeApplyModal} disabled={applySubmitting}>
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            variant="primary"
                            disabled={applySubmitting || !applyReason.trim()}
                        >
                            {applySubmitting ? (
                                <>
                                    <Spinner animation="border" size="sm" className="me-1" />
                                    Sending…
                                </>
                            ) : (
                                "Submit application"
                            )}
                        </Button>
                    </Modal.Footer>
                </Form>
            </Modal>

            <Modal
                show={pwdModal}
                onHide={closePwdModal}
                centered
                backdrop={pwdSaving ? "static" : true}
                backdropClassName="account-password-backdrop"
                dialogClassName="account-password-modal-dialog"
            >
                <Modal.Header closeButton={!pwdSaving}>
                    <Modal.Title>Change password</Modal.Title>
                </Modal.Header>
                <Form onSubmit={handleChangePassword}>
                    <Modal.Body>
                        <Form.Group className="mb-3">
                            <Form.Label>Current password</Form.Label>
                            <InputGroup>
                                <Form.Control
                                    type={showCurrent ? "text" : "password"}
                                    value={currentPassword}
                                    onChange={(e) => setCurrentPassword(e.target.value)}
                                    autoComplete="current-password"
                                    disabled={pwdSaving}
                                    required
                                />
                                <Button
                                    type="button"
                                    variant="outline-secondary"
                                    className="account-eye-btn"
                                    onClick={() => setShowCurrent((v) => !v)}
                                    tabIndex={-1}
                                    aria-label={showCurrent ? "Hide" : "Show"}
                                >
                                    {showCurrent ? <FaEyeSlash /> : <FaEye />}
                                </Button>
                            </InputGroup>
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>New password</Form.Label>
                            <InputGroup>
                                <Form.Control
                                    type={showNew ? "text" : "password"}
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    autoComplete="new-password"
                                    disabled={pwdSaving}
                                    required
                                />
                                <Button
                                    type="button"
                                    variant="outline-secondary"
                                    className="account-eye-btn"
                                    onClick={() => setShowNew((v) => !v)}
                                    tabIndex={-1}
                                    aria-label={showNew ? "Hide" : "Show"}
                                >
                                    {showNew ? <FaEyeSlash /> : <FaEye />}
                                </Button>
                            </InputGroup>
                        </Form.Group>
                        <Form.Group className="mb-0">
                            <Form.Label>Confirm new password</Form.Label>
                            <InputGroup>
                                <Form.Control
                                    type={showConfirm ? "text" : "password"}
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    autoComplete="new-password"
                                    disabled={pwdSaving}
                                    required
                                    isInvalid={pwdMismatch}
                                />
                                <Button
                                    type="button"
                                    variant="outline-secondary"
                                    className="account-eye-btn"
                                    onClick={() => setShowConfirm((v) => !v)}
                                    tabIndex={-1}
                                    aria-label={showConfirm ? "Hide" : "Show"}
                                >
                                    {showConfirm ? <FaEyeSlash /> : <FaEye />}
                                </Button>
                            </InputGroup>
                            {pwdMismatch && (
                                <Form.Text className="text-danger d-block mt-1">
                                    New passwords do not match.
                                </Form.Text>
                            )}
                        </Form.Group>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={closePwdModal} disabled={pwdSaving}>
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            variant="primary"
                            disabled={pwdSaving || pwdMismatch || !newPassword || !currentPassword}
                        >
                            {pwdSaving ? (
                                <>
                                    <Spinner animation="border" size="sm" className="me-1" />
                                    Saving…
                                </>
                            ) : (
                                "Save"
                            )}
                        </Button>
                    </Modal.Footer>
                </Form>
            </Modal>
        </Container>
    );
}

export default Account;
