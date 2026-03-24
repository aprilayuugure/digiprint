import { Alert, Container, Row, Col, Nav, Spinner } from "react-bootstrap";
import { Navigate } from "react-router-dom";
import { useEffect, useMemo, useCallback } from "react";
import { useArtistPage } from "../hooks/useArtistPage";
import { useAuthContext } from "../contexts/AuthContext";
import VerticalNavbar from "../components/VerticalNavbar";
import Profile from "./Profile";
import Works from "./Works";
import ArtistCommissionsTab from "../components/ArtistCommissionsTab";
import ArtistFavouritesTab from "../components/ArtistFavouritesTab";
import Orders from "./Orders";
import ArtistDashboard from "./ArtistDashboard";
import AdminDashboard from "./AdminDashboard";
import AdminManageTags from "../components/AdminManageTags";
import AdminManageUsers from "../components/AdminManageUsers";
import AdminManageCommissions from "../components/AdminManageCommissions";
import AdminManageArtistApplications from "../components/AdminManageArtistApplications";

function Artist() {
    const {
        username,
        isMeRoute,
        shouldRedirect,
        shouldRedirectLogin,
        waitingForUsername,
        artist,
        commissionsState,
        fetchCommissions,
    } = useArtistPage();
    const { user, isAuthenticated, canManageCommissions } = useAuthContext();

    const isOwnProfile = useMemo(() => {
        if (!user?.username || !username) return false;
        return user.username.trim().toLowerCase() === String(username).trim().toLowerCase();
    }, [user?.username, username]);

    const showArtistOrdersTab = Boolean(
        isMeRoute && isOwnProfile && user?.role === "ARTIST"
    );
    const showUserMyOrdersTab = Boolean(
        isMeRoute && isOwnProfile && user?.role === "USER"
    );
    const showAdminDashboardTab = Boolean(
        isMeRoute && isOwnProfile && user?.role === "ADMIN"
    );
    const verticalNavVariant = useMemo(() => {
        if (!isMeRoute || !isOwnProfile || !user?.role) return "publicProfile";
        if (user.role === "USER") return "userMe";
        if (user.role === "ADMIN") return "adminMe";
        if (user.role === "ARTIST") return "artistMe";
        return "publicProfile";
    }, [isMeRoute, isOwnProfile, user?.role]);

    const handleSelectTab = useCallback(
        (tab) => {
            artist.setActiveTab(tab);
        },
        [artist]
    );

    useEffect(() => {
        if (artist.activeTab === "favourites" && (!isAuthenticated || !isOwnProfile)) {
            artist.setActiveTab("profile");
        }
    }, [isAuthenticated, isOwnProfile, artist.activeTab, artist.setActiveTab]);

    useEffect(() => {
        if (
            artist.activeTab === "dashboard" &&
            !showArtistOrdersTab &&
            !showAdminDashboardTab
        ) {
            artist.setActiveTab("profile");
        }
    }, [artist.activeTab, showArtistOrdersTab, showAdminDashboardTab, artist.setActiveTab]);

    useEffect(() => {
        if (artist.activeTab === "orders" && !showArtistOrdersTab) {
            artist.setActiveTab("profile");
        }
    }, [artist.activeTab, showArtistOrdersTab, artist.setActiveTab]);

    useEffect(() => {
        if (
            artist.activeTab === "myOrders" &&
            !showArtistOrdersTab &&
            !showUserMyOrdersTab
        ) {
            artist.setActiveTab("profile");
        }
    }, [artist.activeTab, showArtistOrdersTab, showUserMyOrdersTab, artist.setActiveTab]);

    useEffect(() => {
        if (verticalNavVariant !== "userMe") return;
        const allowed = new Set(["profile", "favourites", "myOrders"]);
        if (!allowed.has(artist.activeTab)) {
            artist.setActiveTab("profile");
        }
    }, [verticalNavVariant, artist.activeTab, artist.setActiveTab]);

    useEffect(() => {
        if (verticalNavVariant !== "artistMe") return;
        const allowed = new Set([
            "profile",
            "works",
            "favourites",
            "commissions",
            "orders",
            "myOrders",
            "dashboard",
        ]);
        if (!allowed.has(artist.activeTab)) {
            artist.setActiveTab("profile");
        }
    }, [verticalNavVariant, artist.activeTab, artist.setActiveTab]);

    useEffect(() => {
        if (verticalNavVariant !== "adminMe") return;
        const allowed = new Set([
            "profile",
            "dashboard",
            "manageUsers",
            "manageArtistApplications",
            "manageTags",
            "manageWorks",
            "manageCommissions",
            "manageOrders",
        ]);
        if (!allowed.has(artist.activeTab)) {
            artist.setActiveTab("profile");
        }
    }, [verticalNavVariant, artist.activeTab, artist.setActiveTab]);

    if (shouldRedirectLogin) {
        return <Navigate to="/login" replace />;
    }

    if (waitingForUsername) {
        return (
            <Container className="py-5 d-flex justify-content-center">
                <Spinner animation="border" role="status" />
            </Container>
        );
    }

    if (shouldRedirect) {
        return <Navigate to = "/home" replace />;
    }

    const TAB_COMPONENTS = {
        dashboard: showArtistOrdersTab
            ? <ArtistDashboard />
            : showAdminDashboardTab
              ? <AdminDashboard />
              : null,
        profile: <Profile />,
        works: (
            <>
                <div className="border-bottom bg-white py-2 shadow-sm mb-3">
                    <Nav variant="tabs" className="gap-1" as="nav">
                        {artist.GENRES.map((g) => (
                            <Nav.Item key={g}>
                                <Nav.Link
                                    active={artist.activeGenre === g}
                                    onClick={() => artist.setActiveGenre(g)}
                                    className="text-dark fw-medium"
                                >
                                    {g.charAt(0) + g.slice(1).toLowerCase()}
                                </Nav.Link>
                            </Nav.Item>
                        ))}
                    </Nav>
                </div>

                <Works genre={artist.activeGenre} username={username} />
            </>
        ),
        commissions: (
            <ArtistCommissionsTab
                commissionsState={commissionsState}
                fetchCommissions={fetchCommissions}
                targetUserId={artist.profile?.userId ?? null}
                artistUsername={username}
                showAddCommission={
                    canManageCommissions &&
                    artist.profile?.userId != null &&
                    (isOwnProfile || user?.role === "ADMIN")
                }
                showManageActions={
                    canManageCommissions &&
                    artist.profile?.userId != null &&
                    (isOwnProfile || user?.role === "ADMIN")
                }
                showOrder={!isOwnProfile}
            />
        ),
        favourites:
            isAuthenticated && isOwnProfile ? <ArtistFavouritesTab /> : null,
        orders: showArtistOrdersTab ? (
            <Orders key="artist-tab-orders-incoming" embedded artistOrderView="incoming" />
        ) : null,
        myOrders:
            showArtistOrdersTab || showUserMyOrdersTab ? (
                <Orders
                    key="me-tab-orders-my-purchases"
                    embedded
                    artistOrderView="myPurchases"
                />
            ) : null,
        manageUsers: showAdminDashboardTab ? (
            <AdminManageUsers />
        ) : null,
        manageArtistApplications: showAdminDashboardTab ? (
            <AdminManageArtistApplications />
        ) : null,
        manageTags: showAdminDashboardTab ? (
            <AdminManageTags />
        ) : null,
        manageWorks: showAdminDashboardTab ? (
            <>
                <div className="border-bottom bg-white py-2 shadow-sm mb-3">
                    <Nav variant="tabs" className="gap-1" as="nav">
                        {artist.GENRES.map((g) => (
                            <Nav.Item key={g}>
                                <Nav.Link
                                    active={artist.activeGenre === g}
                                    onClick={() => artist.setActiveGenre(g)}
                                    className="text-dark fw-medium"
                                >
                                    {g.charAt(0) + g.slice(1).toLowerCase()}
                                </Nav.Link>
                            </Nav.Item>
                        ))}
                    </Nav>
                </div>
                <Works genre={artist.activeGenre} adminManageMode />
            </>
        ) : null,
        manageCommissions: showAdminDashboardTab ? (
            <AdminManageCommissions />
        ) : null,
        manageOrders: showAdminDashboardTab ? (
            <Orders key="admin-manage-orders" embedded />
        ) : null,
    };

    return (
        <Container className="py-4">
            <Row>
                <Col md={3} className="mb-3">
                    {/*
                      /me và /artist/:username cùng component này — VerticalNavbar giống nhau (luôn có Commissions).
                      Khác nhau chỉ nội dung tab (vd. đặt hàng vs quản lý commission).
                    */}
                    <VerticalNavbar
                        activeTab={artist.activeTab}
                        onSelectTab={handleSelectTab}
                        showFavouritesLink={isAuthenticated && isOwnProfile}
                        variant={verticalNavVariant}
                    />
                </Col>

                <Col md={9}>
                    {TAB_COMPONENTS[artist.activeTab] || null}
                </Col>
            </Row>
        </Container>
    );
}

export default Artist;
