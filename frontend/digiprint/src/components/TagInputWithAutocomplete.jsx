import { Form } from "react-bootstrap";
import { useTagAutocomplete } from "../hooks/useTagAutocomplete";
import TagAutocompleteDropdown from "./TagAutocompleteDropdown";
import "../css/tag-input-autocomplete.css";

/**
 * Ô nhập tag trong WorkForm — logic gợi ý dùng chung với Searchbar ({@link useTagAutocomplete}).
 */
function TagInputWithAutocomplete({
    value,
    onChange,
    genre,
    disabled = false,
    placeholder,
    id,
}) {
    const ac = useTagAutocomplete({ value, onChange, genre });

    return (
        <div ref={ac.containerRef} className="tag-input-autocomplete-wrap position-relative">
            <Form.Control
                id={id}
                type="text"
                value={value || ""}
                onChange={ac.handleInputChange}
                onFocus={ac.handleInputFocus}
                onBlur={ac.handleInputBlur}
                disabled={disabled}
                autoComplete="off"
                spellCheck={false}
                placeholder={placeholder}
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
                className="w-100"
            />
            {!ac.hasGenre && (
                <Form.Text className="text-muted d-block mt-1">
                    Select a genre first to see tag suggestions.
                </Form.Text>
            )}
        </div>
    );
}

export default TagInputWithAutocomplete;
