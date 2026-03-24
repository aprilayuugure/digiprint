import { createContext, useCallback, useContext, useLayoutEffect, useState } from "react";
import { Modal, Button } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { registerLoginPromptOpener } from "../utils/loginPromptBridge";

const LoginPromptContext = createContext(null);

export function LoginPromptProvider({ children }) {
    const [show, setShow] = useState(false);
    const navigate = useNavigate();

    const openLoginPrompt = useCallback(() => {
        setShow(true);
    }, []);

    const close = useCallback(() => {
        setShow(false);
    }, []);

    const goToLogin = useCallback(() => {
        setShow(false);
        navigate("/login");
    }, [navigate]);

    useLayoutEffect(() => {
        registerLoginPromptOpener(openLoginPrompt);
        return () => registerLoginPromptOpener(() => {});
    }, [openLoginPrompt]);

    return (
        <LoginPromptContext.Provider value={{ openLoginPrompt }}>
            {children}
            <Modal show={show} onHide={close} centered animation>
                <Modal.Header closeButton>
                    <Modal.Title>Login required</Modal.Title>
                </Modal.Header>
                <Modal.Body>Please log in to access this function.</Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={close}>
                        Cancel
                    </Button>
                    <Button variant="primary" onClick={goToLogin}>
                        Log in
                    </Button>
                </Modal.Footer>
            </Modal>
        </LoginPromptContext.Provider>
    );
}

export function useLoginPrompt() {
    const ctx = useContext(LoginPromptContext);
    if (!ctx) {
        throw new Error("useLoginPrompt must be used within LoginPromptProvider");
    }
    return ctx;
}
