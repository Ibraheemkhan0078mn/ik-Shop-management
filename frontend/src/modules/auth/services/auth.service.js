import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { login, logout } from "../slices/authSlice.js";
import { useLoginMutation, useSignupMutation, useLogoutMutation, useGetUserQuery } from "./authApi.js";
import { toast } from "sonner";

export const useUser = () => {
    const userId = useSelector((state) => state.auth.id);
    return useGetUserQuery(userId, { skip: !userId });
};

export const useLogin = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const [loginMutation] = useLoginMutation();

    const handleLogin = async (data) => {
        try {
            const result = await loginMutation(data).unwrap();
            dispatch(login(result.data));
            
            // Show role-aware login message
            let loginMessage = result.message || "Login Successful";
            if (result.data?.role === 'admin') {
                loginMessage += " (Admin - All data preserved)";
            } else if (result.data?.role !== 'admin') {
                loginMessage += " (Staff - Local data optimized)";
            }
            
            toast.success(loginMessage);
            navigate("/quick-list");
            
            // Return the response data for the caller
            return {
                data: result.data,
                message: result.message,
                role: result.data?.role
            };
        } catch (error) {
            const errorMessage = error.response?.data?.message || error.data?.message || "Login Failed";
            toast.error(errorMessage);
            throw error; // Re-throw so caller can handle it
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
            toast.success(result.message || "Signup Successful");
            navigate("/quick-list");
            
            // Return the response data for the caller to access connection info
            return {
                savedToOnline: result.savedToOnline,
                onlineConnected: result.onlineConnected,
                data: result.data,
                message: result.message
            };
        } catch (error) {
            const errorMessage = error.response?.data?.message || error.data?.message || "Signup Failed";
            toast.error(errorMessage);
            throw error; // Re-throw so AuthPage can handle it
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
