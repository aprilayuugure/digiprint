import { useState, useEffect, useRef, useMemo, useCallback, useId } from "react";
import TagService from "../services/TagService";
import { getPrefixContext, computeTagSuggestions } from "../utils/tagAutocompleteUtils";

/**
 * Logic dùng chung cho ô nhập nhiều tag (space-separated) + gợi ý theo genre.
 */
export function useTagAutocomplete({ value, onChange, genre, maxSuggestions = 12 }) {
    const [tagsCache, setTagsCache] = useState({});
    const [open, setOpen] = useState(false);
    const [highlight, setHighlight] = useState(0);
    const containerRef = useRef(null);
    const reactId = useId();
    const listId = `${reactId}-tag-suggestions`;

    useEffect(() => {
        if (!genre) return;
        if (tagsCache[genre]) return;

        let cancelled = false;
        TagService.getTagsByGenre(genre)
            .then((res) => {
                if (cancelled) return;
                const list = Array.isArray(res.data) ? res.data : [];
                setTagsCache((prev) => ({ ...prev, [genre]: list }));
            })
            .catch(() => {});

        return () => {
            cancelled = true;
        };
    }, [genre, tagsCache]);

    const allTags = genre ? tagsCache[genre] || [] : [];

    const suggestions = useMemo(
        () => computeTagSuggestions(allTags, value, maxSuggestions),
        [allTags, value, maxSuggestions]
    );

    const selectSuggestion = useCallback(
        (tagName) => {
            if (!tagName) return;
            const v = value ?? "";
            const endsWithSpace = /\s$/.test(v);
            const { before } = getPrefixContext(v);
            let newVal;
            if (endsWithSpace) {
                newVal = v + tagName + " ";
            } else {
                newVal = before + tagName + " ";
            }
            onChange(newVal);
            setOpen(false);
        },
        [value, onChange]
    );

    useEffect(() => {
        setHighlight(0);
    }, [value, suggestions.length]);

    useEffect(() => {
        const handler = (e) => {
            if (containerRef.current && !containerRef.current.contains(e.target)) {
                setOpen(false);
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    const handleKeyDown = useCallback(
        (e) => {
            const canNavigate = open && suggestions.length > 0;
            if (canNavigate && e.key === "ArrowDown") {
                e.preventDefault();
                setHighlight((h) => Math.min(h + 1, suggestions.length - 1));
                return;
            }
            if (canNavigate && e.key === "ArrowUp") {
                e.preventDefault();
                setHighlight((h) => Math.max(h - 1, 0));
                return;
            }
            if (canNavigate && e.key === "Enter") {
                e.preventDefault();
                const pick = suggestions[highlight];
                if (pick?.tagName) selectSuggestion(pick.tagName);
                return;
            }
            if (e.key === "Escape") {
                setOpen(false);
            }
        },
        [open, suggestions, highlight, selectSuggestion]
    );

    const handleInputChange = useCallback(
        (e) => {
            onChange(e.target.value);
            setOpen(true);
        },
        [onChange]
    );

    const handleInputFocus = useCallback(() => {
        setOpen(true);
    }, []);

    const handleInputBlur = useCallback(() => {
        window.setTimeout(() => setOpen(false), 180);
    }, []);

    const showList = open && !!genre && suggestions.length > 0;

    return {
        containerRef,
        listId,
        suggestions,
        showList,
        highlight,
        setHighlight,
        selectSuggestion,
        handleKeyDown,
        handleInputChange,
        handleInputFocus,
        handleInputBlur,
        hasGenre: !!genre,
    };
}
