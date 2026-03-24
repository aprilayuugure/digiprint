import { Container, Row, Col, Form, Button, Image, Spinner } from "react-bootstrap";
import { useRef, useEffect, useState } from "react";
import { useLocation, useParams, Navigate } from "react-router-dom";
import { FaUserPlus, FaUserCheck } from "react-icons/fa";
import "../css/profile.css";
import { useProfile } from "../hooks/useProfile";
import { getPreviewSource } from "../utils/fileUtils";
import ProfileService from "../services/ProfileService";
import FollowService from "../services/FollowService";
import { useAuthContext } from "../contexts/AuthContext";

/**
 * Route `/profiles/:username` chỉ là form profile, không có sidebar (Commissions…).
 * Redirect sang `/artist/:username` (cùng tab Profile trong layout Artist).
 * Tab Profile bên `/me` hoặc `/artist/:u` dùng `ProfileForm` trực tiếp — không qua redirect.
 */
function Profile() {
    const location = useLocation();
    const { username } = useParams();
    if (location.pathname.startsWith("/profiles/") && username) {
        return <Navigate to={`/artist/${encodeURIComponent(username)}`} replace />;
    }
    return <ProfileForm />;
}

function ProfileForm() {
    const profileHook = useProfile();
    const { state, handleFieldChange, getMyProfile, updateMyProfile } = profileHook;
    const { isAuthenticated, user } = useAuthContext();
    const { username } = useParams();
    const location = useLocation();
    const isMeRoute = location.pathname === "/me";
    const canEdit = isMeRoute;

    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [viewProfile, setViewProfile] = useState(null);
    const [followerCount, setFollowerCount] = useState(0);
    const [isFollowing, setIsFollowing] = useState(false);
    const [followBusy, setFollowBusy] = useState(false);
    const avatarInputRef = useRef(null);
    const backgroundInputRef = useRef(null);

    useEffect(() => {
        const run = async () => {
            setLoading(true);
            setIsEditing(false);
            if (isMeRoute) {
                await getMyProfile();
                setViewProfile(null);
            } else if (username) {
                try {
                    const res = await ProfileService.getProfileByUsername(username);
                    setViewProfile(res.data);
                } catch {
                    setViewProfile(null);
                }
            }
            setLoading(false);
        };
        run();
    }, [isMeRoute, username]);

    useEffect(() => {
        const profile = canEdit ? state.profile : viewProfile;
        const artistId = profile?.userId;
        const isArtistProfile = profile?.role === "ARTIST";
        if (!artistId || !isArtistProfile) {
            setFollowerCount(0);
            setIsFollowing(false);
            return;
        }

        let cancelled = false;
        (async () => {
            try {
                const followersRes = await FollowService.getFollowers(artistId);
                if (!cancelled) {
                    const list = Array.isArray(followersRes.data) ? followersRes.data : [];
                    setFollowerCount(list.length);
                }

                if (isAuthenticated && user?.userId && Number(user.userId) !== Number(artistId)) {
                    const myFollowingRes = await FollowService.getMyFollowing();
                    if (!cancelled) {
                        const followingList = Array.isArray(myFollowingRes.data)
                            ? myFollowingRes.data
                            : [];
                        setIsFollowing(
                            followingList.some((f) => Number(f.artistId) === Number(artistId))
                        );
                    }
                } else if (!cancelled) {
                    setIsFollowing(false);
                }
            } catch {
                if (!cancelled) {
                    setFollowerCount(0);
                    setIsFollowing(false);
                }
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [canEdit, state.profile, viewProfile, isAuthenticated, user?.userId]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!canEdit) return;

        const success = await updateMyProfile(state.profile);

        if (success) 
        {
            setIsEditing(false);

            await getMyProfile();
        }
    };

    const profile = canEdit ? state.profile : viewProfile;
    const errors = canEdit ? state.errors : {};
    const showFollowSection = profile?.role === "ARTIST";
    const canToggleFollow =
        showFollowSection &&
        isAuthenticated &&
        profile?.userId != null &&
        user?.userId != null &&
        Number(user.userId) !== Number(profile.userId);

    const toggleFollow = async () => {
        if (!canToggleFollow || followBusy) return;
        setFollowBusy(true);
        try {
            if (isFollowing) {
                await FollowService.unfollow(profile.userId);
                setIsFollowing(false);
                setFollowerCount((v) => Math.max(0, v - 1));
            } else {
                await FollowService.follow(profile.userId);
                setIsFollowing(true);
                setFollowerCount((v) => v + 1);
            }
        } finally {
            setFollowBusy(false);
        }
    };

    return (
        <Container className = "mt-4">
            {loading ? (
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
            ) : (
            <Form onSubmit = {handleSubmit}>
                <div className = "profile-header">
                    <Image
                        src = {getPreviewSource(profile?.backgroundImage, "/images/no_background.jpg")}
                            className = "background-image"
                            style = {{ cursor: canEdit && isEditing ? "pointer" : "default" }}
                            onClick = {() => canEdit && isEditing && backgroundInputRef.current.click()}
                    />

                    {canEdit && isEditing && (
                        <input
                            ref = {backgroundInputRef}
                            type = "file"
                            accept = "image/*"
                            hidden
                            onChange = {(e) => handleFieldChange("backgroundImage", e.target.files[0]) } />
                        )}

                    <Image
                        src = {getPreviewSource(profile?.image, "/images/no_avatar.jpg")}
                            roundedCircle
                            className = "profile-avatar"
                            style = {{ cursor: canEdit && isEditing ? "pointer" : "default" }}
                            onClick = {() => canEdit && isEditing && avatarInputRef.current.click()}
                        />

                        {canEdit && isEditing && (
                            <input
                                ref = {avatarInputRef}
                                type = "file"
                                accept = "image/*"
                                hidden
                                onChange = {(e) => handleFieldChange("image", e.target.files[0]) } />
                        )}
                </div>
                {showFollowSection && (
                    <div className="d-flex justify-content-center mt-2 mb-3">
                        <div className="d-flex align-items-center gap-2">
                            {canToggleFollow ? (
                                <button
                                    type="button"
                                    className="btn btn-link p-0 text-decoration-none d-inline-flex align-items-center gap-1"
                                    style={{ color: "#212529" }}
                                    disabled={followBusy}
                                    onClick={toggleFollow}
                                    aria-label={isFollowing ? "Unfollow artist" : "Follow artist"}
                                >
                                    {isFollowing ? <FaUserCheck /> : <FaUserPlus />}
                                    <span>{isFollowing ? "Following" : "Follow"}</span>
                                </button>
                            ) : (
                                <span className="d-inline-flex align-items-center gap-1 text-dark">
                                    <FaUserPlus />
                                    <span>Follow</span>
                                </span>
                            )}
                            <span className="text-muted">•</span>
                            <span className="text-dark">{followerCount} followers</span>
                        </div>
                    </div>
                )}

                <Row className = "mb-3">
                    <Col>
                        <Form.Group>
                            <Form.Label>First Name</Form.Label>
                            <Form.Control
                                type = "text"
                                value = {profile?.firstName || ""}
                                readOnly = {!canEdit || !isEditing}
                                onChange = {(e) => canEdit && handleFieldChange("firstName", e.target.value) }
                                isInvalid = {!!errors.firstName} />
                            <Form.Control.Feedback type = "invalid">
                                {errors.firstName}
                            </Form.Control.Feedback>
                        </Form.Group>
                    </Col>

                    <Col>
                        <Form.Group>
                            <Form.Label>Last Name</Form.Label>
                            <Form.Control
                                type = "text"
                                value = {profile?.lastName || ""}
                                readOnly = {!canEdit || !isEditing}
                                onChange = {(e) => canEdit && handleFieldChange("lastName", e.target.value) }
                                isInvalid = {!!errors.lastName} />
                            <Form.Control.Feedback type = "invalid">
                                {errors.lastName}
                            </Form.Control.Feedback>
                        </Form.Group>
                    </Col>
                </Row>

                <Row className = "mb-3">
                    <Col>
                        <Form.Group>
                            <Form.Label>Date of Birth</Form.Label>
                            <Form.Control
                                type = "date"
                                value = {profile?.dateOfBirth || ""}
                                readOnly = {!canEdit || !isEditing}
                                onChange = {(e) => canEdit && handleFieldChange("dateOfBirth", e.target.value) }
                                isInvalid = {!!errors.dateOfBirth} />
                            <Form.Control.Feedback type = "invalid">
                                {errors.dateOfBirth}
                            </Form.Control.Feedback>
                        </Form.Group>
                    </Col>

                    <Col>
                        <Form.Group>
                            <Form.Label>Gender</Form.Label>
                            <Form.Select
                                value = {profile?.gender || ""}
                                disabled = {!canEdit || !isEditing}
                                onChange = {(e) => canEdit && handleFieldChange("gender", e.target.value)}
                                isInvalid = {!!errors.gender}>
                                <option value = "">Select Gender</option>
                                <option value = "MALE">Male</option>
                                <option value = "FEMALE">Female</option>
                                <option value = "OTHER">Other</option>
                            </Form.Select>
                            <Form.Control.Feedback type = "invalid">
                                {errors.gender}
                            </Form.Control.Feedback>
                        </Form.Group>
                    </Col>
                </Row>

                <Row className = "mb-3">
                    <Col>
                        <Form.Group>
                            <Form.Label>Location</Form.Label>
                            <Form.Control
                                type = "text"
                                value = {profile?.location || ""}
                                readOnly = {!canEdit || !isEditing}
                                onChange = {(e) => canEdit && handleFieldChange("location", e.target.value) } />
                        </Form.Group>
                    </Col>
                </Row>

                <Row className = "mb-3">
                    <Col>
                        <Form.Group>
                            <Form.Label>Biography</Form.Label>
                            <Form.Control
                                as = "textarea"
                                rows = {3}
                                value = {profile?.biography || ""}
                                readOnly = {!canEdit || !isEditing}
                                onChange = {(e) => canEdit && handleFieldChange("biography", e.target.value) } />
                        </Form.Group>
                    </Col>
                </Row>

                {canEdit && (
                    <Row className = "justify-content-center mb-3">
                        <Col xs = "auto">
                            <Button
                                variant = "primary"
                                onClick = {() => setIsEditing(true)}
                                hidden = {isEditing}
                            >
                                Update
                            </Button>

                            <Button
                                type = "submit"
                                variant = "success"
                                hidden = {!isEditing}
                            >
                                Save
                            </Button>
                        </Col>
                    </Row>
                )}
            </Form>
            )}
        </Container>
    );
}

export default Profile;