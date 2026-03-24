import { useEffect, useState } from "react";
import { Alert, Badge, Button, Form, Spinner, Table } from "react-bootstrap";
import ProfileService from "../services/ProfileService";

const STATUS_OPTIONS = [
    { value: "", label: "All" },
    { value: "PENDING", label: "Pending" },
    { value: "APPROVED", label: "Approved" },
    { value: "REJECTED", label: "Rejected" },
];

function statusVariant(s) {
    switch (s) {
        case "PENDING":
            return "warning";
        case "APPROVED":
            return "success";
        case "REJECTED":
            return "danger";
        default:
            return "secondary";
    }
}

function AdminManageArtistApplications() {
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [statusFilter, setStatusFilter] = useState("PENDING");
    const [busyId, setBusyId] = useState(null);

    const load = () => {
        setLoading(true);
        setError("");
        ProfileService.getAdminArtistApplications(statusFilter || undefined)
            .then((res) => setRows(Array.isArray(res.data) ? res.data : []))
            .catch((err) => setError(err?.response?.data?.message || "Could not load applications."))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        load();
    }, [statusFilter]);

    const patchStatus = async (applicationId, status) => {
        setBusyId(applicationId);
        try {
            await ProfileService.updateArtistApplicationStatus(applicationId, status);
            await load();
        } finally {
            setBusyId(null);
        }
    };

    return (
        <>
            <div className="border rounded p-3 mb-3 bg-light d-flex flex-wrap align-items-center gap-2">
                <span className="small text-muted me-1">Filter:</span>
                <Form.Select
                    style={{ maxWidth: 200 }}
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                >
                    {STATUS_OPTIONS.map((o) => (
                        <option key={o.value || "all"} value={o.value}>
                            {o.label}
                        </option>
                    ))}
                </Form.Select>
            </div>

            {loading ? (
                <div className="d-flex justify-content-center py-4">
                    <Spinner animation="border" />
                </div>
            ) : error ? (
                <Alert variant="danger">{error}</Alert>
            ) : (
                <div className="table-responsive">
                    <Table bordered hover size="sm">
                        <thead className="table-light">
                            <tr className="text-center">
                                <th>ID</th>
                                <th>Username</th>
                                <th>Email</th>
                                <th>Reason</th>
                                <th>Status</th>
                                <th>Requested</th>
                                <th style={{ minWidth: 140 }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((a) => (
                                <tr key={a.applicationId}>
                                    <td className="text-center">{a.applicationId}</td>
                                    <td>{a.username ?? "—"}</td>
                                    <td className="small">{a.email ?? "—"}</td>
                                    <td className="small" style={{ maxWidth: 280 }}>
                                        {a.reason || a.applicantMessage || "—"}
                                    </td>
                                    <td className="text-center">
                                        <Badge bg={statusVariant(a.status)}>{a.status}</Badge>
                                    </td>
                                    <td className="small text-nowrap">
                                        {a.requestedAt
                                            ? String(a.requestedAt).replace("T", " ").slice(0, 19)
                                            : "—"}
                                    </td>
                                    <td className="text-center">
                                        {a.status === "PENDING" ? (
                                            <div className="d-flex flex-wrap justify-content-center gap-1">
                                                <Button
                                                    size="sm"
                                                    variant="success"
                                                    disabled={busyId === a.applicationId}
                                                    onClick={() => patchStatus(a.applicationId, "APPROVED")}
                                                >
                                                    Accept
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="outline-danger"
                                                    disabled={busyId === a.applicationId}
                                                    onClick={() => patchStatus(a.applicationId, "REJECTED")}
                                                >
                                                    Reject
                                                </Button>
                                            </div>
                                        ) : (
                                            <span className="text-muted small">—</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            {rows.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="text-center text-muted py-4">
                                        No applications.
                                    </td>
                                </tr>
                            ) : null}
                        </tbody>
                    </Table>
                </div>
            )}
        </>
    );
}

export default AdminManageArtistApplications;
