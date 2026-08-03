import ErrorResponse from '../../../common/utils/ErrorResponse.js';

const normalizeUserPermissions = (permissions = []) => {
    if (Array.isArray(permissions)) {
        return permissions.filter(Boolean);
    }

    if (!permissions || typeof permissions !== 'object') {
        return [];
    }

    return Object.entries(permissions)
        .filter(([, enabled]) => Boolean(enabled))
        .map(([key]) => key)
        .filter(Boolean);
};

export const requirePermission = (...requiredPermissions) => {
    return (req, res, next) => {
        const user = req.user || req.session?.user || req.session?.userData || null;
        const role = user?.role || req.role || null;
        const permissions = normalizeUserPermissions(user?.permissions || []);

        if (role === 'admin') {
            return next();
        }

        if (!requiredPermissions.length) {
            return next();
        }

        const hasRequiredPermission = requiredPermissions.some((permission) => permissions.includes(permission));
        if (!hasRequiredPermission) {
            return res.status(403).json({
                success: false,
                message: 'Permission denied',
            });
        }

        next();
    };
};

export const requireAnyPermission = (...permissions) => requirePermission(...permissions);
