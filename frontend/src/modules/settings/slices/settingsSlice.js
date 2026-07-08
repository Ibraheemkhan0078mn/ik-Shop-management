import { createSlice } from "@reduxjs/toolkit";

const initialState = {
    data: null,
    isLoading: false,
    error: null,
};

const settingsSlice = createSlice({
    name: "settings",
    initialState,
    reducers: {
        setSettings: (state, action) => {
            state.data = action.payload;
            state.isLoading = false;
            state.error = null;
        },
        setLoading: (state, action) => {
            state.isLoading = action.payload;
        },
        setError: (state, action) => {
            state.error = action.payload;
            state.isLoading = false;
        },
        clearSettings: (state) => {
            state.data = null;
            state.isLoading = false;
            state.error = null;
        },
    },
});

export const { setSettings, setLoading, setError, clearSettings } = settingsSlice.actions;
export default settingsSlice.reducer;
