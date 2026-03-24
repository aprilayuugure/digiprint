import { useParams, useLocation } from "react-router-dom";
import { useAuthContext } from "../contexts/AuthContext";
import { useArtist } from "./useArtist";
import { useCommission } from "./useCommission";

export function useArtistPage() {
    const { username: paramUsername } = useParams();
    const location = useLocation();
    const { user, isAuthenticated } = useAuthContext();

    const isMeRoute = location.pathname === "/me";
    const username = isMeRoute ? user?.username : paramUsername;

    const artist = useArtist(username ?? "");
    const { state: commissionsState, fetchCommissions } = useCommission({
        ownerUserId: artist.profile?.userId ?? undefined,
    });

    const shouldRedirect = !isMeRoute && !paramUsername;
    const shouldRedirectLogin = isMeRoute && !isAuthenticated;
    const waitingForUsername = isMeRoute && isAuthenticated && !user?.username;

    return {
        username,
        isMeRoute,
        shouldRedirect,
        shouldRedirectLogin,
        waitingForUsername,
        artist,
        commissionsState,
        fetchCommissions,
    };
}
