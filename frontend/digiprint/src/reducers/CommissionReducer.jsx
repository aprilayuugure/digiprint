const newCommission = {
    commissionId: null,
    commissionType: "",
    commissionPrice: 0,
    commissionDescription: "",
    genre: "",
    userId: null,
};

export const commissionInitialState = {
    commission: newCommission,

    filters: {
        genre: "",
        priceMin: "",
        priceMax: "",
    },

    commissions: [],

    loading: false,
    errors: {},
    generalErrors: "",
};

export function CommissionReducer(state, action) {
    switch (action.type) {
        case "SET_LOADING":
            return { ...state, loading: action.payload };

        case "SET_ERRORS":
            return {
                ...state,
                errors: action.payload?.general ? {} : action.payload || {},
                generalErrors: action.payload?.general || "",
                loading: false,
            };

        case "CLEAR_ERRORS":
            return { ...state, errors: {}, generalErrors: "", loading: false };

        case "SET_FILTERS":
            return {
                ...state,
                filters: {
                    genre: action.payload.genre ?? state.filters.genre,
                    priceMin: action.payload.priceMin ?? state.filters.priceMin,
                    priceMax: action.payload.priceMax ?? state.filters.priceMax,
                },
            };

        case "SET_COMMISSIONS":
            return {
                ...state,
                commissions: action.payload ?? [],
                loading: false,
                errors: {},
                generalErrors: "",
            };

        case "RESET":
            return { ...commissionInitialState };

        default:
            return state;
    }
}

/** Form modal add/edit commission — cùng kiểu errors + generalError như ProfileReducer */
export const commissionModalInitialState = {
    commissionType: "",
    commissionPrice: "",
    commissionDescription: "",
    genre: null,
    newFiles: [],
    existingPaths: [],
    errors: {},
    generalError: "",
};

/**
 * @param {typeof commissionModalInitialState} state
 * @param {{ type: string, [key: string]: unknown }} action
 */
export function commissionModalReducer(state, action) {
    switch (action.type) {
        case "RESET":
            return { ...commissionModalInitialState };

        case "LOAD_DRAFT": {
            const p = action.payload || {};
            return {
                ...commissionModalInitialState,
                commissionType: p.commissionType ?? "",
                commissionPrice: String(p.commissionPrice ?? ""),
                commissionDescription: p.commissionDescription ?? "",
                genre: p.genre ?? null,
                existingPaths: Array.isArray(p.attachedFiles) ? [...p.attachedFiles] : [],
            };
        }

        case "FIELD_CHANGE": {
            const field = action.field;
            const value = action.value;
            const nextErrors = { ...state.errors };
            if (field) delete nextErrors[field];
            return {
                ...state,
                [field]: value,
                errors: nextErrors,
                generalError: "",
            };
        }

        case "GENRE_CHANGE": {
            const nextGenre = action.genre;
            const nextErrors = { ...state.errors };
            delete nextErrors.genre;
            return {
                ...state,
                genre: nextGenre,
                newFiles: [],
                existingPaths: [],
                errors: nextErrors,
                generalError: "",
            };
        }

        case "ADD_NEW_FILES":
            return {
                ...state,
                newFiles: [...state.newFiles, ...(action.payload || [])],
            };

        case "REMOVE_NEW_FILE":
            return {
                ...state,
                newFiles: state.newFiles.filter((a) => a.id !== action.id),
            };

        case "REMOVE_EXISTING_PATH":
            return {
                ...state,
                existingPaths: state.existingPaths.filter((p) => p !== action.path),
            };

        case "SET_ERRORS":
            return {
                ...state,
                errors: action.payload?.errors ?? {},
                generalError: action.payload?.generalError ?? "",
            };

        case "CLEAR_ERRORS":
            return { ...state, errors: {}, generalError: "" };

        default:
            return state;
    }
}

