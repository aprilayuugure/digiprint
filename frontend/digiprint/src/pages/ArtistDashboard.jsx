import { useMemo } from "react";
import { Card, Row, Col, Spinner, Alert } from "react-bootstrap";
import {
    Bar,
    BarChart,
    CartesianGrid,
    Legend,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";
import { useDashboard } from "../hooks/useDashboard";

const GENRES_ORDER = ["ART", "MUSIC", "LITERATURE"];

function formatMoney(n) {
    const x = Number(n);
    if (!Number.isFinite(x)) return "0";
    return x.toLocaleString(undefined, { maximumFractionDigits: 0 });
}

function genreLabel(genre) {
    const g = String(genre || "").toUpperCase();
    if (g === "ART") return "Art";
    if (g === "MUSIC") return "Music";
    if (g === "LITERATURE") return "Literature";
    return String(genre || "—");
}

function ArtistDashboard() {
    const { loading, data, error } = useDashboard();

    const worksByGenre = useMemo(() => {
        const list = data?.worksByGenre;
        if (Array.isArray(list) && list.length > 0) {
            const map = new Map(list.map((x) => [String(x.genre).toUpperCase(), Number(x.count) || 0]));
            return GENRES_ORDER.map((g) => ({
                genre: g,
                count: map.get(g) ?? 0,
            }));
        }
        return GENRES_ORDER.map((g) => ({ genre: g, count: 0 }));
    }, [data]);

    const chartData = useMemo(() => {
        if (!data?.monthlyStats?.length) return [];
        return data.monthlyStats.map((m) => ({
            label: m.label,
            worksUploaded: Number(m.worksUploaded) || 0,
            revenue: Number(m.revenue) || 0,
        }));
    }, [data]);

    if (loading) {
        return (
            <div className="d-flex justify-content-center py-5">
                <Spinner animation="border" role="status" />
            </div>
        );
    }

    if (error) {
        return <Alert variant="danger">{error}</Alert>;
    }

    if (!data) {
        return <Alert variant="secondary">No data.</Alert>;
    }

    return (
        <div className="artist-dashboard">
            <h4 className="mb-4">Dashboard</h4>

            <Row className="g-3 mb-3">
                <Col sm={6}>
                    <Card className="h-100 border-0 shadow-sm">
                        <Card.Body>
                            <div className="text-muted text-uppercase small fw-semibold mb-1">
                                Followers
                            </div>
                            <div className="fs-2 fw-bold text-body">
                                {formatMoney(data.followerCount)}
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
                <Col sm={6}>
                    <Card className="h-100 border-0 shadow-sm bg-primary text-white">
                        <Card.Body>
                            <div className="text-white-50 text-uppercase small fw-semibold mb-1">
                                Earning this month
                            </div>
                            <div className="fs-2 fw-bold">{formatMoney(data.earningThisMonth)}</div>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            <Row className="g-3 mb-3">
                <Col sm={6}>
                    <Card className="h-100 border-0 shadow-sm">
                        <Card.Body>
                            <div className="text-muted text-uppercase small fw-semibold mb-1">
                                Orders completed
                            </div>
                            <div className="fs-2 fw-bold text-body">
                                {formatMoney(data.ordersCompletedCount ?? 0)}
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
                <Col sm={6}>
                    <Card className="h-100 border-0 shadow-sm">
                        <Card.Body>
                            <div className="text-muted text-uppercase small fw-semibold mb-1">
                                Orders in progress
                            </div>
                            <div className="fs-2 fw-bold text-body">
                                {formatMoney(data.ordersInProgressCount ?? 0)}
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            <Card className="border-0 shadow-sm mb-4">
                <Card.Body>
                    <div className="text-muted text-uppercase small fw-semibold mb-3">Works</div>
                    <Row className="g-3">
                        {worksByGenre.map(({ genre, count }) => (
                            <Col xs={12} sm={4} key={genre}>
                                <div className="rounded border bg-light py-3 px-2 text-center">
                                    <div className="small text-muted mb-1">{genreLabel(genre)}</div>
                                    <div className="fs-3 fw-bold">{formatMoney(count)}</div>
                                </div>
                            </Col>
                        ))}
                    </Row>
                </Card.Body>
            </Card>

            <Card className="border-0 shadow-sm">
                <Card.Body>
                    <h6 className="mb-3">Last 12 months</h6>
                    <div style={{ width: "100%", height: 340 }}>
                        <ResponsiveContainer>
                            <BarChart
                                data={chartData}
                                margin={{ top: 8, right: 12, left: 4, bottom: 8 }}
                            >
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis
                                    dataKey="label"
                                    tick={{ fontSize: 11 }}
                                    interval={0}
                                    angle={-35}
                                    textAnchor="end"
                                    height={70}
                                />
                                <YAxis
                                    yAxisId="left"
                                    orientation="left"
                                    stroke="#6f42c1"
                                    tick={{ fontSize: 11 }}
                                    allowDecimals={false}
                                />
                                <YAxis
                                    yAxisId="right"
                                    orientation="right"
                                    stroke="#0d6efd"
                                    tick={{ fontSize: 11 }}
                                    tickFormatter={(v) => formatMoney(v)}
                                />
                                <Tooltip
                                    formatter={(value, name) =>
                                        name === "revenue"
                                            ? [formatMoney(value), "Revenue"]
                                            : [value, "Works uploaded"]
                                    }
                                />
                                <Legend />
                                <Bar
                                    yAxisId="left"
                                    dataKey="worksUploaded"
                                    name="Works uploaded"
                                    fill="#6f42c1"
                                    radius={[4, 4, 0, 0]}
                                    maxBarSize={28}
                                />
                                <Bar
                                    yAxisId="right"
                                    dataKey="revenue"
                                    name="Revenue"
                                    fill="#0dcaf0"
                                    radius={[4, 4, 0, 0]}
                                    maxBarSize={28}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </Card.Body>
            </Card>
        </div>
    );
}

export default ArtistDashboard;
