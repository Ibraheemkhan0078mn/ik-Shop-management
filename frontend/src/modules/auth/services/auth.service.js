import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { login, logout } from "../slices/authSlice.js";
import { useLoginMutation, useSignupMutation, useLogoutMutation, useGetUserQuery } from "../api/authApi.js";
import { toast } from "sonner";

export const useUser = () => useGetUserQuery();

export const useLogin = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const [loginMutation] = useLoginMutation();

    const handleLogin = async (data) => {
        try {
            const result = await loginMutation(data).unwrap();
            dispatch(login(result.data));
            toast.success("Login Successful");
            navigate("/quick-list");
        } catch (error) {
            const errorMessage = error.response?.data?.message || error.data?.message || "Login Failed";
            toast.error(errorMessage);
        }
    };

    return handleLogin;
};

export const useSignup = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const [signupMutation] = useSignupMutation();

    const handleSignup = async (data) => {
        try {
            const result = await signupMutation(data).unwrap();
            dispatch(login(result.data));
            toast.success("Signup Successful");
            navigate("/quick-list");
        } catch (error) {
            const errorMessage = error.response?.data?.message || error.data?.message || "Signup Failed";
            toast.error(errorMessage);
        }
    };

    return handleSignup;
};

export const useLogout = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const [logoutMutation] = useLogoutMutation();

    const handleLogout = async () => {
        try {
            localStorage.removeItem("savedCredentials");
            await logoutMutation().unwrap();
            dispatch(logout());
            navigate("/");
            toast.success("Logout Successful");
        } catch (error) {
            const errorMessage = error.response?.data?.message || error.data?.message || "Logout Failed";
            toast.error(errorMessage);
            // Even if API fails, clear local state and navigate
            dispatch(logout());
            navigate("/");
        }
    };

    return handleLogout;
};
