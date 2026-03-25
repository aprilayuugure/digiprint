import { Navigate, useLocation, useParams } from "react-router-dom";

function WorksDefaultPageRedirect() {
    const { genre } = useParams();
    const location = useLocation();

    const g = String(genre ?? "").toUpperCase() || "ART";
    const q = location.search || "";

    return <Navigate to={`/works/${encodeURIComponent(g)}/page/1${q}`} replace />;
}

export default WorksDefaultPageRedirect;

