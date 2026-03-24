export function getVisiblePages(page, totalPages, maxPages = 5) {
    let start = Math.max(0, page - Math.floor(maxPages / 2));
    let end = start + maxPages;

    if (end > totalPages) {
        end = totalPages;
        start = Math.max(0, end - maxPages);
    }

    const pages = [];

    for (let i = start; i < end; ++i) pages.push(i);

    return pages;
}