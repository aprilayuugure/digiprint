import { Outlet, useLocation } from "react-router-dom";
import Topbar from "../components/TopBar";
import HorizontalNavbar from "../components/HorizontalNavbar";

function MainLayout() {
    const location = useLocation();
    const path = location.pathname;
    const hideHorizontalNav =
        path.startsWith("/artist/") || path === "/me";

    return (
        <div>
            <Topbar />
            {!hideHorizontalNav && <HorizontalNavbar />}

            <main className="flex-fill d-flex flex-column justify-content-center align-items-center container-fluid py-5">
                <Outlet />
            </main>
        </div>
    );
}

export default MainLayout;
