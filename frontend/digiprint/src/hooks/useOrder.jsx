import { useReducer, useCallback } from "react";
import { orderInitialState, OrderReducer } from "../reducers/OrderReducer";
import OrderService from "../services/OrderService";

export function useOrder() {
    const [state, dispatch] = useReducer(OrderReducer, orderInitialState);

    const setFilters = useCallback((partial) => {
        dispatch({ type: "SET_FILTERS", payload: partial });
    }, []);

    const toOptionalNumber = (v) => {
        if (v === "" || v === null || v === undefined) return undefined;
        const n = Number(v);
        return Number.isNaN(n) ? undefined : n;
    };

    const fetchOrders = useCallback(
        async (pageIndex, opts = {}) => {
            dispatch({ type: "SET_LOADING", payload: true });
            dispatch({ type: "CLEAR_ERRORS" });
            try {
                const f = state.filters;
                const res = await OrderService.searchOrders({
                    status: f.status || undefined,
                    customer: f.customer?.trim() || undefined,
                    artist: f.artist?.trim() || undefined,
                    priceMin: toOptionalNumber(f.priceMin),
                    priceMax: toOptionalNumber(f.priceMax),
                    createdAtFrom: f.createdAtFrom || undefined,
                    createdAtTo: f.createdAtTo || undefined,
                    completedAtFrom: f.completedAtFrom || undefined,
                    completedAtTo: f.completedAtTo || undefined,
                    artistOrderMode: opts.artistOrderMode,
                    page: pageIndex,
                    size: state.size,
                });
                dispatch({ type: "SET_ORDERS_PAGE", payload: res.data });
            } catch (err) {
                dispatch({
                    type: "SET_ERRORS",
                    payload: err.response?.data?.general
                        ? err.response.data
                        : { general: err.response?.data?.message || "Failed to load orders" },
                });
            }
        },
        [state.filters, state.size]
    );

    return {
        state,
        dispatch,
        setFilters,
        fetchOrders,
    };
}

