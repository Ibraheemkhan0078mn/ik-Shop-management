/**
 * Permission utilities that work with backend permissions
 * Dynamically categorizes permissions based on their structure
 */

/**
 * Categorize permissions from backend into groups
 * @param {string[]} permissions - Array of permission strings from backend
 * @returns {Array} - Array of permission groups with module, label, and actions
 */
export const categorizePermissions = (permissions = []) => {
  if (!Array.isArray(permissions) || permissions.length === 0) {
    return [];
  }

  const moduleMap = new Map();

  permissions.forEach(permission => {
    if (!permission || typeof permission !== 'string') return;

    const parts = permission.split('.');
    if (parts.length < 2) return;

    const module = parts[0];
    const action = parts.slice(1).join('.');

    if (!moduleMap.has(module)) {
      moduleMap.set(module, {
        module,
        label: formatModuleLabel(module),
        actions: []
      });
    }

    const group = moduleMap.get(module);
    if (!group.actions.find(a => a.key === action)) {
      group.actions.push({
        key: action,
        label: formatActionLabel(action)
      });
    }
  });

  // Sort modules alphabetically
  return Array.from(moduleMap.values()).sort((a, b) => 
    a.module.localeCompare(b.module)
  );
};

/**
 * Format module name to readable label
 */
const formatModuleLabel = (module) => {
  return module
    .split(/(?=[A-Z])/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

/**
 * Format action name to readable label
 */
const formatActionLabel = (action) => {
  return action
    .split(/(?=[A-Z])/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
    .replace(/\./g, ' ');
};

/**
 * Normalize user permissions to array format
 * @param {Array|Object} permissions - Permissions from backend
 * @returns {Array} - Normalized array of permission strings
 */
export const normalizeUserPermissions = (permissions = []) => {
  if (Array.isArray(permissions)) {
    return permissions.filter(Boolean);
  }

  if (!permissions || typeof permissions !== "object") {
    return [];
  }

  const legacyMap = {
    dashboard: "dashboard.view",
    pos: "pos.view",
    products: "products.view",
    purchases: "purchases.view",
    expenses: "expenses.view",
    reports: "reports.view",
    accounts: "accounts.view",
    staff: "staff.view",
    manageUsers: "users.manage",
    settings: "settings.view",
  };

  return Object.entries(permissions)
    .filter(([, enabled]) => Boolean(enabled))
    .map(([key]) => legacyMap[key] || key)
    .filter(Boolean);
};

/**
 * Check if user has specific permission
 * @param {Array|Object} userPermissions - User's permissions
 * @param {string} permission - Permission to check
 * @returns {boolean}
 */
export const hasPermission = (userPermissions, permission) => {
  const normalized = normalizeUserPermissions(userPermissions);
  return normalized.includes(permission);
};

/**
 * Get label for a permission string
 * @param {string} permission - Permission string (e.g., "products.view")
 * @param {Array} allPermissions - All available permissions for reference
 * @returns {string} - Formatted label
 */
export const getPermissionLabel = (permission, allPermissions = []) => {
  const parts = permission.split(".");
  if (parts.length < 2) return permission;

  const module = parts[0];
  const action = parts.slice(1).join(".");

  const moduleLabel = formatModuleLabel(module);
  const actionLabel = formatActionLabel(action);

  return `${moduleLabel} · ${actionLabel}`;
};

/**
 * Check if user has any permission in a module
 * @param {Array|Object} userPermissions - User's permissions
 * @param {string} module - Module name (e.g., "products")
 * @returns {boolean}
 */
export const hasModulePermission = (userPermissions, module) => {
  const normalized = normalizeUserPermissions(userPermissions);
  return normalized.some(perm => perm.startsWith(`${module}.`));
};

/**
 * Get all permissions for a specific module
 * @param {string} module - Module name
 * @param {Array} allPermissions - All available permissions
 * @returns {Array} - Permissions for the module
 */
export const getModulePermissions = (module, allPermissions = []) => {
  return allPermissions.filter(perm => perm.startsWith(`${module}.`));
};
