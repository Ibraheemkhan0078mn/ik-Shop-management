export const PERMISSION_GROUPS = [
  { module: "dashboard", label: "Dashboard", actions: [{ key: "view", label: "View" }] },
  { module: "pos", label: "POS", actions: [{ key: "view", label: "View" }] },
  {
    module: "products",
    label: "Products",
    actions: [
      { key: "view", label: "View" },
      { key: "create", label: "Create" },
      { key: "update", label: "Update" },
      { key: "delete", label: "Delete" },
    ],
  },
  {
    module: "purchases",
    label: "Purchases",
    actions: [
      { key: "view", label: "View" },
      { key: "create", label: "Create" },
      { key: "update", label: "Update" },
      { key: "delete", label: "Delete" },
    ],
  },
  {
    module: "expenses",
    label: "Expenses",
    actions: [
      { key: "view", label: "View" },
      { key: "create", label: "Create" },
      { key: "update", label: "Update" },
      { key: "delete", label: "Delete" },
    ],
  },
  { module: "reports", label: "Reports", actions: [{ key: "view", label: "View" }] },
  { module: "accounts", label: "Accounts", actions: [{ key: "view", label: "View" }] },
  {
    module: "staff",
    label: "Staff",
    actions: [
      { key: "view", label: "View" },
      { key: "create", label: "Create" },
      { key: "update", label: "Update" },
      { key: "delete", label: "Delete" },
    ],
  },
  {
    module: "users",
    label: "Users",
    actions: [
      { key: "view", label: "View" },
      { key: "create", label: "Create" },
      { key: "update", label: "Update" },
      { key: "delete", label: "Delete" },
      { key: "manage", label: "Manage" },
    ],
  },
  { module: "settings", label: "Settings", actions: [{ key: "view", label: "View" }] },
];

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

export const hasPermission = (permissions, permission) => {
  const normalized = normalizeUserPermissions(permissions);
  return normalized.includes(permission);
};

export const getPermissionLabel = (permission) => {
  const [module, action = "view"] = permission.split(".");
  const group = PERMISSION_GROUPS.find((item) => item.module === module);
  if (!group) return permission;

  const actionMeta = group.actions.find((item) => item.key === action) || group.actions[0];
  return `${group.label} · ${actionMeta.label}`;
};
