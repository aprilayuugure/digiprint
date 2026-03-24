import { Container, Nav } from "react-bootstrap";
import { Link, useLocation } from "react-router-dom";

const navItems = [
    { to: "/home", label: "Home" },
    { to: "/works/art", label: "Art" },
    { to: "/works/music", label: "Music" },
    { to: "/works/literature", label: "Literature" },
];

function HorizontalNavbar() {
    const location = useLocation();
    const pathname = location.pathname;

    return (
        <div className="border-bottom bg-white py-2 shadow-sm">
            <Container fluid>
                <Nav variant="tabs" className="px-3 gap-1" as="nav">
                    {navItems.map(({ to, label }) => {
                        const isActive =
                            to === "/home"
                                ? pathname === "/home"
                                : pathname.startsWith(to);
                        return (
                            <Nav.Item key={to}>
                                <Nav.Link
                                    as={Link}
                                    to={to}
                                    eventKey={to}
                                    active={isActive}
                                    className="text-dark fw-medium"
                                >
                                    {label}
                                </Nav.Link>
                            </Nav.Item>
                        );
                    })}
                </Nav>
            </Container>
        </div>
    );
}

export default HorizontalNavbar;
