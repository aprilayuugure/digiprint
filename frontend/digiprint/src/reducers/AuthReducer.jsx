export const initialState = {
  loginForm: {
    emailOrUsername: "",
    password: ""
  },

  registerForm: {
    email: "",
    password: "",
    role: ""
  },

  errors: {},
  generalError: ""
};

export function authReducer(state, action) {
  switch (action.type) {

    case "FIELD_CHANGE":
      return {
        ...state,
        [action.form]: {
          ...state[action.form],
          [action.field]: action.value
        }
      };

    case "LOGIN_FAILED":
      return {
        ...state,
        errors: action.payload?.general ? {} : action.payload,
        generalError: action.payload?.general || ""
      };

    case "REGISTER_SUCCESS":
      return {
        ...state,
        registerForm: initialState.registerForm,
        errors: {},
        generalError: ""
      };

    case "REGISTER_FAILED":
      return {
        ...state,
        errors: action.payload?.general ? {} : action.payload,
        generalError: action.payload?.general || ""
      };

    case "CLEAR_ERRORS":
      return {
        ...state,
        errors: {},
        generalError: ""
      };

    default:
      return state;
  }
}