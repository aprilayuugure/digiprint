/** Hiển thị genre (enum API: ART | MUSIC | LITERATURE). */
export const GENRE_LABELS = {
    ART: "Art",
    MUSIC: "Music",
    LITERATURE: "Literature",
};

export function formatGenreLabel(genre) {
    if (genre == null || genre === "") return "";
    return GENRE_LABELS[genre] ?? String(genre);
}
