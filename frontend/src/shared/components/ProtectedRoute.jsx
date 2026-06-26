import { useSelector } from "react-redux";
import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ children }) {
    const userId = useSelector(s => s.auth?.id);

    if (!userId) {
        return <Navigate to="/" replace />;
    }

    return children;
}
