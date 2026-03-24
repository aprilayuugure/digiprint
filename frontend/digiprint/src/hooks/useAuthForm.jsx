import { useReducer } from "react";
import { authReducer, initialState } from "../reducers/AuthReducer";


export function useAuthForm() {
    const [state, dispatch] = useReducer(authReducer, initialState);

    const handleFieldChange = (form, field, value) => {
        dispatch({
            type: "FIELD_CHANGE",
            form, 
            field,
            value
        });
    };

    return {
        state,
        dispatch,
        handleFieldChange
    };
}