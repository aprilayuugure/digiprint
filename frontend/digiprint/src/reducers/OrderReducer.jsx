import { normalizeOrder } from "../utils/orderNormalize";

const newOrder = {
    orderId: null,
    orderItems: [],
    price: 0,
    orderStatus: "",
    createdAt: "",
    completedAt: "",
    customerAccountId: null,
};

export const orderInitialState = {
    order: newOrder,

    page: 0,
    totalPages: 0,
    totalElements: 0,
    size: 10,
    content: [],

    filters: {
        status: "",
        customer: "",
        artist: "",
        priceMin: "",
        priceMax: "",
        createdAtFrom: "",
        createdAtTo: "",
        completedAtFrom: "",
        completedAtTo: "",
    },

    loading: false,
    errors: {},
    generalErrors: "",
};

export function OrderReducer(state, action) {
    switch (action.type) {
        case "SET_LOADING":
            return { ...state, loading: action.payload };
        case "SET_ERRORS":
            return {
                ...state,
                errors: action.payload?.general ? {} : (action.payload || {}),
                generalErrors: action.payload?.general || "",
                loading: false,
            };
        case "CLEAR_ERRORS":
            return {
                ...state,
                errors: {},
                generalErrors: "",
            };
        case "SET_FILTERS":
            return {
                ...state,
                filters: {
                    status: action.payload.status ?? state.filters.status,
                    customer: action.payload.customer ?? state.filters.customer,
                    artist: action.payload.artist ?? state.filters.artist,
                    priceMin: action.payload.priceMin ?? state.filters.priceMin,
                    priceMax: action.payload.priceMax ?? state.filters.priceMax,
                    createdAtFrom: action.payload.createdAtFrom ?? state.filters.createdAtFrom,
                    createdAtTo: action.payload.createdAtTo ?? state.filters.createdAtTo,
                    completedAtFrom: action.payload.completedAtFrom ?? state.filters.completedAtFrom,
                    completedAtTo: action.payload.completedAtTo ?? state.filters.completedAtTo,
                },
                page: 0,
            };
        case "SET_PAGE":
            return { ...state, page: action.payload };
        case "SET_ORDERS_PAGE": {
            const rawList = action.payload.content ?? [];
            const content = Array.isArray(rawList)
                ? rawList.map((o) => normalizeOrder(o)).filter(Boolean)
                : [];
            return {
                ...state,
                content,
                page: action.payload.page ?? 0,
                size: action.payload.size ?? state.size,
                totalPages: action.payload.totalPages ?? 0,
                totalElements: action.payload.totalElements ?? 0,
                loading: false,
                errors: {},
                generalErrors: "",
            };
        }
        case "RESET":
            return { ...orderInitialState };
        default:
            return state;
    }
}
