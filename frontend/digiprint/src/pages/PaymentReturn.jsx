import { useEffect, useMemo, useState } from "react";
import { Alert, Button, Card, Container, Spinner } from "react-bootstrap";
import { Link, useLocation } from "react-router-dom";
import PaymentService from "../services/PaymentService";

function PaymentReturn() {
    const location = useLocation();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [payment, setPayment] = useState(null);

    const params = useMemo(() => {
        const sp = new URLSearchParams(location.search);
        const obj = {};
        for (const [k, v] of sp.entries()) {
            obj[k] = v;
        }
        return obj;
    }, [location.search]);

    useEffect(() => {
        const hasTxnRef = Boolean(params.vnp_TxnRef);
        if (!hasTxnRef) {
            setError("Missing VNPay return parameters.");
            setLoading(false);
            return;
        }
        let cancelled = false;
        (async () => {
            setLoading(true);
            setError(null);
            try {
                const res = await PaymentService.confirmVnpayReturn(params);
                if (!cancelled) setPayment(res.data);
            } catch (err) {
                if (!cancelled) {
                    setError(err.response?.data?.message || "Could not verify payment result.");
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [params]);

    const isSuccess = payment?.paymentStatus === "SUCCESS";
    const orderId = payment?.orderId;

    return (
        <Container className="py-4" style={{ maxWidth: 720 }}>
            <h4 className="mb-3">VNPay payment result</h4>
            {loading ? (
                <div className="d-flex justify-content-center py-5">
                    <Spinner animation="border" />
                </div>
            ) : (
                <Card className="shadow-sm">
                    <Card.Body>
                        {error ? (
                            <Alert variant="danger" className="mb-3">
                                {error}
                            </Alert>
                        ) : (
                            <Alert variant={isSuccess ? "success" : "warning"} className="mb-3">
                                {isSuccess
                                    ? "Payment succeeded."
                                    : `Payment not successful (${payment?.paymentStatus || "UNKNOWN"}).`}
                            </Alert>
                        )}

                        <div className="small">
                            <div><strong>Txn Ref:</strong> {payment?.txnRef ?? params.vnp_TxnRef ?? "—"}</div>
                            <div><strong>Status:</strong> {payment?.paymentStatus ?? "—"}</div>
                            <div><strong>Response code:</strong> {payment?.vnpResponseCode ?? params.vnp_ResponseCode ?? "—"}</div>
                            <div><strong>Amount:</strong> {payment?.amount ?? "—"}</div>
                        </div>

                        <div className="d-flex gap-2 mt-3">
                            {orderId ? (
                                <Button as={Link} to={`/orders/${orderId}`} variant="primary">
                                    Back to order
                                </Button>
                            ) : (
                                <Button as={Link} to="/orders" variant="primary">
                                    Back to orders
                                </Button>
                            )}
                        </div>
                    </Card.Body>
                </Card>
            )}
        </Container>
    );
}

export default PaymentReturn;
