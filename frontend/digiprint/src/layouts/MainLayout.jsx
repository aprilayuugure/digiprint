import { Outlet, useLocation } from "react-router-dom";
import Topbar from "../components/TopBar";
import HorizontalNavbar from "../components/HorizontalNavbar";
import Footer from "../components/Footer";

function MainLayout() {
    const location = useLocation();
    const path = location.pathname;
    const hideHorizontalNav =
        path.startsWith("/artist/") || path === "/me";

    return (
        <div className="d-flex flex-column min-vh-100">
            <Topbar />
            {!hideHorizontalNav && <HorizontalNavbar />}

            <main className="flex-grow-1 d-flex flex-column justify-content-center align-items-center container-fluid py-5">
                <Outlet />
            </main>

            <Footer />
        </div>
    );
}

export default MainLayout;
