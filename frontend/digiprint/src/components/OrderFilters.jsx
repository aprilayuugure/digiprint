import { useEffect, useMemo, useState } from "react";
import { Form, Row, Col, Button, Spinner } from "react-bootstrap";
import UserService from "../services/UserService";

const STATUS_OPTIONS = [
    { value: "", label: "All statuses" },
    { value: "PENDING", label: "Pending" },
    { value: "ACCEPTED", label: "Accepted" },
    { value: "IN_PROGRESS", label: "In progress" },
    { value: "CANCELLED", label: "Cancelled" },
    { value: "COMPLETED", label: "Completed" },
    { value: "DRAFT", label: "Draft" },
    { value: "REJECTED", label: "Rejected" },
];

function OrderFilters({
    filters,
    onFiltersChange,
    onApply,
    showCustomerFilter = true,
    showArtistFilter = true,
}) {
    const [artistSuggestions, setArtistSuggestions] = useState([]);
    const [customerSuggestions, setCustomerSuggestions] = useState([]);
    const [searchingArtist, setSearchingArtist] = useState(false);
    const [searchingCustomer, setSearchingCustomer] = useState(false);

    useEffect(() => {
        if (!showArtistFilter) return;
        const q = String(filters.artist || "").trim();
        if (!q) {
            setArtistSuggestions([]);
            setSearchingArtist(false);
            return;
        }
        let cancelled = false;
        const t = setTimeout(async () => {
            setSearchingArtist(true);
            try {
                const res = await UserService.searchCreators(q);
                if (cancelled) return;
                const list = Array.isArray(res.data) ? res.data : [];
                setArtistSuggestions(list.map((u) => u.username).filter(Boolean));
            } catch {
                if (!cancelled) setArtistSuggestions([]);
            } finally {
                if (!cancelled) setSearchingArtist(false);
            }
        }, 300);
        return () => {
            cancelled = true;
            clearTimeout(t);
        };
    }, [filters.artist, showArtistFilter]);

    useEffect(() => {
        if (!showCustomerFilter) return;
        const q = String(filters.customer || "").trim();
        if (!q) {
            setCustomerSuggestions([]);
            setSearchingCustomer(false);
            return;
        }
        let cancelled = false;
        const t = setTimeout(async () => {
            setSearchingCustomer(true);
            try {
                const res = await UserService.searchCreators(q);
                if (cancelled) return;
                const list = Array.isArray(res.data) ? res.data : [];
                setCustomerSuggestions(list.map((u) => u.username).filter(Boolean));
            } catch {
                if (!cancelled) setCustomerSuggestions([]);
            } finally {
                if (!cancelled) setSearchingCustomer(false);
            }
        }, 300);
        return () => {
            cancelled = true;
            clearTimeout(t);
        };
    }, [filters.customer, showCustomerFilter]);

    const artistSuggestionNames = useMemo(
        () => [...new Set((artistSuggestions || []).filter(Boolean))],
        [artistSuggestions]
    );
    const customerSuggestionNames = useMemo(
        () => [...new Set((customerSuggestions || []).filter(Boolean))],
        [customerSuggestions]
    );

    const handleClear = () => {
        onFiltersChange?.({
            status: "",
            customer: "",
            artist: "",
            priceMin: "",
            priceMax: "",
        });
    };

    return (
        <Form className="mb-4" onSubmit={(e) => { e.preventDefault(); onApply?.(); }}>
            <Row className="g-2 align-items-end mb-2">
                {showArtistFilter ? (
                    <Col xs={12} md={6}>
                        <Form.Label className="small mb-1">Artist</Form.Label>
                        <Form.Control
                            type="text"
                            list="order-filter-artist-list"
                            value={filters.artist}
                            onChange={(e) => onFiltersChange?.({ artist: e.target.value })}
                            placeholder="Search artist username..."
                        />
                        <datalist id="order-filter-artist-list">
                            {artistSuggestionNames.map((u) => (
                                <option key={u} value={u} />
                            ))}
                        </datalist>
                        {searchingArtist ? (
                            <div className="small text-muted mt-1">
                                <Spinner animation="border" size="sm" className="me-1" />
                                Searching artist...
                            </div>
                        ) : null}
                    </Col>
                ) : null}

                {!showArtistFilter && showCustomerFilter ? (
                    <Col xs={12} md={6}>
                        <Form.Label className="small mb-1">Customer</Form.Label>
                        <Form.Control
                            type="text"
                            list="order-filter-customer-list"
                            value={filters.customer}
                            onChange={(e) => onFiltersChange?.({ customer: e.target.value })}
                            placeholder="Search customer username..."
                        />
                        <datalist id="order-filter-customer-list">
                            {customerSuggestionNames.map((u) => (
                                <option key={u} value={u} />
                            ))}
                        </datalist>
                        {searchingCustomer ? (
                            <div className="small text-muted mt-1">
                                <Spinner animation="border" size="sm" className="me-1" />
                                Searching customer...
                            </div>
                        ) : null}
                    </Col>
                ) : null}
            </Row>

            <Row className="g-3 align-items-end mb-2">
                <Col xs={12} md={4}>
                    <Form.Label className="small mb-1">Status</Form.Label>
                    <Form.Select
                        value={filters.status}
                        onChange={(e) => onFiltersChange?.({ status: e.target.value })}
                    >
                        {STATUS_OPTIONS.map((o) => (
                            <option key={o.value || "all"} value={o.value}>
                                {o.label}
                            </option>
                        ))}
                    </Form.Select>
                </Col>

                <Col xs={12} md={8}>
                    <Row className="g-2">
                        <Col xs={6}>
                            <Form.Label className="small mb-1">Price min</Form.Label>
                            <Form.Control
                                type="number"
                                min={0}
                                step={1}
                                value={filters.priceMin}
                                onChange={(e) => onFiltersChange?.({ priceMin: e.target.value })}
                                placeholder="Any"
                            />
                        </Col>
                        <Col xs={6}>
                            <Form.Label className="small mb-1">Price max</Form.Label>
                            <Form.Control
                                type="number"
                                min={0}
                                step={1}
                                value={filters.priceMax}
                                onChange={(e) => onFiltersChange?.({ priceMax: e.target.value })}
                                placeholder="Any"
                            />
                        </Col>
                    </Row>
                </Col>

                <Col xs={12} md={12}>
                    <Button type="button" variant="link" className="p-0" onClick={handleClear}>
                        Clear
                    </Button>
                </Col>
            </Row>

            <Row>
                <Col xs={12} className="d-flex justify-content-end">
                    <Button type="submit" variant="primary">
                        Apply filters
                    </Button>
                </Col>
            </Row>
        </Form>
    );
}

export default OrderFilters;

