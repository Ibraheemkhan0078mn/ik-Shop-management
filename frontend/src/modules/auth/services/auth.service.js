import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { login, logout } from "../slices/authSlice.js";
import { AuthService } from "../api/authApi.js";
import { toast } from "sonner";

export const AUTH_QUERY_KEYS = {
    user: ["authUser"],
};

export const useUser = () => {
    return useQuery({
        queryKey: AUTH_QUERY_KEYS.user,
        queryFn: AuthService.getUser,
        retry: false,
        staleTime: 1000 * 60 * 10,
    });
};

export const useLogin = () => {
    const queryClient = useQueryClient();
    const navigate = useNavigate();
    const dispatch = useDispatch();

    return useMutation({
        mutationFn: AuthService.login,
        onSuccess: (data) => {
            queryClient.setQueryData(AUTH_QUERY_KEYS.user, data);
            dispatch(login(data.data));
            toast.success("Login Successful");
            navigate("/dashboard/analytics");
        },
        onError: (error) => {
            toast.error(error.response.data.message);
        },
    });
};

export const useSignup = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    return useMutation({
        mutationFn: AuthService.signup,
        onSuccess: (data) => {
            toast.success("Signup Successful");
            dispatch(login(data.data));
            navigate("/dashboard/analytics");
        },
        onError: (error) => {
            toast.error(error.response.data.message);
        },
    });
};

export const useLogout = () => {
    const queryClient = useQueryClient();
    const navigate = useNavigate();
    const dispatch = useDispatch();
    return useMutation({
        mutationFn: AuthService.logout,
        onSuccess: () => {
            queryClient.removeQueries({ queryKey: AUTH_QUERY_KEYS.user });
            dispatch(logout());
            navigate("/login");
            toast.success("Logout Successful");
        },
        onError: (error) => {
            toast.error(error.response.data.message);
        },
    });
};
