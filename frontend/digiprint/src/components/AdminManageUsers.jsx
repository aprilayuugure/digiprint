import { useEffect, useState } from "react";
import { Alert, Spinner, Table } from "react-bootstrap";
import { Link } from "react-router-dom";
import ProfileService from "../services/ProfileService";

function AdminManageUsers() {
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        setError("");
        ProfileService.getAdminUsers()
            .then((res) => {
                if (cancelled) return;
                setRows(Array.isArray(res.data) ? res.data : []);
            })
            .catch((err) => {
                if (cancelled) return;
                setError(err?.response?.data?.message || "Could not load users.");
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, []);

    if (loading) {
        return (
            <div className="d-flex justify-content-center py-4">
                <Spinner animation="border" />
            </div>
        );
    }

    if (error) {
        return <Alert variant="danger">{error}</Alert>;
    }

    return (
        <div className="table-responsive">
            <Table bordered hover>
                <thead className="table-light text-center">
                    <tr>
                        <th>ID</th>
                        <th>Email</th>
                        <th>Username</th>
                        <th>Role</th>
                    </tr>
                </thead>
                <tbody>
                    {rows.map((u) => (
                        <tr key={u.userId ?? `${u.email}-${u.username}`}>
                            <td className="text-center">{u.userId ?? ""}</td>
                            <td>{u.email ?? ""}</td>
                            <td>
                                {u.username ? (
                                    <Link to={`/profiles/${encodeURIComponent(u.username)}`}>{u.username}</Link>
                                ) : (
                                    ""
                                )}
                            </td>
                            <td className="text-center">{u.role ?? ""}</td>
                        </tr>
                    ))}
                    {rows.length === 0 ? (
                        <tr>
                            <td colSpan={4} className="text-center text-muted">
                                No users found.
                            </td>
                        </tr>
                    ) : null}
                </tbody>
            </Table>
        </div>
    );
}

export default AdminManageUsers;
