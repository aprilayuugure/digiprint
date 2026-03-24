import { useEffect, useState } from "react";
import { Container, Row, Col, Spinner } from "react-bootstrap";
import { Link } from "react-router-dom";
import WorkCard from "../components/WorkCard";
import WorkService from "../services/WorkService";

/** Home chỉ hiển thị work SAFE / SUGGESTIVE, không NSFW. */
const HOME_RATINGS = ["SAFE", "SUGGESTIVE"];

const SECTIONS = [
    { genre: "ART", label: "Art", path: "/works/art" },
    { genre: "MUSIC", label: "Music", path: "/works/music" },
    { genre: "LITERATURE", label: "Literature", path: "/works/literature" },
];

function Home() {
    const [byGenre, setByGenre] = useState({
        ART: [],
        MUSIC: [],
        LITERATURE: [],
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;

        const load = async () => {
            setLoading(true);
            try {
                const requests = SECTIONS.map(({ genre }) =>
                    WorkService.searchWorks(genre, {
                        sort: "recent",
                        page: 0,
                        size: 5,
                        ratings: HOME_RATINGS,
                    })
                );

                const results = await Promise.all(requests);

                if (cancelled) return;

                setByGenre({
                    ART: results[0].data?.content ?? [],
                    MUSIC: results[1].data?.content ?? [],
                    LITERATURE: results[2].data?.content ?? [],
                });
            } catch {
                if (!cancelled) {
                    setByGenre({ ART: [], MUSIC: [], LITERATURE: [] });
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        load();

        return () => {
            cancelled = true;
        };
    }, []);

    return (
        <Container className="py-4">
            {loading ? (
                <div className="d-flex justify-content-center py-5">
                    <Spinner animation="border" role="status" />
                </div>
            ) : (
                SECTIONS.map(({ genre, label, path }) => (
                    <section key={genre} className="mb-5">
                        <div className="d-flex align-items-baseline justify-content-between gap-2 mb-3">
                            <h2 className="h4 mb-0">{label}</h2>
                            <Link to={path} className="small text-decoration-none">
                                View all →
                            </Link>
                        </div>

                        {(byGenre[genre] ?? []).length === 0 ? (
                            <p className="text-muted mb-0">No works in this genre yet.</p>
                        ) : (
                            <Row xs={1} sm={2} md={3} lg={5} className="g-3">
                                {byGenre[genre].map((work) => (
                                    <Col key={work.workId}>
                                        <WorkCard work={work} />
                                    </Col>
                                ))}
                            </Row>
                        )}
                    </section>
                ))
            )}
        </Container>
    );
}

export default Home;
