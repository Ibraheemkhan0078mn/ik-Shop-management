import { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useGetSettingsQuery } from "../api/settings.api.js";
import { setSettings, setLoading, setError, clearSettings } from "../slices/settingsSlice.js";

export const useSettings = () => {
    const dispatch = useDispatch();
    const { id: userId } = useSelector(s => s.auth) || {};
    const settingsState = useSelector(s => s.settings);
    
    // Query settings if not in Redux
    const { data: apiData, isLoading: apiLoading, error: apiError, refetch } = useGetSettingsQuery(userId, {
        skip: !userId, // Always query if userId exists, let the hook handle caching
    });

    useEffect(() => {
        if (apiData?.data) {
            // Always update Redux with latest API data
            dispatch(setSettings(apiData.data));
        }
    }, [apiData, dispatch]);

    useEffect(() => {
        dispatch(setLoading(apiLoading));
    }, [apiLoading, dispatch]);

    useEffect(() => {
        if (apiError) {
            dispatch(setError(apiError.message));
        }
    }, [apiError, dispatch]);

    // Return settings from Redux
    const settings = settingsState.data || null;
    const isLoading = settingsState.isLoading || apiLoading;
    const error = settingsState.error || apiError;

    return { settings, isLoading, error, refetch };
};
