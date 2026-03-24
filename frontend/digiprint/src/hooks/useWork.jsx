import { useReducer, useCallback } from "react";
import { workInitialState, WorkReducer } from "../reducers/WorkReducer";
import WorkService from "../services/WorkService";

export function useWork() {
    const [state, dispatch] = useReducer(WorkReducer, workInitialState);

    const handleFieldChange = (field, value) => {
        dispatch({
            type: "FIELD_CHANGE", 
            field,
            value
        });
    };

    const parseTags = (value) => {
        return value.trim().split(/\s+/).filter(t => t);
    }

    const handleTagChange = (value) => {
        dispatch({
            type: "SET_TAG_INPUT",
            payload: value
        });

        const tags = parseTags(value);

        dispatch({
            type: "FIELD_CHANGE",
            field: "workTags",
            value: tags
        });
    };

    const getWorkById = useCallback(async (id) => {
        try {
            const res = await WorkService.getWorkById(id);

            dispatch({
                type: "SET_WORK",
                payload: res.data,
            });

            return true;
        } catch (error) {
            dispatch({
                type: "SET_ERRORS",
                payload: error.response?.data || { general: "Cannot load works" },
            });

            return false;
        }
    }, []);

    const getWorksPageByGenre = useCallback( async (genre, page = 0) => {
        if (state.pages[genre]?.[page]) {
            dispatch({
                type: "SET_PAGE",
                payload: page
            });

            return true;
        }

        try {
            const res = await WorkService.getWorksPageByGenre(genre, page, state.size);

            dispatch({
                type: "SET_WORK_PAGE",
                genre: genre,
                payload: res.data
            });
            

            return true;
        }
        catch (error) {
            dispatch({
                type: "SET_ERRORS",
                payload: error.response?.data || { general: "Cannot load works" }
            });

            return false;
        }
    }, [state.size, state.pages]);


    const searchWorks = useCallback(
        async (genre, { artistName, startDate, endDate, tags, ratings, sort }, page = 0) => {
            try {
                const res = await WorkService.searchWorks(genre, {
                    artistName,
                    startDate,
                    endDate,
                    tags,
                    ratings,
                    sort,
                    page,
                    size: state.size,
                });

                dispatch({
                    type: "SET_WORK_PAGE",
                    genre: genre,
                    payload: res.data,
                });

                return true;
            } catch (error) {
                dispatch({
                    type: "SET_ERRORS",
                    payload: error.response?.data || { general: "Cannot load works" },
                });

                return false;
            }
        },
        [state.size]
    );

    const setFilters = (partial) => {
        dispatch({
            type: "SET_FILTERS",
            payload: {
                filterArtistName: partial.filterArtistName,
                filterStartDate: partial.filterStartDate,
                filterEndDate: partial.filterEndDate,
                filterRating: partial.filterRating,
                filterSort: partial.filterSort,
            },
        });
    };

    const saveWork = async (data) => {
        try {
            const formData = new FormData();

            if (data.file instanceof File) formData.append("file", data.file);
            
            if (data.workId) formData.append("workId", data.workId);

            formData.append("genre", data.genre);
            formData.append("rating", data.rating);
            formData.append("workTitle", data.workTitle);
            formData.append("workDescription", data.workDescription);
            
            (data.workTags || []).forEach((tag) => {
                const name = typeof tag === "string" ? tag : tag?.tagName;
                if (name) formData.append("workTags", name);
            });

            let res;

            if (data.workId) {
                res = await WorkService.updateWork(data.workId, formData);

                dispatch({
                    type: "UPDATE_WORK",
                    payload: res.data
                });
            } 
            else {
                res = await WorkService.addWork(formData);

                dispatch({
                    type: "ADD_WORK",
                    payload: res.data
                });
            }

            dispatch({
                type: "SET_WORK",
                payload: res.data
            });

            if (!data.workId) {
                await getWorksPageByGenre(data.genre, 0);
            } 
            else 
            {
                await getWorksPageByGenre(data.genre, state.page);
            }

            return true;
        }
        catch (error) {
            dispatch({
                type: "SET_ERRORS",
                payload: error.response?.data || { general: "Cannot upload work" }
            });

            return false;
        }
    }

    return {
        state,
        handleFieldChange,
        handleTagChange,
        getWorkById,
        getWorksPageByGenre,
        saveWork,
        searchWorks,
        setFilters,
    }
}