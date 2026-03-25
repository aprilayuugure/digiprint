const newWork = {
    workId: null,
    genre: "",
    file: null,
    workSource: "",
    thumbnail: "",
    workTitle: "",
    workDescription: "",
    workUploadDate: "",
    rating: "",
    workTags: []
}

export const workInitialState = {
    work: newWork,

    pages: {},
    genre: "",

    page: 0,
    totalPages: 0,
    size: 10,

    filterArtistName: "",
    filterArtistAvatar: "",
    filterStartDate: "",
    filterEndDate: "",
    filterRating: "ALL",
    filterSort: "recent",

    tagInput: "",
    errors: {},
    generalError: ""
}

export function WorkReducer(state, action) {
    switch (action.type) {
        case "SET_WORK_PAGE":
            // `page` is the requested page index (0-based) from the caller.
            // Using it as the source of truth prevents any out-of-order responses
            // from overwriting the currently intended page.
            const pageIndex = action.page ?? action.payload?.page ?? state.page;
            return {
                ...state,        
                genre: action.genre,
                pages: {
                    ...state.pages,
                    [action.genre]: {
                        ...(state.pages[action.genre] || {}),
                        [pageIndex]: action.payload.content
                    }
                },
                page: pageIndex,
                totalPages: action.payload.totalPages,
                size: action.payload.size,
                errors: {},
                generalError: ""
            };

        case "SET_WORK": 
            return {
                ...state,
                work: action.payload,
                tagInput: action.payload.workTags?.map(tag => tag.tagName).join(" ") || "",
                errors: {},
                generalError: ""
            };

        case "SET_PAGE":
            return {
                ...state,
                page: action.payload,
                errors: {},
                generalError: ""
            };

        case "SET_TAG_INPUT":
            return {
                ...state,
                tagInput: action.payload
            };

        case "FIELD_CHANGE":
            return {
            ...state,
            work: {
                ...state.work,
                [action.field]: action.value
            }
        };

        case "ADD_WORK":
            return {
                ...state,
                pages: {
                    ...state.pages,
                    [state.genre]: {
                        ...(state.pages[state.genre] || {}),
                        [state.page]: [
                            action.payload,
                            ...(state.pages[state.genre]?.[state.page] || [])
                        ]
                    }
                },
                work: action.payload
            };

        case "UPDATE_WORK":
            return {
                ...state,
                pages: Object.fromEntries(
                    Object.entries(state.pages).map(([genre, pages]) => [
                        genre,
                        Object.fromEntries(
                            Object.entries(pages).map(([p, works]) => [
                                p,
                                works.map(w =>
                                    w.workId === action.payload.workId ? action.payload : w
                                        )
                                    ]
                                )
                            )
                        ])
                    ),
                work: action.payload,
                errors: {},
                generalError: ""
            };

        case "DELETE_WORK":
            return {
                ...state,
                pages: Object.fromEntries(
                    Object.entries(state.pages).map(([genre, pages]) => [
                        genre,
                        Object.fromEntries(
                            Object.entries(pages).map(([p, works]) => [
                                p,
                                works.filter(w => w.workId !== action.payload)       
                                ])
                            )
                        ])
                    ),
            };

        case "RESET_WORK":
            return {
                ...state,
                work: newWork,
                tagInput: ""
            };

        case "SET_FILTERS":
            return {
                ...state,
                filterArtistName: action.payload.filterArtistName ?? state.filterArtistName,
                filterArtistAvatar: action.payload.filterArtistAvatar ?? state.filterArtistAvatar,
                filterStartDate: action.payload.filterStartDate ?? state.filterStartDate,
                filterEndDate: action.payload.filterEndDate ?? state.filterEndDate,
                filterRating: action.payload.filterRating ?? state.filterRating,
                filterSort: action.payload.filterSort ?? state.filterSort,
            };

        case "SET_ERRORS":
            return {
                ...state,
                errors: action.payload.general ? {} : action.payload,
                generalError: action.payload.general || ""
            };

        case "CLEAR_ERRORS":
            return {
                ...state,
                errors: {},
                generalError: ""
            };

        default: return state;
    }
}