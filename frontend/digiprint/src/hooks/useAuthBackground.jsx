import { useState, useEffect } from "react";
import WorkService from "../services/WorkService";

const API_BASE = "http://localhost:8080";

/**
 * Fetches a random ART work (rating !== NSFW) to use as auth page background.
 * @returns {Object} { backgroundStyle } for the wrapper div, or {} if none
 */
export function useAuthBackground() {
    const [backgroundStyle, setBackgroundStyle] = useState({});

    useEffect(() => {
        let cancelled = false;

        const load = async () => {
            try {
                const res = await WorkService.searchWorks("ART", {
                    ratings: ["SAFE"],
                    sort: "recent",
                    page: 0,
                    size: 30,
                });
                const content = res.data?.content ?? [];
                if (cancelled || content.length === 0) return;

                const randomWork = content[Math.floor(Math.random() * content.length)];
                const thumb = randomWork?.thumbnail;
                if (!thumb) return;

                const url = thumb.startsWith("http") ? thumb : `${API_BASE}${thumb.startsWith("/") ? "" : "/"}${thumb}`;
                setBackgroundStyle({
                    backgroundImage: `url(${url})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                });
            } catch {
                // ignore: keep default (no background or fallback)
            }
        };

        load();
        return () => { cancelled = true; };
    }, []);

    return { backgroundStyle };
}
