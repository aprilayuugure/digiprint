import { Container, Row, Col, Image, Dropdown } from "react-bootstrap";
import { Link, useNavigate } from "react-router-dom";
import { forwardRef, useEffect, useState } from "react";
import { FiBell } from "react-icons/fi";
import Searchbar from "./Searchbar";
import { useAuthContext } from "../contexts/AuthContext";
import ProfileService from "../services/ProfileService";
import { getPreviewSource } from "../utils/fileUtils";
import "../css/topbar.css";

const AvatarToggle = forwardRef(({ src, onClick, id, className }, ref) => (
    <span
        ref={ref}
        id={id}
        onClick={(e) => {
            e.preventDefault();
            onClick(e);
        }}
        style={{ cursor: "pointer" }}
        className={`d-inline-flex align-items-center border-0 p-0 bg-transparent topbar-avatar-dropdown-toggle ${className ?? ""}`}
        aria-label="Account menu"
    >
        <Image
            src={src}
            roundedCircle
            width={50}
            height={50}
            className="object-fit-cover"
            alt=""
        />
    </span>
));
AvatarToggle.displayName = "AvatarToggle";

function Topbar() {
    const { isAuthenticated, user, logout, mergeUser } = useAuthContext();
    const navigate = useNavigate();
    const [avatarPath, setAvatarPath] = useState(null);

    useEffect(() => {
        if (!isAuthenticated) {
            setAvatarPath(null);
            return;
        }

        let cancelled = false;

        ProfileService.getMyProfile()
            .then((res) => {
                if (cancelled) return;
                const d = res.data;
                setAvatarPath(d?.image ?? null);
                mergeUser({
                    userId: d?.userId,
                    accountId: d?.accountId,
                    username: d?.username,
                    role: d?.role,
                });
            })
            .catch(() => {
                if (!cancelled) {
                    setAvatarPath(user?.image ?? null);
                }
            });

        return () => {
            cancelled = true;
        };
    }, [isAuthenticated, user?.accountId, user?.image, mergeUser]);

    const avatarSrc = getPreviewSource(
        avatarPath ?? user?.image,
        "/images/no_avatar.jpg"
    );

    const handleLogout = () => {
        logout();
        navigate("/home", { replace: true });
    };

    return (
        <div className="border-bottom bg-white py-2 shadow-sm">
            <Container fluid>
                <Row className="align-items-center justify-content-between">
                    <Col xs="auto" className="d-flex align-items-center gap-3">
                        <Link
                            to="/home"
                            className="d-inline-block text-decoration-none"
                            aria-label="Về trang chủ"
                        >
                            <Image
                                src="/images/web-logo.jpg"
                                width={75}
                                height={75}
                                alt="DigiPrint"
                            />
                        </Link>

                        <Searchbar />

                    </Col>

                    <Col xs="auto" className="d-flex align-items-center gap-4">
                        <FiBell size={25} className="text-secondary" aria-hidden />

                        {isAuthenticated ? (
                            <Dropdown align="end">
                                <Dropdown.Toggle
                                    as={AvatarToggle}
                                    id="topbar-user-menu"
                                    src={avatarSrc}
                                />
                                <Dropdown.Menu className="topbar-user-dropdown shadow-sm border">
                                    <Dropdown.Item as={Link} to="/me" className="topbar-dropdown-item">
                                        Profile
                                    </Dropdown.Item>
                                    <Dropdown.Item as={Link} to="/account" className="topbar-dropdown-item">
                                        Account
                                    </Dropdown.Item>
                                    {(user?.role === "ARTIST" || user?.role === "ADMIN") && (
                                        <Dropdown.Item
                                            as={Link}
                                            to="/me"
                                            state={{ artistTab: "dashboard" }}
                                            className="topbar-dropdown-item"
                                        >
                                            Dashboard
                                        </Dropdown.Item>
                                    )}
                                    <Dropdown.Divider className="my-1" />
                                    <Dropdown.Item onClick={handleLogout} className="topbar-dropdown-item text-danger">
                                        Log out
                                    </Dropdown.Item>
                                </Dropdown.Menu>
                            </Dropdown>
                        ) : (
                            <Link to="/login" className="btn btn-primary btn-sm">
                                Login
                            </Link>
                        )}
                    </Col>
                </Row>
            </Container>
        </div>
    );
}

export default Topbar;
