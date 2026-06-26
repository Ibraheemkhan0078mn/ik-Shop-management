import { createSlice } from "@reduxjs/toolkit";

const initialState = {
    id: null,
    name: null,
    email: null,
    phoneNo: null,
    role: null,
};

const authSlice = createSlice({
    name: "auth",
    initialState,
    reducers: {
        login: (state, action) => {
            state.id = action.payload.id;
            state.name = action.payload.name;
            state.email = action.payload.email;
            state.phoneNo = action.payload.phoneNo;
            state.role = action.payload.role;
        },
        logout: (state) => {
            state.id = null;
            state.name = null;
            state.email = null;
            state.phoneNo = null;
            state.role = null;
        },
    },
});
export const { login, logout } = authSlice.actions;
export default authSlice.reducer;
