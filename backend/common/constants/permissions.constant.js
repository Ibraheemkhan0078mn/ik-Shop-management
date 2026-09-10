
export const backendBaseUrl = "http://localhost:4000"

// Permissions organized by sidebar menu sequence
export const DEFAULT_PERMISSIONS = [
  // Quick List
  "pos.view",
  "pos.orders.create",
  "pos.orders.delete",
  "pos.orders.view",
  "pos.orders.update",
  "pos.orders.hold",
  "pos.orders.resume",
  "pos.orderReturns.create",
  "pos.orderReturns.update",
  "pos.orderReturns.delete",
  "pos.orderReturns.view",
  
  // Products (with Categories & Brands)
  "products.view",
  "products.create",
  "products.update",
  "products.delete",
  "products.details",
  "categories.view",
  "categories.create",
  "categories.update",
  "categories.delete",
  "brands.view",
  "brands.create",
  "brands.update",
  "brands.delete",
  "brands.details",
  "batches.view",
  "batches.create",
  "batches.delete",
  
  // Suppliers
  "suppliers.view",
  "suppliers.create",
  "suppliers.update",
  "suppliers.delete",
  "suppliers.details",
  "suppliers.payment",
  
  // Customers
  "customers.view",
  "customers.create",
  "customers.update",
  "customers.delete",
  "customers.details",
  "customers.payment",
  
  // Expenses
  "expenses.view",
  "expenses.create",
  "expenses.update",
  "expenses.delete",
  "expenses.details",
  
  // Credits & Debits / Qarza Accounts
  "creditsAndDebitsAccounts.view",
  "creditsAndDebitsAccounts.create",
  "creditsAndDebitsAccounts.update",
  "creditsAndDebitsAccounts.delete",
  "creditsAndDebitsAccounts.payment.create",
  "creditsAndDebitsAccounts.payment.update",
  "creditsAndDebitsAccounts.payment.delete",
  
  // Staff
  "staff.view",
  "staff.create",
  "staff.update",
  "staff.delete",
  "staff.details",
  "staff.attendance",
  "staff.payments.view",
  "staff.payments.create",
  "staff.payments.delete",
  "staff.payments.details",
  "staff.documents.view",
  "staff.documents.create",
  "staff.documents.delete",
  "staff.salaries.view",
  "staff.salaries.create",
  "staff.salaries.update",
  "staff.salaries.delete",
  "staff.salaryBreakdown.view",
  "staff.paymentSummary.view",
  "staff.orders.view",
  
  // Purchases
  "purchases.view",
  "purchases.create",
  "purchases.update",
  "purchases.delete",
  "purchases.details",
  "purchases.payment",
  "purchases.delivery",
  
  // Purchase Returns
  "purchaseReturns.view",
  "purchaseReturns.create",
  "purchaseReturns.update",
  "purchaseReturns.delete",
  "purchaseReturns.details",
  "purchaseReturns.approve",
  
  // Product Wastage
  "wastage.view",
  "wastage.create",
  "wastage.update",
  "wastage.delete",
  "wastage.details",
  "wastage.approve",
  
  // Orders (Order History & Returns)
  "orders.view",
  "orders.delete",
  "orders.update",
  "orderReturns.view",
  "orderReturns.create",
  "orderReturns.update",
  "orderReturns.delete",
  "orderReturns.approve",
  "productReturns.view",
  "productReturns.create",
  "productReturns.update",
  "productReturns.delete",
  "productReturns.details",
  
  // Quick Actions & Settings
  "quickActions.update",
  "settings.view",
  "settings.shop",
  "settings.printer",
  "settings.camera",
  "settings.language",
  "settings.theme",
  "settings.modules",
  "settings.paymentMethods",
  "settings.profile",
  "settings.permissionPassword",
];
