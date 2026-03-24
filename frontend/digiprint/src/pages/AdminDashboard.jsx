import { useEffect, useMemo, useState } from "react";
import { Alert, Card, Col, Container, Row, Spinner } from "react-bootstrap";
import { Navigate } from "react-router-dom";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useAuthContext } from "../contexts/AuthContext";
import ProfileService from "../services/ProfileService";

function fmt(n) {
    const x = Number(n);
    if (!Number.isFinite(x)) return "0";
    return x.toLocaleString(undefined, { maximumFractionDigits: 0 });
}

export default function AdminDashboard() {
    const { isAuthenticated, user } = useAuthContext();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [data, setData] = useState(null);

    useEffect(() => {
        if (!isAuthenticated || user?.role !== "ADMIN") return;
        let cancelled = false;
        (async () => {
            setLoading(true);
            setError(null);
            try {
                const res = await ProfileService.getAdminDashboard();
                if (!cancelled) setData(res.data);
            } catch (err) {
                if (!cancelled) {
                    setError(err.response?.data?.message || "Could not load admin dashboard.");
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [isAuthenticated, user?.role]);

    const orderChartData = useMemo(
        () =>
            data
                ? [
                      { name: "Pending", value: Number(data.pendingOrders) || 0 },
                      { name: "In progress", value: Number(data.inProgressOrders) || 0 },
                      { name: "Completed", value: Number(data.completedOrders) || 0 },
                  ]
                : [],
        [data]
    );

    const paymentChartData = useMemo(
        () =>
            data
                ? [
                      { name: "Success", value: Number(data.successfulPayments) || 0 },
                      { name: "Pending", value: Number(data.pendingPayments) || 0 },
                      { name: "Failed", value: Number(data.failedPayments) || 0 },
                  ]
                : [],
        [data]
    );

    if (!isAuthenticated) return <Navigate to="/login" replace />;
    if (user?.role !== "ADMIN") return <Navigate to="/home" replace />;

    if (loading) {
        return (
            <Container className="py-5 d-flex justify-content-center">
                <Spinner animation="border" role="status" />
            </Container>
        );
    }

    if (error) {
        return (
            <Container className="py-4">
                <Alert variant="danger">{error}</Alert>
            </Container>
        );
    }

    return (
        <Container className="py-4">
            <h4 className="mb-4">Admin dashboard</h4>

            <Row className="g-3 mb-3">
                <Col md={3}>
                    <Card className="h-100 border-0 shadow-sm">
                        <Card.Body>
                            <div className="text-muted small text-uppercase">Users</div>
                            <div className="fs-4 fw-bold">{fmt(data?.totalUsers)}</div>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={3}>
                    <Card className="h-100 border-0 shadow-sm">
                        <Card.Body>
                            <div className="text-muted small text-uppercase">Artists</div>
                            <div className="fs-4 fw-bold">{fmt(data?.totalArtists)}</div>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={3}>
                    <Card className="h-100 border-0 shadow-sm">
                        <Card.Body>
                            <div className="text-muted small text-uppercase">Works</div>
                            <div className="fs-4 fw-bold">{fmt(data?.totalWorks)}</div>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={3}>
                    <Card className="h-100 border-0 shadow-sm">
                        <Card.Body>
                            <div className="text-muted small text-uppercase">Orders</div>
                            <div className="fs-4 fw-bold">{fmt(data?.totalOrders)}</div>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            <Row className="g-3 mb-3">
                <Col md={6}>
                    <Card className="border-0 shadow-sm h-100">
                        <Card.Body>
                            <div className="text-muted small text-uppercase mb-2">Order status</div>
                            <div style={{ width: "100%", height: 260 }}>
                                <ResponsiveContainer>
                                    <BarChart data={orderChartData}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                        <XAxis dataKey="name" />
                                        <YAxis allowDecimals={false} />
                                        <Tooltip />
                                        <Bar dataKey="value" fill="#0d6efd" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={6}>
                    <Card className="border-0 shadow-sm h-100">
                        <Card.Body>
                            <div className="text-muted small text-uppercase mb-2">Payment status</div>
                            <div style={{ width: "100%", height: 260 }}>
                                <ResponsiveContainer>
                                    <BarChart data={paymentChartData}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                        <XAxis dataKey="name" />
                                        <YAxis allowDecimals={false} />
                                        <Tooltip />
                                        <Bar dataKey="value" fill="#20c997" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            <Row className="g-3">
                <Col md={6}>
                    <Card className="border-0 shadow-sm">
                        <Card.Body>
                            <div className="text-muted small text-uppercase">Pending artist applications</div>
                            <div className="fs-4 fw-bold">{fmt(data?.pendingArtistApplications)}</div>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={6}>
                    <Card className="border-0 shadow-sm">
                        <Card.Body>
                            <div className="text-muted small text-uppercase">Total successful payment amount</div>
                            <div className="fs-4 fw-bold">{fmt(data?.totalSuccessfulPaymentAmount)}</div>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </Container>
    );
}
