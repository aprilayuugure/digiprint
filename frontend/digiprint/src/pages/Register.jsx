import { Container, Card, Form, Row, Col, Button } from "react-bootstrap";
import { Link, useNavigate } from "react-router-dom";
import "../css/login.css";
import { useAuthForm } from "../hooks/useAuthForm";
import { useAuthBackground } from "../hooks/useAuthBackground";
import AuthService from "../services/AuthService";

function Register() {
    const { state, handleFieldChange, dispatch } = useAuthForm();
    const { backgroundStyle } = useAuthBackground();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        dispatch({ type: "CLEAR_ERRORS" });

        try {
            await AuthService.register(state.registerForm);
            dispatch({ type: "REGISTER_SUCCESS" });
            navigate("/login", { state: { registered: true } });
        } catch (error) {
            dispatch({
                type: "REGISTER_FAILED",
                payload: error.response?.data,
            });
        }
    };

    return (
        <div className="login auth-page" style={backgroundStyle}>
            <div className="login-overlay">
                <div className="login-content">
                    <Container className="d-flex justify-content-center align-items-center min-vh-100">
                        <Card className="login-card p-4 shadow">
                            <Card.Title className="text-center mb-4">Register</Card.Title>
                            <Form onSubmit={handleSubmit}>
                                <Row className="mb-3">
                                    <Form.Group as={Col} md="12">
                                        <Form.Label>Email</Form.Label>
                                        <Form.Control
                                            type="email"
                                            value={state.registerForm.email}
                                            onChange={(e) =>
                                                handleFieldChange("registerForm", "email", e.target.value)
                                            }
                                        />
                                        {state.errors.email && (
                                            <div className="text-danger mt-1">{state.errors.email}</div>
                                        )}
                                    </Form.Group>
                                </Row>

                                <Row className="mb-3">
                                    <Form.Group as={Col}>
                                        <Form.Label>Password</Form.Label>
                                        <Form.Control
                                            type="password"
                                            value={state.registerForm.password}
                                            onChange={(e) =>
                                                handleFieldChange("registerForm", "password", e.target.value)
                                            }
                                        />
                                        {state.errors.password && (
                                            <div className="text-danger mt-1">{state.errors.password}</div>
                                        )}
                                    </Form.Group>
                                </Row>

                                <Row className="mb-3">
                                    <Form.Group as={Col}>
                                        <Form.Label>Role</Form.Label>
                                        <Form.Select
                                            value={state.registerForm.role}
                                            onChange={(e) =>
                                                handleFieldChange("registerForm", "role", e.target.value)
                                            }
                                        >
                                            <option value="">Select role</option>
                                            <option value="USER">User</option>
                                            <option value="ARTIST">Artist</option>
                                        </Form.Select>
                                        {state.errors.role && (
                                            <div className="text-danger mt-1">{state.errors.role}</div>
                                        )}
                                    </Form.Group>
                                </Row>

                                <Row className="justify-content-center mb-3">
                                    <Col xs="auto">
                                        <Button type="submit">Register</Button>
                                    </Col>
                                </Row>

                                {state.generalError && (
                                    <div className="text-danger mt-1 text-center">{state.generalError}</div>
                                )}

                                <div className="text-center mt-2">
                                    <span className="text-dark">Already have an account? </span>
                                    <Link to="/login" className="text-primary fw-bold text-decoration-none">Login</Link>
                                </div>
                            </Form>
                        </Card>
                    </Container>
                </div>
            </div>
        </div>
    );
}

export default Register;
