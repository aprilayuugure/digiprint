/**
 * Phân tích chuỗi tag (cách nhau bởi khoảng trắng) để gợi ý token đang gõ.
 * @returns {{ prefix: string, before: string, completedTokens: string[] }}
 */
export function getPrefixContext(value) {
    const v = value ?? "";
    const endsWithSpace = /\s$/.test(v);
    if (endsWithSpace) {
        return {
            prefix: "",
            before: v,
            completedTokens: v.trim().split(/\s+/).filter(Boolean),
        };
    }
    const lastSpace = v.lastIndexOf(" ");
    const before = lastSpace >= 0 ? v.slice(0, lastSpace + 1) : "";
    const prefix = lastSpace >= 0 ? v.slice(lastSpace + 1) : v;
    const completedTokens = before.trim().split(/\s+/).filter(Boolean);
    return { prefix, before, completedTokens };
}

/**
 * Lọc & sắp xếp gợi ý tag (prefix match, bỏ tag đã dùng).
 */
export function computeTagSuggestions(allTags, value, maxSuggestions = 12) {
    const { prefix, completedTokens } = getPrefixContext(value);
    const completedSet = new Set(completedTokens.map((t) => t.toLowerCase()));
    const q = (prefix || "").trim().toLowerCase();
    const list = (allTags || []).filter((t) => {
        const name = t.tagName || "";
        if (!name) return false;
        if (completedSet.has(name.toLowerCase())) return false;
        if (!q) return true;
        return name.toLowerCase().startsWith(q);
    });
    list.sort((a, b) =>
        (a.tagName || "").localeCompare(b.tagName || "", undefined, { sensitivity: "base" })
    );
    return list.slice(0, maxSuggestions);
}
