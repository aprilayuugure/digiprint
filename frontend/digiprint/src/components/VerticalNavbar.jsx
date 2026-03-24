import { useMemo, useState } from "react";

/**
 * Sidebar `/me` và `/artist/:username`.
 * - userMe: Profile, Favourites, My orders
 * - artistMe: Profile, Works, Favourites, Commissions, Orders, My orders (không Dashboard)
 * - adminMe: Profile, Management + sub-items
 * - publicProfile: xem profile người khác — Profile, Works, Commissions
 */
function VerticalNavbar({
    activeTab,
    onSelectTab,
    showFavouritesLink = true,
    variant = "publicProfile",
}) {
    const [managementOpen, setManagementOpen] = useState(true);
    const managementTabs = useMemo(
        () => [
            "manageUsers",
            "manageArtistApplications",
            "manageTags",
            "manageWorks",
            "manageCommissions",
            "manageOrders",
        ],
        []
    );
    const managementActive = managementTabs.includes(activeTab);

    const itemClass = (tab) =>
        [
            "nav-link",
            "text-start",
            "border-0",
            "rounded-0",
            "py-2",
            "px-3",
            activeTab === tab ? "active fw-semibold" : "text-body",
        ].join(" ");

    const subItemClass = (tab) =>
        [
            "nav-link",
            "text-start",
            "border-0",
            "rounded-0",
            "py-2",
            "px-4",
            activeTab === tab ? "active fw-semibold" : "text-body",
        ].join(" ");

    if (variant === "userMe") {
        return (
            <nav className="nav flex-column bg-light border rounded shadow-sm" aria-label="My account sections">
                <button
                    type="button"
                    className={itemClass("profile")}
                    onClick={() => onSelectTab("profile")}
                >
                    Profile
                </button>
                {showFavouritesLink ? (
                    <button
                        type="button"
                        className={itemClass("favourites")}
                        onClick={() => onSelectTab("favourites")}
                    >
                        Favourites
                    </button>
                ) : null}
                <button
                    type="button"
                    className={itemClass("myOrders")}
                    onClick={() => onSelectTab("myOrders")}
                >
                    My orders
                </button>
            </nav>
        );
    }

    if (variant === "artistMe") {
        return (
            <nav className="nav flex-column bg-light border rounded shadow-sm" aria-label="Artist sections">
                <button
                    type="button"
                    className={itemClass("profile")}
                    onClick={() => onSelectTab("profile")}
                >
                    Profile
                </button>
                <button type="button" className={itemClass("works")} onClick={() => onSelectTab("works")}>
                    Works
                </button>
                {showFavouritesLink ? (
                    <button
                        type="button"
                        className={itemClass("favourites")}
                        onClick={() => onSelectTab("favourites")}
                    >
                        Favourites
                    </button>
                ) : null}
                <button
                    type="button"
                    className={itemClass("commissions")}
                    onClick={() => onSelectTab("commissions")}
                >
                    Commissions
                </button>
                <button type="button" className={itemClass("orders")} onClick={() => onSelectTab("orders")}>
                    Orders
                </button>
                <button
                    type="button"
                    className={itemClass("myOrders")}
                    onClick={() => onSelectTab("myOrders")}
                >
                    My orders
                </button>
            </nav>
        );
    }

    if (variant === "adminMe") {
        return (
            <nav className="nav flex-column bg-light border rounded shadow-sm" aria-label="Admin sections">
                <button
                    type="button"
                    className={itemClass("profile")}
                    onClick={() => onSelectTab("profile")}
                >
                    Profile
                </button>
                <button
                    type="button"
                    className={[
                        "nav-link",
                        "text-start",
                        "border-0",
                        "rounded-0",
                        "py-2",
                        "px-3",
                        managementActive ? "active fw-semibold" : "text-body",
                    ].join(" ")}
                    onClick={() => setManagementOpen((v) => !v)}
                    aria-expanded={managementOpen}
                >
                    Management
                </button>
                {managementOpen ? (
                    <>
                        <button
                            type="button"
                            className={subItemClass("manageUsers")}
                            onClick={() => onSelectTab("manageUsers")}
                        >
                            Manage users
                        </button>
                        <button
                            type="button"
                            className={subItemClass("manageArtistApplications")}
                            onClick={() => onSelectTab("manageArtistApplications")}
                        >
                            Manage application requests
                        </button>
                        <button
                            type="button"
                            className={subItemClass("manageTags")}
                            onClick={() => onSelectTab("manageTags")}
                        >
                            Manage tags
                        </button>
                        <button
                            type="button"
                            className={subItemClass("manageWorks")}
                            onClick={() => onSelectTab("manageWorks")}
                        >
                            Manage works
                        </button>
                        <button
                            type="button"
                            className={subItemClass("manageCommissions")}
                            onClick={() => onSelectTab("manageCommissions")}
                        >
                            Manage commissions
                        </button>
                        <button
                            type="button"
                            className={subItemClass("manageOrders")}
                            onClick={() => onSelectTab("manageOrders")}
                        >
                            Manage orders
                        </button>
                    </>
                ) : null}
            </nav>
        );
    }

    /* publicProfile */
    return (
        <nav className="nav flex-column bg-light border rounded shadow-sm" aria-label="Profile sections">
            <button
                type="button"
                className={itemClass("profile")}
                onClick={() => onSelectTab("profile")}
            >
                Profile
            </button>
            <button type="button" className={itemClass("works")} onClick={() => onSelectTab("works")}>
                Works
            </button>
            {showFavouritesLink ? (
                <button
                    type="button"
                    className={itemClass("favourites")}
                    onClick={() => onSelectTab("favourites")}
                >
                    Favourites
                </button>
            ) : null}
            <button
                type="button"
                className={itemClass("commissions")}
                onClick={() => onSelectTab("commissions")}
            >
                Commissions
            </button>
        </nav>
    );
}

export default VerticalNavbar;
