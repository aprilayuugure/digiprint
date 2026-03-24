import { useEffect } from "react";
import { Container, Table, Spinner, Button } from "react-bootstrap";
import { useAuthContext } from "../contexts/AuthContext";
import { useLoginPrompt } from "../contexts/LoginPromptContext";
import { useCommission } from "../hooks/useCommission";
import { VALID_GENRES } from "../constants/validGenres";

function formatPriceInt(value) {
    const n = Number(value);
    if (Number.isNaN(n)) return "0";
    return String(Math.trunc(n));
}

function GenreSection({ title, items }) {
    return (
        <div className="mb-4">
            <h5 className="mb-2">{title}</h5>
            <div className="table-responsive">
                <Table striped bordered hover size="sm" className="align-middle mb-0">
                    <thead>
                        <tr className="text-center">
                            <th>Type</th>
                            <th>Price</th>
                        </tr>
                    </thead>
                    <tbody>
                        {items.length === 0 ? (
                            <tr>
                                <td colSpan={2} className="text-center text-muted py-3">
                                    No commissions yet.
                                </td>
                            </tr>
                        ) : (
                            items.map((c) => (
                                <tr key={c.commissionId}>
                                    <td className="text-center text-primary fw-medium">{c.commissionType}</td>
                                    <td className="text-center">{formatPriceInt(c.commissionPrice)}</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </Table>
            </div>
        </div>
    );
}

function Commissions() {
    const { openLoginPrompt } = useLoginPrompt();
    const { isAuthenticated } = useAuthContext();
    const { state, fetchCommissions } = useCommission();

    useEffect(() => {
        if (isAuthenticated) {
            fetchCommissions();
        }
    }, [isAuthenticated]);

    const byGenre = (genre) =>
        (state.commissions || []).filter((c) => c.genre === genre);

    if (!isAuthenticated) {
        return (
            <Container className="py-5 text-center">
                <h4 className="mb-3">Commissions</h4>
                <p className="text-muted mb-4">Sign in to view commissions.</p>
                <Button variant="primary" onClick={() => openLoginPrompt()}>
                    Sign in
                </Button>
            </Container>
        );
    }

    return (
        <Container className="py-4">
            <h4 className="mb-2">Commissions</h4>
            <p className="text-muted small mb-4">
                Commissions are grouped by Art, Music, and Literature. Each row shows the commission type
                and price (integer).
            </p>

            {state.loading && (
                <div
                    className="d-flex justify-content-center align-items-center"
                    style={{ minHeight: "40vh" }}
                >
                    <Spinner animation="border" role="status" style={{ width: 48, height: 48 }} />
                </div>
            )}

            {state.generalErrors && !state.loading && (
                <div className="alert alert-danger">{state.generalErrors}</div>
            )}

            {!state.loading && !state.generalErrors && (
                <>
                    <GenreSection
                        title="Art Commission"
                        items={byGenre("ART")}
                    />
                    <GenreSection
                        title="Music Commission"
                        items={byGenre("MUSIC")}
                    />
                    <GenreSection
                        title="Literature Commission"
                        items={byGenre("LITERATURE")}
                    />
                </>
            )}
        </Container>
    );
}

export default Commissions;
