import { Navigate, useParams } from "react-router-dom";

/**
 * URL `/artist/:username/works/:genre` trước đây render Works không có sidebar Artist.
 * Redirect về `/artist/:username` với state để mở tab Works + đúng genre (có Commissions).
 */
function ArtistWorksRedirect() {
    const { username, genre } = useParams();
    const g = String(genre || "ART").toUpperCase();

    return (
        <Navigate
            to={`/artist/${encodeURIComponent(username ?? "")}`}
            replace
            state={{ artistTab: "works", artistGenre: g }}
        />
    );
}

export default ArtistWorksRedirect;
