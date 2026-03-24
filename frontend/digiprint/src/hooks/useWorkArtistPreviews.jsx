import { useEffect, useState } from "react";
import WorkService from "../services/WorkService";

/**
 * Cùng genre + cùng creator: preview list cho gallery dưới WorkDetail.
 */
export function useWorkArtistPreviews(work) {
    const [artistGenreWorks, setArtistGenreWorks] = useState([]);

    useEffect(() => {
        if (!work?.genre || !work?.creator) {
            setArtistGenreWorks([]);
            return;
        }

        let cancelled = false;

        WorkService.searchWorks(work.genre, {
            artistName: work.creator,
            sort: "recent",
            page: 0,
            size: 100,
        })
            .then((res) => {
                if (cancelled) return;
                const content = Array.isArray(res?.data?.content) ? res.data.content : [];
                setArtistGenreWorks(content);
            })
            .catch(() => {
                if (cancelled) return;
                setArtistGenreWorks([]);
            });

        return () => {
            cancelled = true;
        };
    }, [work?.workId, work?.genre, work?.creator]);

    return artistGenreWorks;
}
