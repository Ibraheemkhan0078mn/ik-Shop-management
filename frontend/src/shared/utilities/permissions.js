export const PERMISSION_GROUPS = [
  { module: "dashboard", label: "Dashboard", actions: [{ key: "view", label: "View" }] },
  {
    module: "pos",
    label: "POS",
    actions: [
      { key: "view", label: "View" },
      { key: "orders.create", label: "Orders Create" },
      { key: "orders.delete", label: "Orders Delete" },
      { key: "orders.view", label: "Orders View" },
      { key: "orders.update", label: "Orders Update" },
      { key: "orders.hold", label: "Orders Hold" },
      { key: "orders.resume", label: "Orders Resume" },
      { key: "orderReturns.create", label: "Order Returns Create" },
      { key: "orderReturns.update", label: "Order Returns Update" },
      { key: "orderReturns.delete", label: "Order Returns Delete" },
      { key: "orderReturns.view", label: "Order Returns View" },
    ],
  },
  {
    module: "products",
    label: "Products",
    actions: [
      { key: "view", label: "View" },
      { key: "create", label: "Create" },
      { key: "update", label: "Update" },
      { key: "delete", label: "Delete" },
      { key: "details", label: "Details" },
    ],
  },
  {
    module: "categories",
    label: "Categories",
    actions: [
      { key: "view", label: "View" },
      { key: "create", label: "Create" },
      { key: "update", label: "Update" },
      { key: "delete", label: "Delete" },
    ],
  },
  {
    module: "subcategories",
    label: "Subcategories",
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
      { key: "details", label: "Details" },
      { key: "payment", label: "Payment" },
      { key: "delivery", label: "Delivery" },
    ],
  },
  {
    module: "purchaseReturns",
    label: "Purchase Returns",
    actions: [
      { key: "view", label: "View" },
      { key: "create", label: "Create" },
      { key: "update", label: "Update" },
      { key: "delete", label: "Delete" },
      { key: "details", label: "Details" },
      { key: "approve", label: "Approve" },
    ],
  },
  {
    module: "productReturns",
    label: "Product Returns",
    actions: [
      { key: "view", label: "View" },
      { key: "create", label: "Create" },
      { key: "update", label: "Update" },
      { key: "delete", label: "Delete" },
      { key: "details", label: "Details" },
    ],
  },
  {
    module: "wastage",
    label: "Wastage",
    actions: [
      { key: "view", label: "View" },
      { key: "create", label: "Create" },
      { key: "update", label: "Update" },
      { key: "delete", label: "Delete" },
      { key: "details", label: "Details" },
      { key: "approve", label: "Approve" },
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
      { key: "details", label: "Details" },
    ],
  },
  {
    module: "reports",
    label: "Reports",
    actions: [
      { key: "view", label: "View" },
      { key: "main", label: "Main" },
      { key: "sales", label: "Sales" },
      { key: "purchases", label: "Purchases" },
      { key: "inventory", label: "Inventory" },
      { key: "customers", label: "Customers" },
      { key: "suppliers", label: "Suppliers" },
      { key: "staff", label: "Staff" },
      { key: "expenses", label: "Expenses" },
      { key: "creditsDebits", label: "Credits Debits" },
    ],
  },
  {
    module: "accounts",
    label: "Accounts",
    actions: [
      { key: "view", label: "View" },
      { key: "create", label: "Create" },
      { key: "update", label: "Update" },
      { key: "delete", label: "Delete" },
      { key: "payment.create", label: "Payment Create" },
      { key: "payment.update", label: "Payment Update" },
      { key: "payment.delete", label: "Payment Delete" },
    ],
  },
  {
    module: "creditsDebits",
    label: "Credits/Debits",
    actions: [
      { key: "view", label: "View" },
      { key: "create", label: "Create" },
      { key: "update", label: "Update" },
      { key: "delete", label: "Delete" },
    ],
  },
  {
    module: "customers",
    label: "Customers",
    actions: [
      { key: "view", label: "View" },
      { key: "create", label: "Create" },
      { key: "update", label: "Update" },
      { key: "delete", label: "Delete" },
      { key: "details", label: "Details" },
      { key: "payment", label: "Payment" },
    ],
  },
  {
    module: "suppliers",
    label: "Suppliers",
    actions: [
      { key: "view", label: "View" },
      { key: "create", label: "Create" },
      { key: "update", label: "Update" },
      { key: "delete", label: "Delete" },
      { key: "details", label: "Details" },
      { key: "payment", label: "Payment" },
    ],
  },
  {
    module: "staff",
    label: "Staff",
    actions: [
      { key: "view", label: "View" },
      { key: "create", label: "Create" },
      { key: "update", label: "Update" },
      { key: "delete", label: "Delete" },
      { key: "details", label: "Details" },
      { key: "payments.view", label: "Payments View" },
      { key: "payments.create", label: "Payments Create" },
      { key: "payments.delete", label: "Payments Delete" },
      { key: "payments.details", label: "Payments Details" },
      { key: "documents.view", label: "Documents View" },
      { key: "documents.create", label: "Documents Create" },
      { key: "documents.delete", label: "Documents Delete" },
      { key: "salaries.view", label: "Salaries View" },
      { key: "salaries.create", label: "Salaries Create" },
      { key: "salaries.update", label: "Salaries Update" },
      { key: "salaries.delete", label: "Salaries Delete" },
      { key: "salaryBreakdown.view", label: "Salary Breakdown View" },
      { key: "paymentSummary.view", label: "Payment Summary View" },
      { key: "orders.view", label: "Orders View" },
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
  {
    module: "orderReturns",
    label: "Order Returns",
    actions: [
      { key: "view", label: "View" },
      { key: "create", label: "Create" },
      { key: "update", label: "Update" },
      { key: "delete", label: "Delete" },
      { key: "approve", label: "Approve" },
    ],
  },
  {
    module: "orders",
    label: "Orders",
    actions: [
      { key: "view", label: "View" },
      { key: "delete", label: "Delete" },
      { key: "update", label: "Update" },
    ],
  },
  {
    module: "quickActions",
    label: "Quick Actions",
    actions: [
      { key: "update", label: "Update" },
    ],
  },
  {
    module: "settings",
    label: "Settings",
    actions: [
      { key: "view", label: "View" },
      { key: "shop", label: "Shop" },
      { key: "printer", label: "Printer" },
      { key: "camera", label: "Camera" },
      { key: "language", label: "Language" },
      { key: "theme", label: "Theme" },
      { key: "modules", label: "Modules" },
      { key: "paymentMethods", label: "Payment Methods" },
      { key: "profile", label: "Profile" },
      { key: "permissionPassword", label: "Permission Password" },
    ],
  },
  {
    module: "batches",
    label: "Batches",
    actions: [
      { key: "view", label: "View" },
      { key: "create", label: "Create" },
      { key: "update", label: "Update" },
      { key: "delete", label: "Delete" },
      { key: "details", label: "Details" },
    ],
  },
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
  const parts = permission.split(".");
  const module = parts[0];
  const action = parts.slice(1).join(".");
  
  const group = PERMISSION_GROUPS.find((item) => item.module === module);
  if (!group) return permission;

  const actionMeta = group.actions.find((item) => item.key === action) || group.actions[0];
  return `${group.label} · ${actionMeta.label}`;
};
