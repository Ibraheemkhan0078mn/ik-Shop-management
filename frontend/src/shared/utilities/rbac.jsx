export const ROUTE_PERMISSIONS = {
    "/dashboard/analytics": "dashboard",
    "/dashboard/quick-actions": "dashboard",
    "/pos": "pos",
    "/staff/pos": "pos",
    "/products": "products",
    "/products/create": "products",
    "/products/view": "products",
    "/products/edit": "products",
    "/products/delete": "products",
    "/products/import": "products",
    "/products/export": "products",
    "/purchases": "purchases",
    "/purchases/create": "purchases",
    "/purchases/view": "purchases",
    "/purchases/edit": "purchases",
    "/purchases/delete": "purchases",
    "/purchases/import": "purchases",
    "/purchases/export": "purchases",
    "/purchase": "purchases",
    "/purchase/create": "purchases",
    "/purchase/view": "purchases",
    "/purchase/edit": "purchases",
    "/purchase/delete": "purchases",
    "/purchase/import": "purchases",
    "/purchase/export": "purchases",
    "/expenses/business": "expenses",
    "/reports": "reports",
    "/reports/sales": "reports",
    "/reports/purchases": "reports",
    "/reports/expenses": "reports",
    "/reports/inventory": "reports",
    "/accounts": "accounts",
    "/accounts/balance": "accounts",
    "/accounts/transactions": "accounts",
    "/staff": "staff",
    "/staff/create": "staff",
    "/staff/view": "staff",
    "/staff/edit": "staff",
    "/staff/delete": "staff",
    "/settings/users": "manageUsers",
    "/settings/profile": "settings",
    "/settings/general": "settings",
};

export const checkPermission = (pathname, userPermissions, userRole) => {
    if (userRole === "admin") return true;

    const matchedRoute = Object.keys(ROUTE_PERMISSIONS)
        .sort((a, b) => b.length - a.length)
        .find((route) => pathname.startsWith(route));

    if (!matchedRoute) return true;

    const requiredPermissionKey = ROUTE_PERMISSIONS[matchedRoute];

    return !!userPermissions?.[requiredPermissionKey];
};