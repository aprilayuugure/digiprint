import { Container, Card, Form, Row, Col, Button } from "react-bootstrap";
import { Link, useNavigate } from "react-router-dom";
import "../css/login.css";
import { useAuthForm } from "../hooks/useAuthForm";
import { useAuthContext } from "../contexts/AuthContext";
import { useAuthBackground } from "../hooks/useAuthBackground";
import AuthService from "../services/AuthService";

function Login() {
    const { state, handleFieldChange, dispatch } = useAuthForm();
    const { login } = useAuthContext();
    const { backgroundStyle } = useAuthBackground();
    const navigate = useNavigate();
 
    const handleSubmit = async (e) => {
        e.preventDefault();
        
        dispatch({ type: "CLEAR_ERRORS" });

        try {
            const res = await AuthService.login(state.loginForm);
            
            const data = res.data;

            const user = {
                email: data.email,
                username: data.username,
                role: data.role,
                accountId: data.accountId,
                userId: data.userId ?? null,
                image: data.image ?? null,
                passwordLength: data.passwordLength,
            };

            login(user, data.token);

            if (data.role === "ARTIST" || data.role === "ADMIN") {
                navigate("/me", { replace: true, state: { artistTab: "dashboard" } });
            } else {
                navigate("/home", { replace: true });
            }
        }
        catch (error) {
            dispatch({
                type: "LOGIN_FAILED",
                payload: error.response?.data
            });
        }
    }

    return (
        <div className="login auth-page" style={backgroundStyle}>
            <div className="login-overlay">
                <div className = "login-content">
                    <Container className = "d-flex justify-content-center align-items-center min-vh-100"> 
                        <Card className = "login-card p-4 shadow">
                            <Card.Title className = "text-center mb-4">Login Form</Card.Title>
                                <Form onSubmit = {handleSubmit}>
                                    <Row className = "mb-3">
                                        <Form.Group as = {Col} md = "12">
                                            <Form.Label>Email or username</Form.Label>
                                            <Form.Control type = "text"
                                                          value = {state.loginForm.emailOrUsername}
                                                          onChange = {(e) => handleFieldChange("loginForm", "emailOrUsername", e.target.value)} />

                                            { state.errors.emailOrUsername && 
                                                <div className = "text-danger mt-1">
                                                    {state.errors.emailOrUsername}
                                                </div>
                                            }
                                        </Form.Group>
                                    </Row>

                                    <Row className = "mb-3" md = "12">
                                        <Form.Group as = {Col}>
                                            <Form.Label>Password</Form.Label>
                                            <Form.Control type = "password"
                                                          value = {state.loginForm.password}
                                                          onChange = {(e) => handleFieldChange("loginForm", "password", e.target.value)} />
                                            { state.errors.password && 
                                                <div className = "text-danger mt-1">
                                                    {state.errors.password}
                                                </div>
                                            }
                                        </Form.Group>
                                    </Row>

                                    <Row className = "justify-content-center mb-3">
                                        <Col xs = "auto">
                                            <Button type = "submit">Login</Button>
                                        </Col>
                                    </Row>

                                    {state.generalError && (
                                        <div className="text-danger mt-1 text-center">{state.generalError}</div>
                                    )}

                                    <div className="text-center mt-2">
                                        <span className="text-dark">Don&apos;t have an account? </span>
                                        <Link to="/register" className="text-primary fw-bold text-decoration-none">Register</Link>
                                    </div>
                                </Form>
                        </Card>
                    </Container>
                </div>
            </div>
        </div>
    )
}

export default Login;