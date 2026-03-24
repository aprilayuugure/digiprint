import { useEffect, useMemo, useState, useCallback } from "react";
import { useLocation } from "react-router-dom";
import ProfileService from "../services/ProfileService";
import WorkService from "../services/WorkService";

const GENRES = ["ART", "MUSIC", "LITERATURE"];

const ARTIST_TABS = [
    "dashboard",
    "profile",
    "works",
    "favourites",
    "commissions",
    "orders",
    "myOrders",
    "manageUsers",
    "manageArtistApplications",
    "manageTags",
    "manageWorks",
    "manageCommissions",
    "manageOrders",
];

export function useArtist(username) {
    const location = useLocation();
    const [activeTab, setActiveTab] = useState("profile");
    const [activeGenre, setActiveGenre] = useState("ART");
    const [profile, setProfile] = useState(null);
    const [worksPage, setWorksPage] = useState({
        content: [],
        page: 0,
        totalPages: 0,
        size: 20,
    });
    const [filters, setFilters] = useState({
        startDate: "",
        endDate: "",
        rating: "ALL",
        sort: "recent",
    });

    useEffect(() => {
        if (!username) return;
        ProfileService.getProfileByUsername(username)
            .then((res) => setProfile(res.data))
            .catch(() => setProfile(null));
    }, [username]);

    useEffect(() => {
        setActiveTab("profile");
    }, [username]);

    useEffect(() => {
        const tab = location.state?.artistTab;
        if (tab && ARTIST_TABS.includes(tab)) {
            setActiveTab(tab);
        }
    }, [location.state?.artistTab]);

    useEffect(() => {
        const g = location.state?.artistGenre;
        if (!g) return;
        const u = String(g).toUpperCase();
        if (GENRES.includes(u)) {
            setActiveGenre(u);
        }
    }, [location.state?.artistGenre]);

    const effectiveRatings = useMemo(() => {
        return filters.rating === "ALL" ? undefined : [filters.rating];
    }, [filters.rating]);

    const fetchWorks = useCallback(
        (page = 0) => {
            if (!username) return;
            WorkService.searchWorks(activeGenre, {
                artistName: username,
                startDate: filters.startDate || undefined,
                endDate: filters.endDate || undefined,
                ratings: effectiveRatings,
                sort: filters.sort,
                page,
                size: worksPage.size,
            })
                .then((res) => {
                    setWorksPage(res.data);
                })
                .catch(() => {
                    setWorksPage((prev) => ({ ...prev, content: [] }));
                });
        },
        [username, activeGenre, filters.startDate, filters.endDate, filters.sort, effectiveRatings, worksPage.size]
    );

    useEffect(() => {
        if (activeTab === "works") {
            fetchWorks(0);
        }
    }, [activeTab, activeGenre, filters.startDate, filters.endDate, filters.rating, filters.sort, username, fetchWorks]);

    return {
        GENRES,
        activeTab,
        setActiveTab,
        activeGenre,
        setActiveGenre,
        profile,
        worksPage,
        filters,
        setFilters,
        effectiveRatings,
        fetchWorks,
    };
}

