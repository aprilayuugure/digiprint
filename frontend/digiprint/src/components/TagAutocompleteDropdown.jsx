import "../css/tag-input-autocomplete.css";

/**
 * Danh sách gợi ý tag — dùng chung Searchbar & WorkForm.
 */
function TagAutocompleteDropdown({
    show,
    suggestions,
    highlight,
    onSelect,
    onHighlightIndex,
    listId,
    /** Thêm class cho vị trí (vd. w-100 hoặc modifier searchbar) */
    className = "",
}) {
    if (!show || suggestions.length === 0) return null;

    return (
        <ul
            id={listId}
            className={`tag-input-autocomplete-list list-group position-absolute shadow-sm ${className}`.trim()}
            role="listbox"
        >
            {suggestions.map((t, i) => (
                <li
                    key={t.tagName}
                    role="option"
                    aria-selected={i === highlight}
                    className={
                        "list-group-item list-group-item-action py-2 px-3 small " +
                        (i === highlight ? "active" : "")
                    }
                    onMouseDown={(e) => {
                        e.preventDefault();
                        onSelect(t.tagName);
                    }}
                    onMouseEnter={() => onHighlightIndex(i)}
                >
                    {t.tagName}
                    {typeof t.tagWorkCount === "number" ? (
                        <span className="text-muted ms-1">({t.tagWorkCount})</span>
                    ) : null}
                </li>
            ))}
        </ul>
    );
}

export default TagAutocompleteDropdown;
