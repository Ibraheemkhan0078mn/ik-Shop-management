import { normalizeUserPermissions } from "./permissionUtils.js";

export const ROUTE_PERMISSIONS = {
    "/dashboard/analytics": "dashboard.view",
    "/dashboard/quick-actions": "dashboard.view",
    "/pos": "pos.view",
    "/staff/pos": "pos.view",
    "/products": "products.view",
    "/products/create": "products.create",
    "/products/view": "products.view",
    "/products/edit": "products.update",
    "/products/delete": "products.delete",
    "/products/import": "products.create",
    "/products/export": "products.view",
    "/purchases": "purchases.view",
    "/purchases/create": "purchases.create",
    "/purchases/view": "purchases.view",
    "/purchases/edit": "purchases.update",
    "/purchases/delete": "purchases.delete",
    "/purchases/import": "purchases.create",
    "/purchases/export": "purchases.view",
    "/purchase": "purchases.view",
    "/purchase/create": "purchases.create",
    "/purchase/view": "purchases.view",
    "/purchase/edit": "purchases.update",
    "/purchase/delete": "purchases.delete",
    "/purchase/import": "purchases.create",
    "/purchase/export": "purchases.view",
    "/expenses/business": "expenses.view",
    "/reports": "reports.view",
    "/reports/sales": "reports.view",
    "/reports/purchases": "reports.view",
    "/reports/expenses": "reports.view",
    "/reports/inventory": "reports.view",
    "/accounts": "accounts.view",
    "/accounts/balance": "accounts.view",
    "/accounts/transactions": "accounts.view",
    "/staff": "staff.view",
    "/staff/create": "staff.create",
    "/staff/view": "staff.view",
    "/staff/edit": "staff.update",
    "/staff/delete": "staff.delete",
    "/settings/users": "users.manage",
    "/settings/profile": "settings.view",
    "/settings/general": "settings.view",
};

export const checkPermission = (pathname, userPermissions, userRole) => {
    if (userRole === "admin") return true;

    const matchedRoute = Object.keys(ROUTE_PERMISSIONS)
        .sort((a, b) => b.length - a.length)
        .find((route) => pathname.startsWith(route));

    if (!matchedRoute) return true;

    const requiredPermissionKey = ROUTE_PERMISSIONS[matchedRoute];
    const normalizedPermissions = normalizeUserPermissions(userPermissions);

    return normalizedPermissions.includes(requiredPermissionKey);
};