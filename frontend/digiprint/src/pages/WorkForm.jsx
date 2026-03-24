import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { Container, Form, Button, Spinner } from "react-bootstrap";
import { useWork } from "../hooks/useWork";
import { useAuthContext } from "../contexts/AuthContext";
import ProfileService from "../services/ProfileService";
import { GENRE_FILE_TYPES } from "../constants/fileTypes";
import { getServerFileUrl } from "../utils/fileUtils";
import { useEffect, useMemo, useState } from "react";
import TagInputWithAutocomplete from "../components/TagInputWithAutocomplete";

function WorkForm() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { user, mergeUser, isAuthenticated, canManageWorks } = useAuthContext();

    const workHook = useWork();
    const { state, handleFieldChange, handleTagChange, getWorkById, saveWork } = workHook;

    const isUpdateMode = !!id;
    const [loadingWork, setLoadingWork] = useState(isUpdateMode);

    useEffect(() => {
        if (!id) {
            setLoadingWork(false);
            return;
        }

        let cancelled = false;
        setLoadingWork(true);

        (async () => {
            await getWorkById(id);
            if (!cancelled) {
                setLoadingWork(false);
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [id, getWorkById]);

    useEffect(() => {
        if (!isAuthenticated || !user || user.userId != null) {
            return;
        }
        let cancelled = false;
        ProfileService.getMyProfile()
            .then((res) => {
                if (cancelled) return;
                const d = res.data;
                mergeUser({
                    userId: d?.userId,
                    accountId: d?.accountId,
                    username: d?.username,
                    role: d?.role,
                });
            })
            .catch(() => {});
        return () => {
            cancelled = true;
        };
    }, [isAuthenticated, user, mergeUser]);

    const workLoaded = isUpdateMode && state.work?.workId != null;
    const sameAccount =
        user?.accountId != null &&
        state.work?.creatorAccountId != null &&
        Number(user.accountId) === Number(state.work.creatorAccountId);
    const sameUserId =
        user?.userId != null &&
        state.work?.creatorUserId != null &&
        Number(user.userId) === Number(state.work.creatorUserId);
    const sameProfileName =
        state.work?.creator &&
        user?.username &&
        state.work.creator === user.username;
    const isOwnerOrAdmin =
        user?.role === "ADMIN" ||
        sameAccount ||
        sameUserId ||
        sameProfileName;
    const showUnauthorized =
        isUpdateMode &&
        !loadingWork &&
        workLoaded &&
        !isOwnerOrAdmin;

    /** Role USER không được add/update work (kể cả khi vượt route). */
    const showUnauthorizedRole = isAuthenticated && !canManageWorks;
    const adminTagOnlyMode =
        isUpdateMode &&
        user?.role === "ADMIN" &&
        searchParams.get("adminEditTags") === "1";

    const handleGenreChange = (genre) => {
        handleFieldChange("file", null);
        handleFieldChange("genre", genre);
    };

    const handleRatingChange = (rating) => {
        handleFieldChange("rating", rating);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const ok = await saveWork(state.work);
        if (ok) {
            navigate("/home");
        }
    };

    const previewSource = useMemo(() => {
        if (state.work.file instanceof File) {
            return URL.createObjectURL(state.work.file);
        }
        return getServerFileUrl(state.work.workSource);
    }, [state.work.file, state.work.workSource]);

    const unauthorizedView = (
        <Container className="d-flex flex-column align-items-center justify-content-center min-vh-100">
            <p className="mb-4 text-center">
                {showUnauthorizedRole
                    ? "Only artist accounts can add or edit works."
                    : "You are not authorized to access this work."}
            </p>
            <Button variant="primary" onClick={() => navigate("/home")}>
                Go to Home
            </Button>
        </Container>
    );

    const formView = (
        <Container>
            <h2 className = "mb-4 text-center">
                {id ? (adminTagOnlyMode ? "Update work tags" : "Update work") : "Add work"}
            </h2>

            <Form onSubmit = {handleSubmit}>
                <Form.Group className = "mb-4">
                    <div className = "d-flex align-items-center">
                        <Form.Label className = "me-3 mb-0">Genre</Form.Label>

                        <Form.Check
                            inline
                            type = "radio"
                            label = "Art"
                            name = "genre"
                            checked = {state.work.genre === "ART"}
                            disabled={adminTagOnlyMode}
                            onChange = {() => handleGenreChange("ART")}
                        />

                        <Form.Check
                            inline
                            type = "radio"
                            label = "Music"
                            name = "genre"
                            checked = {state.work.genre === "MUSIC"}
                            disabled={adminTagOnlyMode}
                            onChange = {() => handleGenreChange("MUSIC")}
                        />

                        <Form.Check
                            inline
                            type = "radio"
                            label = "Literature"
                            name = "genre"
                            checked = {state.work.genre === "LITERATURE"}
                            disabled={adminTagOnlyMode}
                            onChange = {() => handleGenreChange("LITERATURE")}
                        />
                    </div>

                    {state.errors.genre && (
                        <div className = "text-danger mt-1">
                            {state.errors.genre}
                        </div>
                    )}
                </Form.Group>

                <Form.Group className="mb-3">
                    <Form.Control
                        key = {state.work.genre}
                        type = "file"
                        disabled = {!state.work.genre || adminTagOnlyMode}
                        accept = {GENRE_FILE_TYPES[state.work.genre] ?? ""}
                        onChange={ (e) => handleFieldChange("file", e.target.files[0]) }
                        isInvalid = {!!state.errors.file}
                    />
                    <Form.Control.Feedback type="invalid">
                        {state.errors.file}
                    </Form.Control.Feedback>
                </Form.Group>

                {previewSource && (
                    <div className = "mb-3 d-flex justify-content-center">
                        {state.work.genre === "ART" && (
                            <img 
                                src = {previewSource}
                                style = {{ maxWidth: "300px" }}
                            />
                        )}

                        {state.work.genre === "MUSIC" && (
                            <video 
                                controls
                                src = {previewSource}
                                style = {{ maxWidth: "400px" }}
                            />
                        )}

                        {state.work.genre === "LITERATURE" && (
                            <iframe
                                src = {previewSource}
                                width = "100%"
                                height = "300"
                            />
                        )}
                    </div>
                )}

                <Form.Group className = "mb-3">
                    <Form.Label>Title</Form.Label>
                    <Form.Control
                        type = "text"
                        value = {state.work.workTitle || ""}
                        disabled={adminTagOnlyMode}
                        onChange = { (e) => handleFieldChange("workTitle", e.target.value) }
                        isInvalid = {!!state.errors.workTitle} />
                    <Form.Control.Feedback type = "invalid">
                        {state.errors.workTitle}
                    </Form.Control.Feedback>
                </Form.Group>

                <Form.Group className = "mb-3">
                    <Form.Label>Description</Form.Label>
                    <Form.Control
                        as = "textarea"
                        rows = {4}
                        value = {state.work.workDescription || ""}
                        disabled={adminTagOnlyMode}
                        onChange = { (e) => handleFieldChange("workDescription", e.target.value) }
                        isInvalid = {!!state.errors.workDescription} />
                    <Form.Control.Feedback type = "invalid">
                        {state.errors.workDescription}
                    </Form.Control.Feedback>
                </Form.Group>

                <Form.Group className="mb-4">
                    <div className = "d-flex align-items-center">
                        <Form.Label className = "me-3 mb-0">Rating</Form.Label>

                        <Form.Check
                            inline
                            type = "radio"
                            label = "Safe"
                            name = "rating"
                            checked = {state.work.rating === "SAFE"}
                            disabled={adminTagOnlyMode}
                            onChange = {() => handleRatingChange("SAFE")}
                        />

                        <Form.Check
                            inline
                            type = "radio"
                            label = "Suggestive"
                            name = "rating"
                            checked={state.work.rating === "SUGGESTIVE"}
                            disabled={adminTagOnlyMode}
                            onChange = {() => handleRatingChange("SUGGESTIVE")}
                        />

                        <Form.Check
                            inline
                            type = "radio"
                            label = "NSFW"
                            name = "rating"
                            checked = {state.work.rating === "NSFW"}
                            disabled={adminTagOnlyMode}
                            onChange = {() => handleRatingChange("NSFW")}
                        />
                    </div>

                    {state.errors.rating && (
                        <div className = "text-danger mt-1">
                            {state.errors.rating}
                        </div>
                    )}
                </Form.Group>

                <Form.Group className="mb-3">
                    <Form.Label htmlFor="work-form-tags">Tags</Form.Label>
                    <TagInputWithAutocomplete
                        id="work-form-tags"
                        value={state.tagInput || ""}
                        onChange={handleTagChange}
                        genre={state.work.genre || null}
                        placeholder="Separate tags with spaces"
                    />
                </Form.Group>
                
                <div className = "d-flex justify-content-center">
                    <Button type = "submit">
                        Save
                    </Button>
                </div>
            </Form>
        </Container>
    );

    if (isUpdateMode && loadingWork) {
        return (
            <Container className="d-flex justify-content-center align-items-center py-5">
                <Spinner animation="border" role="status" />
            </Container>
        );
    }

    if (isUpdateMode && !loadingWork && !workLoaded) {
        return (
            <Container className="d-flex flex-column align-items-center justify-content-center min-vh-100">
                <p className="mb-4 text-center text-muted">
                    {state.generalError || state.errors?.general || "Could not load this work."}
                </p>
                <Button variant="primary" onClick={() => navigate("/home")}>
                    Go to Home
                </Button>
            </Container>
        );
    }

    return showUnauthorized || showUnauthorizedRole ? unauthorizedView : formView;
}

export default WorkForm;