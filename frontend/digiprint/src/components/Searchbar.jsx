import { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { FiSearch } from "react-icons/fi";
import { VALID_GENRES } from "../constants/validGenres";
import { useTagAutocomplete } from "../hooks/useTagAutocomplete";
import TagAutocompleteDropdown from "./TagAutocompleteDropdown";

const DEBOUNCE_MS = 400;

function Searchbar() {
    const [searchParams] = useSearchParams();
    const location = useLocation();
    const navigate = useNavigate();

    const tagParams = searchParams.getAll("tags");
    const initialFromUrl = tagParams.filter((t) => t?.trim()).join(" ");

    const [value, setValue] = useState(initialFromUrl);
    const debounceRef = useRef(null);

    // /works/:genre
    // /works/:genre/page/:pageId
    const match = location.pathname.match(/^\/works\/([^/]+)/);
    const segment = match ? match[1].toUpperCase() : null;
    const currentGenre = segment && VALID_GENRES.includes(segment) ? segment : null;
    const currentGenrePath = match ? match[1] : null;
    const paginatedMatch = location.pathname.match(/^\/works\/([^/]+)\/page\/(\d+)$/);
    const isOnPaginatedWorksRoute = Boolean(paginatedMatch);

    const ac = useTagAutocomplete({
        value,
        onChange: setValue,
        genre: currentGenre,
    });

    // Sync input from URL when navigating to a page with tags
    // Use functional setState to avoid unnecessary updates (prevents re-trigger loops).
    useEffect(() => {
        setValue((prev) => (prev === initialFromUrl ? prev : initialFromUrl));
    }, [location.pathname, initialFromUrl]);

    // Auto-search: debounce then navigate with tags (only when on a valid genre list page)
    useEffect(() => {
        debounceRef.current = setTimeout(() => {
            if (!currentGenre || !match) return;

            const tags = value.trim().split(/\s+/).filter((t) => t);

            if (tags.length === 0) {
                // IMPORTANT: when user is already on /works/:genre/page/:n,
                // don't auto-navigate back to /page/1 just because tags are empty.
                // Otherwise pagination will "jump" (page 2 -> page 1) due to value sync from URL.
                if (isOnPaginatedWorksRoute) return;

                navigate(`/works/${currentGenrePath}/page/1`);
                return;
            }

            const params = new URLSearchParams();
            params.set("genre", currentGenre);
            tags.forEach((t) => params.append("tags", t));

            // When tags are present, always reset to page 1 for consistent UX.
            navigate(`/works/${currentGenrePath}/page/1?${params.toString()}`);
        }, DEBOUNCE_MS);

        return () => clearTimeout(debounceRef.current);
        // IMPORTANT:
        // Do NOT depend on `location.pathname` here.
        // When user paginates (/works/:genre/page/:n), pathname changes and would trigger this effect again,
        // causing navigation reset (page=1) and request loop.
    }, [value, navigate, currentGenrePath, currentGenre]);

    const handleSubmit = (e) => {
        e.preventDefault();
    };

    return (
        <form
            ref={ac.containerRef}
            className="d-flex align-items-center bg-light border rounded-pill px-3 py-1 position-relative"
            style={{ width: "320px" }}
            onSubmit={handleSubmit}
        >
            <FiSearch className="text-muted me-2 flex-shrink-0" />
            <input
                type="text"
                className="form-control border-0 shadow-none bg-light p-0"
                placeholder="Search by tags (space separated)..."
                value={value}
                onChange={ac.handleInputChange}
                onFocus={ac.handleInputFocus}
                onBlur={ac.handleInputBlur}
                autoComplete="off"
                spellCheck={false}
                aria-autocomplete="list"
                aria-expanded={ac.showList}
                aria-controls={ac.listId}
                onKeyDown={ac.handleKeyDown}
            />
            <TagAutocompleteDropdown
                show={ac.showList}
                suggestions={ac.suggestions}
                highlight={ac.highlight}
                onSelect={ac.selectSuggestion}
                onHighlightIndex={ac.setHighlight}
                listId={ac.listId}
                className="tag-input-autocomplete-list--in-searchbar"
            />
        </form>
    );
}

export default Searchbar;
