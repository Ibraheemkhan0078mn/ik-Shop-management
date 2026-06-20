import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { login, logout } from "../slices/authSlice.js";
import { useLoginMutation, useSignupMutation, useLogoutMutation, useGetUserQuery } from "../api/authApi.js";
import { toast } from "sonner";

export const useUser = () => {
    return useGetUserQuery();
};

export const useLogin = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const [loginMutation] = useLoginMutation();

    const handleLogin = async (data) => {
        try {
            const result = await loginMutation(data).unwrap();
            dispatch(login(result.data));
            toast.success("Login Successful");
            navigate("/dashboard");
        } catch (error) {
            toast.error(error.response?.data?.message || "Login Failed");
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
            navigate("/dashboard");
        } catch (error) {
            toast.error(error.response?.data?.message || "Signup Failed");
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
            await logoutMutation().unwrap();
            dispatch(logout());
            navigate("/login");
            toast.success("Logout Successful");
        } catch (error) {
            toast.error(error.response?.data?.message || "Logout Failed");
        }
    };

    return handleLogout;
};
