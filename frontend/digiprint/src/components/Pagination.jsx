import { getVisiblePages } from "../utils/paginationUtils";

function Pagination({ page, totalPages, onPageChange }) {
    if (!totalPages || totalPages <= 1) return null;

    const pages = getVisiblePages(page, totalPages);

    return (
        <div className = "d-flex justify-content-center align-items-center gap-2 mt-4">
            <button
                disabled = {page === 0}
                onClick = {() => onPageChange(0)}
            >
                {"<<"}
            </button>    

            <button
                disabled = {page === 0}
                onClick = {() => onPageChange(page - 1)}
            >
                {"<"}
            </button>    

            { pages.map((p) => (
                <button key = {p}
                        onClick = {() => onPageChange(p)}
                        style = {{ fontWeight: p === page ? "bold" : "normal" }}
                >
                    {p + 1}
                </button>
            ))}

            <button
                disabled = {page >= totalPages - 1}
                onClick = {() => onPageChange(page + 1)}
            >
                {">"}
            </button>  

            <button
                disabled = {page >= totalPages - 1}
                onClick = { () => onPageChange(totalPages - 1) }
            >
                {">>"}
            </button>    
        </div>
    )
}

export default Pagination;