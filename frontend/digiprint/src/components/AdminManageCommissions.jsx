import { useEffect, useMemo, useState } from "react";
import { Alert, Button, Form, Modal, Spinner, Table } from "react-bootstrap";
import CommissionService from "../services/CommissionService";
import ProfileService from "../services/ProfileService";

function normalizeText(v) {
    return String(v || "").trim().toLowerCase();
}

function AdminManageCommissions() {
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [filters, setFilters] = useState({
        artistName: "",
        minPrice: "",
        maxPrice: "",
        genre: "ALL",
        type: "",
    });
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [deleting, setDeleting] = useState(false);

    const loadData = async () => {
        setLoading(true);
        setError("");
        try {
            const [commissions, usersRes] = await Promise.all([
                CommissionService.getAllByGenres(),
                ProfileService.getAdminUsers(),
            ]);
            const users = Array.isArray(usersRes.data) ? usersRes.data : [];
            const userMap = new Map(users.map((u) => [Number(u.userId), u.username || ""]));
            const merged = (Array.isArray(commissions) ? commissions : []).map((c) => ({
                ...c,
                artistName: userMap.get(Number(c.userId)) || "",
            }));
            setRows(merged);
        } catch (err) {
            setError(err?.response?.data?.message || "Could not load commissions.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const filteredRows = useMemo(() => {
        const artistQ = normalizeText(filters.artistName);
        const typeQ = normalizeText(filters.type);
        const min = filters.minPrice === "" ? null : Number(filters.minPrice);
        const max = filters.maxPrice === "" ? null : Number(filters.maxPrice);

        return rows.filter((c) => {
            const artistName = normalizeText(c.artistName);
            const type = normalizeText(c.commissionType);
            const price = Number(c.commissionPrice);
            const genreOk = filters.genre === "ALL" || c.genre === filters.genre;
            const artistOk = !artistQ || artistName.includes(artistQ);
            const typeOk = !typeQ || type.includes(typeQ);
            const minOk = min == null || (!Number.isNaN(price) && price >= min);
            const maxOk = max == null || (!Number.isNaN(price) && price <= max);
            return genreOk && artistOk && typeOk && minOk && maxOk;
        });
    }, [rows, filters]);

    const handleDelete = async () => {
        if (!deleteTarget?.commissionId) return;
        setDeleting(true);
        try {
            await CommissionService.deleteCommission(deleteTarget.commissionId);
            setDeleteTarget(null);
            await loadData();
        } finally {
            setDeleting(false);
        }
    };

    return (
        <>
            <div className="border rounded p-3 mb-3 bg-light">
                <div className="row g-2">
                    <div className="col-md-3">
                        <Form.Control
                            placeholder="Filter by artist name"
                            value={filters.artistName}
                            onChange={(e) => setFilters((f) => ({ ...f, artistName: e.target.value }))}
                        />
                    </div>
                    <div className="col-md-2">
                        <Form.Control
                            type="number"
                            placeholder="Min price"
                            value={filters.minPrice}
                            onChange={(e) => setFilters((f) => ({ ...f, minPrice: e.target.value }))}
                        />
                    </div>
                    <div className="col-md-2">
                        <Form.Control
                            type="number"
                            placeholder="Max price"
                            value={filters.maxPrice}
                            onChange={(e) => setFilters((f) => ({ ...f, maxPrice: e.target.value }))}
                        />
                    </div>
                    <div className="col-md-2">
                        <Form.Select
                            value={filters.genre}
                            onChange={(e) => setFilters((f) => ({ ...f, genre: e.target.value }))}
                        >
                            <option value="ALL">All genres</option>
                            <option value="ART">ART</option>
                            <option value="MUSIC">MUSIC</option>
                            <option value="LITERATURE">LITERATURE</option>
                        </Form.Select>
                    </div>
                    <div className="col-md-3">
                        <Form.Control
                            placeholder="Filter by commission type"
                            value={filters.type}
                            onChange={(e) => setFilters((f) => ({ ...f, type: e.target.value }))}
                        />
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="d-flex justify-content-center py-4">
                    <Spinner animation="border" />
                </div>
            ) : error ? (
                <Alert variant="danger">{error}</Alert>
            ) : (
                <div className="table-responsive">
                    <Table bordered hover>
                        <thead className="table-light text-center">
                            <tr>
                                <th>ID</th>
                                <th>Artist</th>
                                <th>Type</th>
                                <th>Genre</th>
                                <th>Price</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredRows.map((c) => (
                                <tr key={c.commissionId}>
                                    <td className="text-center">{c.commissionId}</td>
                                    <td>{c.artistName || "-"}</td>
                                    <td>{c.commissionType}</td>
                                    <td className="text-center">{c.genre}</td>
                                    <td className="text-end">{Math.trunc(Number(c.commissionPrice) || 0)}</td>
                                    <td className="text-center">
                                        <Button
                                            variant="outline-danger"
                                            size="sm"
                                            onClick={() => setDeleteTarget(c)}
                                        >
                                            Delete
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                            {filteredRows.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="text-center text-muted">
                                        No commissions found.
                                    </td>
                                </tr>
                            ) : null}
                        </tbody>
                    </Table>
                </div>
            )}

            <Modal show={!!deleteTarget} onHide={() => !deleting && setDeleteTarget(null)} centered>
                <Modal.Header closeButton={!deleting}>
                    <Modal.Title>Delete commission</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    Are you sure you want to delete commission
                    {" "}
                    <strong>#{deleteTarget?.commissionId}</strong>
                    ?
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setDeleteTarget(null)} disabled={deleting}>
                        Cancel
                    </Button>
                    <Button variant="danger" onClick={handleDelete} disabled={deleting}>
                        {deleting ? "Deleting..." : "Delete"}
                    </Button>
                </Modal.Footer>
            </Modal>
        </>
    );
}

export default AdminManageCommissions;
