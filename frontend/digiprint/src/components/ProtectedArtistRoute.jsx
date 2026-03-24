import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthContext } from "../contexts/AuthContext";
import { useLoginPrompt } from "../contexts/LoginPromptContext";
import { Container, Button } from "react-bootstrap";

function ProtectedArtistRoute({ children }) {
    const { user, canManageWorks } = useAuthContext();
    const { openLoginPrompt } = useLoginPrompt();
    const navigate = useNavigate();
    /** USER (role USER) không được quản lý work/commission; chỉ ARTIST / ADMIN. */
    const allowed = user && canManageWorks;

    useEffect(() => {
        if (!user) {
            openLoginPrompt();
        }
    }, [user, openLoginPrompt]);

    if (!user) {
        return (
            <Container className="d-flex flex-column align-items-center justify-content-center min-vh-100">
                <p className="mb-4 text-center">Please log in to access this page.</p>
                <Button variant="primary" onClick={() => navigate("/home")}>
                    Go to Home
                </Button>
            </Container>
        );
    }

    if (!canManageWorks) {
        return (
            <Container className="d-flex flex-column align-items-center justify-content-center min-vh-100">
                <p className="mb-4 text-center">You are unauthorized to access this function.</p>
                <Button variant="primary" onClick={() => navigate("/home")}>
                    Go to Home
                </Button>
            </Container>
        );
    }
    return children;
}

export default ProtectedArtistRoute;
