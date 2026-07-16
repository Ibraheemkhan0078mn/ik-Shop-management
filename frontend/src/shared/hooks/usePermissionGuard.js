import { useMemo } from 'react';
import { useUser } from '../../modules/auth/services/auth.service.js';
import { useSettings } from '../../modules/settings/hooks/useSettings.js';
import { hasPermission as checkPermission } from '../utilities/permissions.js';

/**
 * Local hook for permission guard functionality
 * Returns user data, settings data, and permission checking logic
 */
export const usePermissionGuard = () => {
    const { data: userQuery, isLoading: userLoading } = useUser();
    const { settings, isLoading: settingsLoading } = useSettings();

    const user = userQuery?.data;
    const settingsData = settings;
    const isLoading = userLoading || settingsLoading;

    const isAdmin = useMemo(() => {
        return user?.role === 'admin' || user?.role === 'owner';
    }, [user?.role]);

    const hasPermission = useMemo(() => {
        return (permission) => {
            if (!user || !permission) return false;
            if (isAdmin) return true;
            return checkPermission(user.permissions, permission);
        };
    }, [user, isAdmin]);

    return {
        user,
        settingsData,
        isLoading,
        isAdmin,
        hasPermission
    };
};
