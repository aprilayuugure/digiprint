const newProfile = {
    userId: null,
    backgroundImage: null,
    image: null,
    username: "",
    firstName: "",
    lastName: "",
    dateOfBirth: "",
    gender: "",
    location: "",
    biography: ""
}

export const profileInitialState = {
    profile: newProfile,
    errors: {},
    generalError: ""
}

export function ProfileReducer(state, action) {
    switch (action.type) {
        case "SET_PROFILE": 
            return {
                ...state,
                profile: {
                    ...state.profile,
                    ...action.payload
                },
                errors: {},
                generalError: ""
            };
        
        case "FIELD_CHANGE": 
            return {
                ...state,
                profile: {
                    ...state.profile,
                    [action.field]: action.value
                },
                errors: {
                    ...state.errors,
                    [action.field]: null
                }
            };

        case "UPDATE_SUCCESS": 
            return {
                ...state,
                profile: {
                    ...state.profile,
                    ...action.payload
                },
                errors: {},
                generalError: ""
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