import { useMemo, useState, useEffect, useRef } from "react";
import { Form, Row, Col, Button, Image } from "react-bootstrap";
import UserService from "../services/UserService";
import { getServerFileUrl } from "../utils/fileUtils";
import { useAuthContext } from "../contexts/AuthContext";

const ARTIST_DEBOUNCE_MS = 300;

function WorkFilter({ filters, onFiltersChange, onApply, hideArtist = false }) {
    const { isAuthenticated } = useAuthContext();
    const [artistInput, setArtistInput] = useState(filters.artistName || "");
    const [suggestions, setSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const debounceRef = useRef(null);
    const containerRef = useRef(null);

    const ratingOptions = useMemo(
        () => {
            const base = [
                { value: "ALL", label: "All" },
                { value: "SAFE", label: "Safe" },
                { value: "SUGGESTIVE", label: "Suggestive" },
            ];
            if (isAuthenticated) {
                base.push({ value: "NSFW", label: "NSFW" });
            }
            return base;
        },
        [isAuthenticated]
    );

    useEffect(() => {
        if (!showSuggestions) setArtistInput(filters.artistName || "");
    }, [filters.artistName, showSuggestions]);

    useEffect(() => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        const q = artistInput.trim();
        if (!q) {
            setSuggestions([]);
            return;
        }
        debounceRef.current = setTimeout(() => {
            UserService.searchCreators(q)
                .then((res) => setSuggestions(res.data || []))
                .catch(() => setSuggestions([]));
        }, ARTIST_DEBOUNCE_MS);
        return () => clearTimeout(debounceRef.current);
    }, [artistInput]);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (containerRef.current && !containerRef.current.contains(e.target)) {
                setShowSuggestions(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleSelectCreator = (creator) => {
        onFiltersChange?.({ artistName: creator.username, artistAvatar: creator.image });
        setArtistInput(creator.username);
        setShowSuggestions(false);
        setSuggestions([]);
        onApply?.();
    };

    const handleClearArtist = () => {
        onFiltersChange?.({ artistName: "", artistAvatar: "" });
        setArtistInput("");
        setSuggestions([]);
        onApply?.();
    };

    const handleApply = (e) => {
        e.preventDefault();
        onApply?.();
    };

    const hasSelectedArtist = filters.artistName && (filters.artistAvatar || filters.artistName);

    return (
        <Form className="mb-4" onSubmit={handleApply}>
            {!hideArtist && (
                <Row className="mb-3">
                    <Col md={6}>
                        <div
                            className="d-flex align-items-center gap-2"
                            ref={containerRef}
                            style={{ position: "relative" }}
                        >
                            <Form.Label className="mb-0">Artist name:</Form.Label>
                            <div className="position-relative" style={{ maxWidth: "280px" }}>
                                {hasSelectedArtist ? (
                                    <div className="d-flex align-items-center gap-2 border rounded px-2 py-1 bg-light">
                                        <Image
                                            src={getServerFileUrl(filters.artistAvatar, "/images/no_avatar.jpg")}
                                            roundedCircle
                                            width={28}
                                            height={28}
                                            className="object-fit-cover"
                                        />
                                        <span className="small">{filters.artistName}</span>
                                        <Button
                                            type="button"
                                            variant="link"
                                            className="p-0 text-danger small"
                                            onClick={handleClearArtist}
                                        >
                                            Clear
                                        </Button>
                                    </div>
                                ) : (
                                    <>
                                        <Form.Control
                                            type="text"
                                            value={artistInput}
                                            onChange={(e) => {
                                                setArtistInput(e.target.value);
                                                setShowSuggestions(true);
                                            }}
                                            onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                                            placeholder="Type to search creator..."
                                        />
                                        {showSuggestions && suggestions.length > 0 && (
                                            <ul
                                                className="list-unstyled border rounded shadow-sm position-absolute mt-1 w-100 bg-white"
                                                style={{ zIndex: 10, maxHeight: "240px", overflowY: "auto" }}
                                            >
                                                {suggestions.map((c) => (
                                                    <li
                                                        key={c.username}
                                                        role="button"
                                                        className="d-flex align-items-center gap-2 px-3 py-2 list-group-item-action"
                                                        style={{ cursor: "pointer" }}
                                                        onMouseDown={() => handleSelectCreator(c)}
                                                    >
                                                        <Image
                                                            src={getServerFileUrl(c.image, "/images/no_avatar.jpg")}
                                                            roundedCircle
                                                            width={32}
                                                            height={32}
                                                            className="object-fit-cover"
                                                        />
                                                        <span>{c.username}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>
                    </Col>
                </Row>
            )}

            {/* Date + Sort */}
            <Row className="mb-3">
                {/* Left column: From + To */}
                <Col md={6}>
                    <div className="d-flex gap-4">
                        <div className="d-flex align-items-center gap-2">
                            <Form.Label className="mb-0">From:</Form.Label>
                            <Form.Control
                                type="date"
                                value={filters.startDate}
                                onChange={(e) => onFiltersChange?.({ startDate: e.target.value })}
                            />
                        </div>

                        <div className="d-flex align-items-center gap-2">
                            <Form.Label className="mb-0">To:</Form.Label>
                            <Form.Control
                                type="date"
                                value={filters.endDate}
                                onChange={(e) => onFiltersChange?.({ endDate: e.target.value })}
                            />
                        </div>
                    </div>
                </Col>

                {/* Right column: Sort by */}
                <Col md={6}>
                    <div className="d-flex align-items-center gap-2">
                        <Form.Label className="mb-0">Sort by</Form.Label>
                        <Form.Select
                            value={filters.sort}
                            onChange={(e) => onFiltersChange?.({ sort: e.target.value })}
                            style={{ maxWidth: "180px" }}
                        >
                            <option value="recent">Recent</option>
                            <option value="popular">Popular</option>
                        </Form.Select>
                    </div>
                </Col>
            </Row>

            {/* Rating + Apply */}
            <Row>
                <Col md={8}>
                    <div className="d-flex align-items-center gap-3 flex-wrap">
                        <Form.Label className="mb-0">Rating:</Form.Label>
                        {ratingOptions.map((opt) => (
                            <Form.Check
                                key={opt.value}
                                type="radio"
                                name="rating-filter"
                                label={opt.label}
                                checked={filters.rating === opt.value}
                                onChange={() => onFiltersChange?.({ rating: opt.value })}
                            />
                        ))}
                    </div>
                </Col>

                <Col md={4} className="d-flex justify-content-end">
                    <Button type="submit">Apply filters</Button>
                </Col>
            </Row>
        </Form>
    );
}

export default WorkFilter;

