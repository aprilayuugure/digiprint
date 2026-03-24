import { useReducer } from "react";
import { profileInitialState, ProfileReducer } from "../reducers/ProfileReducer";
import ProfileService from "../services/ProfileService";

export function useProfile() {
    const [state, dispatch] = useReducer(ProfileReducer, profileInitialState);

    const handleFieldChange = (field, value) => {
        dispatch({
            type: "FIELD_CHANGE",
            field,
            value
        });
    };

    const getMyProfile = async () => {
        try {
            const res = await ProfileService.getMyProfile();

            dispatch({
                type: "SET_PROFILE",
                payload: res.data
            });

            return true;
        }
        catch (error) {
            dispatch({
                type: "SET_ERRORS",
                payload: error.response?.data || { general: "Cannot load profile" }
            });

            return false;
        }
    }

    const updateMyProfile = async (data) => {
        try {
            const formData = new FormData();

            if (data.backgroundImage instanceof File) formData.append("backgroundImage", data.backgroundImage);
            if (data.image instanceof File) formData.append("image", data.image);

            formData.append("username", data.username);
            formData.append("firstName", data.firstName);
            formData.append("lastName", data.lastName);
            formData.append("dateOfBirth", data.dateOfBirth);
            formData.append("gender", data.gender);
            formData.append("location", data.location);
            formData.append("biography", data.biography);

            const res = await ProfileService.updateMyProfile(formData);

            console.log("UPDATE RESPONSE", res.data);

            dispatch({
                type: "UPDATE_SUCCESS",
                payload: res.data
            });

            return true;
        }
        catch (error)
        {
            dispatch({
                type: "SET_ERRORS",
                payload: error.response?.data || { general: "Cannot update profile" }
            });

            return false;
        }
    }

    return {
        state,
        handleFieldChange,
        getMyProfile,
        updateMyProfile
    }
}