import { useMemo, useState, useCallback, useEffect, useRef } from "react";
import {
    Container,
    Form,
    Button,
    Card,
    Row,
    Col,
    Spinner,
    InputGroup,
    Alert,
} from "react-bootstrap";
import { Link, Navigate, useNavigate, useSearchParams, useParams, useLocation } from "react-router-dom";
import { useAuthContext } from "../contexts/AuthContext";
import OrderService from "../services/OrderService";
import ProfileService from "../services/ProfileService";
import CommissionService from "../services/CommissionService";
import UserService from "../services/UserService";
import { normalizeOrder, normalizeOrderStatus } from "../utils/orderNormalize";
import { GENRE_FILE_TYPES } from "../constants/fileTypes";

const emptyLine = () => ({
    commissionId: "",
    /** @type {string | null} */
    genre: null,
    quantity: 1,
    orderDescription: "",
    attachedImages: [],
});

function OrderForm() {
    const { isAuthenticated, user } = useAuthContext();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { orderId: editOrderIdParam } = useParams();
    const location = useLocation();
    const isEditMode = Boolean(
        editOrderIdParam && location.pathname.includes("/edit")
    );

    const [artistUsername, setArtistUsername] = useState("");
    /** @type {number | null} */
    const [artistUserId, setArtistUserId] = useState(null);
    /** @type {Array<{ commissionId: number, commissionType: string, commissionPrice: number, genre: string }>} */
    const [commissions, setCommissions] = useState([]);
    const [loadingCommissions, setLoadingCommissions] = useState(false);
    const [commissionsError, setCommissionsError] = useState("");
    const [artistSuggestions, setArtistSuggestions] = useState([]);
    const [searchingArtist, setSearchingArtist] = useState(false);

    const [lines, setLines] = useState([emptyLine()]);
    const [submitting, setSubmitting] = useState(false);
    const [uploadingIndex, setUploadingIndex] = useState(null);
    const [loadingEditOrder, setLoadingEditOrder] = useState(isEditMode);
    const [editLoadError, setEditLoadError] = useState(null);

    const loadCommissionsForArtist = useCallback(
        async (overrideUsername) => {
            const u =
                overrideUsername != null && overrideUsername !== undefined
                    ? String(overrideUsername).trim()
                    : artistUsername.trim();
            if (!u) {
                setCommissionsError("Enter an artist username.");
                return;
            }
            setLoadingCommissions(true);
            setCommissionsError("");
            setCommissions([]);
            setArtistUserId(null);
            try {
                const pr = await ProfileService.getProfileByUsername(u);
                const userId = pr.data?.userId;
                if (userId == null) {
                    setCommissionsError("Profile not found for this username.");
                    return;
                }
                setArtistUserId(userId);
                const cr = await CommissionService.getByUser(userId);
                const list = cr.data ?? [];
                setCommissions(Array.isArray(list) ? list : []);
                if (list.length === 0) {
                    setCommissionsError("This artist has no commissions yet.");
                }
            } catch {
                setCommissionsError("Could not load artist or commissions.");
            } finally {
                setLoadingCommissions(false);
            }
        },
        [artistUsername]
    );

    const loadCommissionsRef = useRef(loadCommissionsForArtist);
    loadCommissionsRef.current = loadCommissionsForArtist;

    const artistFromQuery = searchParams.get("artist")?.trim() ?? "";

    useEffect(() => {
        if (!isAuthenticated || !artistFromQuery || isEditMode) return;
        setArtistUsername(artistFromQuery);
        loadCommissionsRef.current(artistFromQuery);
    }, [isAuthenticated, artistFromQuery, isEditMode]);

    useEffect(() => {
        if (isEditMode || artistFromQuery) return;
        const q = artistUsername.trim();
        if (!q) {
            setArtistSuggestions([]);
            setSearchingArtist(false);
            return;
        }
        let cancelled = false;
        const t = setTimeout(async () => {
            setSearchingArtist(true);
            try {
                const res = await UserService.searchCreators(q);
                if (cancelled) return;
                const list = Array.isArray(res.data) ? res.data : [];
                setArtistSuggestions(list.map((u) => u.username).filter(Boolean));
            } catch {
                if (!cancelled) setArtistSuggestions([]);
            } finally {
                if (!cancelled) setSearchingArtist(false);
            }
        }, 300);
        return () => {
            cancelled = true;
            clearTimeout(t);
        };
    }, [artistUsername, isEditMode, artistFromQuery]);

    useEffect(() => {
        if (!isAuthenticated || !isEditMode || !editOrderIdParam) return;
        let cancelled = false;
        const oid = parseInt(editOrderIdParam, 10);
        if (Number.isNaN(oid)) {
            setEditLoadError("Invalid order id.");
            setLoadingEditOrder(false);
            return undefined;
        }
        setLoadingEditOrder(true);
        setEditLoadError(null);
        (async () => {
            try {
                const res = await OrderService.getOrderById(oid);
                const o = normalizeOrder(res.data);
                if (cancelled) return;
                if (normalizeOrderStatus(o.orderStatus) !== "DRAFT") {
                    setEditLoadError("This order is not in draft. You can only edit from My orders → Update.");
                    return;
                }
                const accOk =
                    (user?.accountId != null &&
                        o.customerAccountId != null &&
                        Number(user.accountId) === Number(o.customerAccountId)) ||
                    (user?.username &&
                        o.customerUsername &&
                        String(user.username).toLowerCase() ===
                            String(o.customerUsername).toLowerCase());
                if (!accOk) {
                    setEditLoadError("You cannot edit this order.");
                    return;
                }
                const items = o.orderItems || [];
                const usernames = [
                    ...new Set(items.map((i) => i.commissionArtistUsername).filter(Boolean)),
                ];
                let merged = [];
                let firstUserId = null;
                for (const uname of usernames) {
                    const pr = await ProfileService.getProfileByUsername(uname);
                    const uid = pr.data?.userId;
                    if (uid == null) continue;
                    if (firstUserId == null) firstUserId = uid;
                    const cr = await CommissionService.getByUser(uid);
                    const list = Array.isArray(cr.data) ? cr.data : [];
                    merged = merged.concat(list);
                }
                const byId = new Map();
                for (const c of merged) {
                    if (c?.commissionId != null) byId.set(c.commissionId, c);
                }
                setCommissions(Array.from(byId.values()));
                setArtistUsername(usernames[0] || "");
                setArtistUserId(firstUserId);
                setLines(
                    items.length > 0
                        ? items.map((it) => ({
                              commissionId: String(it.commissionId ?? ""),
                              genre: it.genre || null,
                              quantity: Math.max(1, Number(it.quantity) || 1),
                              orderDescription: it.orderDescription || "",
                              attachedImages: Array.isArray(it.attachedImages)
                                  ? [...it.attachedImages]
                                  : [],
                          }))
                        : [emptyLine()]
                );
            } catch (err) {
                if (!cancelled) {
                    const msg =
                        err.response?.data?.message ||
                        (typeof err.response?.data === "string" ? err.response.data : null);
                    setEditLoadError(msg ? `Could not load order. ${msg}` : "Could not load order.");
                }
            } finally {
                if (!cancelled) setLoadingEditOrder(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [isAuthenticated, isEditMode, editOrderIdParam, user?.accountId, user?.username]);

    const estimatedTotal = useMemo(() => {
        return lines.reduce((sum, line) => {
            const cid = parseInt(line.commissionId, 10);
            if (Number.isNaN(cid)) return sum;
            const c = commissions.find((x) => x.commissionId === cid);
            if (!c) return sum;
            const q = Math.max(1, parseInt(String(line.quantity), 10) || 1);
            return sum + (Number(c.commissionPrice) || 0) * q;
        }, 0);
    }, [lines, commissions]);

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    if (isEditMode && loadingEditOrder) {
        return (
            <Container className="py-5 d-flex justify-content-center">
                <Spinner animation="border" role="status" />
            </Container>
        );
    }

    if (isEditMode && editLoadError) {
        return (
            <Container className="py-4" style={{ maxWidth: 640 }}>
                <Alert variant="danger">{editLoadError}</Alert>
                <Button as={Link} to="/orders" variant="outline-primary">
                    Back to orders
                </Button>
            </Container>
        );
    }

    const updateLine = (index, patch) => {
        setLines((prev) => prev.map((line, i) => (i === index ? { ...line, ...patch } : line)));
    };

    const addLine = () => setLines((prev) => [...prev, emptyLine()]);

    const removeLine = (index) => {
        setLines((prev) => (prev.length <= 1 ? prev : prev.filter((_, i) => i !== index)));
    };

    const handleCommissionChange = (index, commissionIdStr) => {
        const c = commissions.find((x) => String(x.commissionId) === commissionIdStr);
        updateLine(index, {
            commissionId: commissionIdStr,
            genre: c?.genre ?? null,
            attachedImages: [],
        });
    };

    const handleQuantity = (index, value) => {
        const n = parseInt(value, 10);
        updateLine(index, { quantity: Number.isNaN(n) || n < 1 ? 1 : n });
    };

    const handleFiles = async (lineIndex, fileList) => {
        const files = fileList ? Array.from(fileList) : [];
        if (!files.length) return;
        const line = lines[lineIndex];
        if (!line?.genre) return;

        setUploadingIndex(lineIndex);
        try {
            const uploaded = [];
            for (const file of files) {
                const res = await OrderService.uploadOrderAttachment(file);
                const path = res.data?.path;
                if (path) uploaded.push(path);
            }
            if (uploaded.length === 0) return;
            setLines((prev) =>
                prev.map((l, i) =>
                    i === lineIndex
                        ? { ...l, attachedImages: [...(l.attachedImages || []), ...uploaded] }
                        : l
                )
            );
        } catch {
            /* axios toast */
        } finally {
            setUploadingIndex(null);
        }
    };

    const removeAttachment = (lineIndex, path) => {
        setLines((prev) =>
            prev.map((line, i) => {
                if (i !== lineIndex) return line;
                return {
                    ...line,
                    attachedImages: (line.attachedImages || []).filter((p) => p !== path),
                };
            })
        );
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const orderItems = lines
            .map((line) => {
                const cid = parseInt(line.commissionId, 10);
                const qty = Number(line.quantity);
                if (Number.isNaN(cid) || cid < 1 || Number.isNaN(qty) || qty < 1) return null;
                return {
                    commissionId: cid,
                    quantity: qty,
                    orderDescription: line.orderDescription?.trim() || undefined,
                    attachedImages:
                        line.attachedImages?.length > 0 ? line.attachedImages : undefined,
                };
            })
            .filter(Boolean);

        if (orderItems.length === 0) return;
        if (commissions.length === 0) {
            setCommissionsError("Load commissions for an artist first.");
            return;
        }

        setSubmitting(true);
        try {
            if (isEditMode && editOrderIdParam) {
                const oid = parseInt(editOrderIdParam, 10);
                await OrderService.updateDraftOrder(oid, { orderItems });
            } else {
                await OrderService.addOrder({ orderItems });
            }
            navigate("/orders");
        } catch {
            /* toast */
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Container className="py-4" style={{ maxWidth: 800 }}>
            <h4 className="mb-2">{isEditMode ? "Edit draft order" : "Place order"}</h4>
            <p className="text-muted small mb-4">
                {isEditMode
                    ? "Update commission items and submit again. The order returns to Pending for the artist."
                    : artistFromQuery
                      ? "You are placing an order with this artist. Add commission items (commission type, quantity, optional note, samples)."
                      : "Choose an artist by username, load their commissions, then add commission items (commission, quantity, optional note, samples). File types allowed follow each commission's genre. Total price is calculated on the server."}
            </p>

            <Card className="mb-4 border shadow-sm">
                <Card.Body>
                    {isEditMode ? (
                        <div>
                            <Form.Label>Artist</Form.Label>
                            <Form.Control
                                type="text"
                                readOnly
                                value={artistUsername ? `@${artistUsername.trim()}` : ""}
                                className="bg-light"
                                disabled={submitting}
                            />
                            <div className="small text-muted mt-2">
                                Artist is fixed for this order. Change commission lines below if needed.
                            </div>
                        </div>
                    ) : artistFromQuery ? (
                        <div>
                            <Form.Label>Artist</Form.Label>
                            <Form.Control
                                type="text"
                                readOnly
                                plaintext={false}
                                value={artistUsername ? `@${artistUsername.trim()}` : ""}
                                className="bg-light"
                                disabled={submitting || loadingCommissions}
                            />
                            {loadingCommissions && (
                                <div className="small text-muted mt-2">
                                    <Spinner animation="border" size="sm" className="me-1" />
                                    Loading commissions…
                                </div>
                            )}
                        </div>
                    ) : (
                        <Row className="g-2 align-items-end">
                            <Col md={8}>
                                <Form.Label>Artist username</Form.Label>
                                <Form.Control
                                    type="text"
                                    list="order-form-artist-suggestions"
                                    value={artistUsername}
                                    onChange={(e) => setArtistUsername(e.target.value)}
                                    placeholder="e.g. creator_name"
                                    disabled={submitting || loadingCommissions}
                                />
                                <datalist id="order-form-artist-suggestions">
                                    {artistSuggestions.map((u) => (
                                        <option key={u} value={u} />
                                    ))}
                                </datalist>
                                {searchingArtist ? (
                                    <div className="small text-muted mt-2">
                                        <Spinner animation="border" size="sm" className="me-1" />
                                        Searching artist...
                                    </div>
                                ) : null}
                            </Col>
                            <Col md={4}>
                                <Button
                                    type="button"
                                    variant="primary"
                                    className="w-100"
                                    onClick={() => loadCommissionsForArtist()}
                                    disabled={submitting || loadingCommissions}
                                >
                                    {loadingCommissions ? (
                                        <>
                                            <Spinner animation="border" size="sm" className="me-1" />
                                            Loading…
                                        </>
                                    ) : (
                                        "Load commissions"
                                    )}
                                </Button>
                            </Col>
                        </Row>
                    )}
                    {artistUserId != null && commissions.length > 0 && (
                        <div className="small text-success mt-2">
                            Loaded {commissions.length} commission(s) for @{artistUsername.trim()}.
                        </div>
                    )}
                    {commissionsError ? (
                        <Alert variant="warning" className="mt-3 mb-0 py-2 small">
                            {commissionsError}
                        </Alert>
                    ) : null}
                </Card.Body>
            </Card>

            <Form onSubmit={handleSubmit}>
                {lines.map((line, index) => {
                    const accept =
                        line.genre && GENRE_FILE_TYPES[line.genre]
                            ? GENRE_FILE_TYPES[line.genre]
                            : "";
                    const selected = commissions.find(
                        (c) => String(c.commissionId) === String(line.commissionId)
                    );
                    const totalEstimate =
                        selected && line.quantity >= 1
                            ? (Number(selected.commissionPrice) || 0) *
                              Math.max(1, parseInt(String(line.quantity), 10) || 1)
                            : 0;

                    return (
                        <Card key={index} className="mb-3 border shadow-sm">
                            <Card.Body>
                                <div className="d-flex justify-content-between align-items-center mb-3">
                                    <span className="fw-medium">Commission item {index + 1}</span>
                                    {lines.length > 1 && (
                                        <Button
                                            type="button"
                                            variant="outline-danger"
                                            size="sm"
                                            onClick={() => removeLine(index)}
                                            disabled={submitting}
                                        >
                                            Remove
                                        </Button>
                                    )}
                                </div>
                                <Row className="g-3">
                                    <Col xs={12}>
                                        <Form.Group>
                                            <Form.Label>Commission</Form.Label>
                                            <Form.Select
                                                value={line.commissionId}
                                                onChange={(e) =>
                                                    handleCommissionChange(index, e.target.value)
                                                }
                                                required
                                                disabled={submitting || commissions.length === 0}
                                            >
                                                <option value="">Select commission</option>
                                                {commissions.map((c) => (
                                                    <option
                                                        key={c.commissionId}
                                                        value={String(c.commissionId)}
                                                    >
                                                        {c.commissionType ?? "—"}
                                                    </option>
                                                ))}
                                            </Form.Select>
                                        </Form.Group>
                                    </Col>
                                    <Col md={6}>
                                        <Form.Group>
                                            <Form.Label>Quantity</Form.Label>
                                            <Form.Control
                                                type="number"
                                                min={1}
                                                step={1}
                                                value={line.quantity}
                                                onChange={(e) => handleQuantity(index, e.target.value)}
                                                required
                                                disabled={submitting}
                                            />
                                        </Form.Group>
                                    </Col>
                                    <Col md={6}>
                                        <Form.Group>
                                            <Form.Label>Total</Form.Label>
                                            <Form.Control
                                                type="text"
                                                readOnly
                                                value={String(totalEstimate)}
                                                disabled={submitting}
                                            />
                                        </Form.Group>
                                    </Col>
                                    <Col xs={12}>
                                        <Form.Group>
                                            <Form.Label>Note (optional)</Form.Label>
                                            <Form.Control
                                                as="textarea"
                                                rows={2}
                                                value={line.orderDescription}
                                                onChange={(e) =>
                                                    updateLine(index, {
                                                        orderDescription: e.target.value,
                                                    })
                                                }
                                                disabled={submitting}
                                            />
                                        </Form.Group>
                                    </Col>
                                    <Col xs={12}>
                                        <Form.Label>Samples (optional)</Form.Label>
                                        <Form.Text className="d-block text-muted mb-2 small">
                                            Allowed file types depend on the commission genre (Art: images,
                                            Music: mp4/webm, Literature: PDF).
                                        </Form.Text>
                                        <InputGroup className="mb-2">
                                            <Form.Control
                                                type="file"
                                                multiple
                                                accept={accept}
                                                disabled={
                                                    submitting ||
                                                    uploadingIndex === index ||
                                                    !line.genre
                                                }
                                                onChange={(e) => {
                                                    handleFiles(index, e.target.files);
                                                    e.target.value = "";
                                                }}
                                            />
                                            {uploadingIndex === index && (
                                                <InputGroup.Text>
                                                    <Spinner animation="border" size="sm" />
                                                </InputGroup.Text>
                                            )}
                                        </InputGroup>
                                        {(line.attachedImages || []).length > 0 && (
                                            <ul className="small mb-0 ps-3">
                                                {(line.attachedImages || []).map((p, idx) => (
                                                    <li key={p} className="d-flex align-items-start gap-2">
                                                        <span className="text-muted">Sample {idx + 1}</span>
                                                        <Button
                                                            type="button"
                                                            variant="link"
                                                            size="sm"
                                                            className="p-0 text-danger"
                                                            onClick={() => removeAttachment(index, p)}
                                                            disabled={submitting}
                                                        >
                                                            Remove
                                                        </Button>
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                    </Col>
                                </Row>
                            </Card.Body>
                        </Card>
                    );
                })}

                <Card className="mb-4 bg-light border-0">
                    <Card.Body className="py-3 d-flex justify-content-between align-items-center">
                        <span className="text-muted">Estimated order total (server will confirm)</span>
                        <span className="fw-semibold fs-5">{estimatedTotal}</span>
                    </Card.Body>
                </Card>

                <div className="d-flex flex-wrap gap-2 mb-4">
                    <Button
                        type="button"
                        variant="outline-secondary"
                        onClick={addLine}
                        disabled={submitting || commissions.length === 0}
                    >
                        Add commission item
                    </Button>
                </div>

                <div className="d-flex flex-wrap gap-2">
                    <Button
                        type="submit"
                        variant="primary"
                        disabled={submitting || commissions.length === 0}
                    >
                        {submitting ? (
                            <>
                                <Spinner animation="border" size="sm" className="me-2" />
                                Submitting…
                            </>
                        ) : isEditMode ? (
                            "Save & submit"
                        ) : (
                            "Submit order"
                        )}
                    </Button>
                    <Button
                        type="button"
                        variant="outline-secondary"
                        as={Link}
                        to="/orders"
                        disabled={submitting}
                    >
                        Cancel
                    </Button>
                </div>
            </Form>
        </Container>
    );
}

export default OrderForm;
