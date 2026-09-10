import { useSelector } from "react-redux";
import { Navigate } from "react-router-dom";
import { hasPermission } from "../utilities/permissionUtils.js";

export default function ProtectedRoute({ children, permission, adminOnly = false }) {
    const { id: userId, role, permissions = [] } = useSelector(s => s.auth || {});

    if (!userId) {
        return <Navigate to="/" replace />;
    }

    if (adminOnly && role !== "admin") {
        return <Navigate to="/quick-list" replace />;
    }

    if (permission && role !== "admin" && !hasPermission(permissions, permission)) {
        return <Navigate to="/quick-list" replace />;
    }

    return children;
}
