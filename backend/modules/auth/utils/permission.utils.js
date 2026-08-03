export const normalizePermissions = (permissions = []) => {
  if (Array.isArray(permissions)) {
    return permissions.filter(Boolean);
  }

  if (!permissions || typeof permissions !== 'object') {
    return [];
  }

  const legacyMap = {
    dashboard: 'dashboard.view',
    pos: 'pos.view',
    products: 'products.view',
    purchases: 'purchases.view',
    expenses: 'expenses.view',
    reports: 'reports.view',
    accounts: 'accounts.view',
    staff: 'staff.view',
    manageUsers: 'users.manage',
    settings: 'settings.view',
  };

  return Object.entries(permissions)
    .filter(([, enabled]) => Boolean(enabled))
    .map(([key]) => legacyMap[key] || key)
    .filter(Boolean);
};
