import { useEffect, useMemo, useState } from "react";
import { Button } from "react-bootstrap";
import { getServerFileUrl } from "../utils/fileUtils";
import "../css/artist-work-gallery.css"; 

function posClassForIndex(index) {
    const d = Math.abs(index - 2);
    if (d === 0) return "artist-work-gallery-item--pos-center";
    if (d === 1) return "artist-work-gallery-item--pos-near";
    return "artist-work-gallery-item--pos-far";
}
 
function WorkDetailArtistGallery({ title, previews, currentWork, onSelectWork }) {
    const [neighborShift, setNeighborShift] = useState(0);

    const currentId = currentWork?.workId != null ? String(currentWork.workId) : "";

    const currentIndex = useMemo(() => {
        if (!previews?.length || !currentId) return -1;
        return previews.findIndex((w) => String(w?.workId) === currentId);
    }, [previews, currentId]);

    useEffect(() => {
        setNeighborShift(0);
    }, [currentId, previews]);

    const { canPrev, canNext, slots } = useMemo(() => {
        const n = previews?.length ?? 0;
        const ci = currentIndex;
        const s = neighborShift;

        if (!currentWork?.workId) {
            return {
                canPrev: false,
                canNext: false,
                slots: [null, null, null, null, null],
            };
        }

        const center = {
            workId: currentWork.workId,
            workTitle: currentWork.workTitle,
            thumbnail: currentWork.thumbnail,
            isCurrent: true,
        };

        if (ci < 0 || n === 0) {
            return {
                canPrev: false,
                canNext: false,
                slots: [null, null, center, null, null],
            };
        }

        const leftInner = ci + 1 + s < n ? previews[ci + 1 + s] : null;
        const leftOuter = ci + 2 + s < n ? previews[ci + 2 + s] : null;
        const rightInner = ci - 1 - s >= 0 ? previews[ci - 1 - s] : null;
        const rightOuter = ci - 2 - s >= 0 ? previews[ci - 2 - s] : null;

        const nextS = s + 1;
        const canNext =
            ci + 2 + nextS < n &&
            ci - 2 - nextS >= 0;

        const canPrev = s > 0;

        return {
            canPrev,
            canNext,
            slots: [
                leftOuter
                    ? { ...leftOuter, isCurrent: false }
                    : null,
                leftInner
                    ? { ...leftInner, isCurrent: false }
                    : null,
                center,
                rightInner
                    ? { ...rightInner, isCurrent: false }
                    : null,
                rightOuter
                    ? { ...rightOuter, isCurrent: false }
                    : null,
            ],
        };
    }, [previews, currentIndex, neighborShift, currentWork]);

    const hasAnyNeighbor = slots.some((cell, i) => i !== 2 && cell != null);

    if (currentWork?.workId == null) {
        return null;
    }

    return (
        <div className="artist-work-gallery">
            <div className="artist-work-gallery-header">{title}</div>

            {!hasAnyNeighbor && previews?.length <= 1 ? (
                <div className="text-muted small mb-2">No other works in this genre.</div>
            ) : null}

            <div className="artist-work-gallery-nav-row">
                <Button
                    variant="outline-secondary"
                    size="sm"
                    className="artist-work-gallery-nav-btn"
                    disabled={!canPrev}
                    onClick={() => setNeighborShift((x) => Math.max(0, x - 1))}
                    aria-label="Previous neighbors"
                >
                    {"<"}
                </Button>

                <div className="artist-work-gallery-track">
                    {slots.map((cell, index) => {
                        const pos = posClassForIndex(index);
                        if (!cell) {
                            return (
                                <div
                                    key={`empty-${index}`}
                                    className={`artist-work-gallery-item artist-work-gallery-item--empty ${pos}`}
                                >
                                    <img
                                        src={getServerFileUrl(null, "/images/no_image.jpg")}
                                        alt=""
                                        className="artist-work-gallery-thumb"
                                    />
                                </div>
                            );
                        }

                        const isCurrent = !!cell.isCurrent;
                        return (
                            <div
                                key={cell.workId ?? `slot-${index}`}
                                className={
                                    `artist-work-gallery-item ${pos} ` +
                                    (isCurrent
                                        ? "artist-work-gallery-item--current"
                                        : "artist-work-gallery-item--clickable")
                                }
                                role={isCurrent ? undefined : "button"}
                                onClick={() => {
                                    if (!isCurrent) onSelectWork(cell.workId);
                                }}
                            >
                                <img
                                    src={getServerFileUrl(cell.thumbnail, "/images/no_image.jpg")}
                                    alt=""
                                    className="artist-work-gallery-thumb"
                                />
                            </div>
                        );
                    })}
                </div>

                <Button
                    variant="outline-secondary"
                    size="sm"
                    className="artist-work-gallery-nav-btn"
                    disabled={!canNext}
                    onClick={() => setNeighborShift((x) => x + 1)}
                    aria-label="Next neighbors"
                >
                    {">"}
                </Button>
            </div>
        </div>
    );
}

export default WorkDetailArtistGallery;
