import {
  BarChart3, Wallet, ShoppingCart, Users, DollarSign,
  CreditCard, Package, TrendingUp, Trash2, RotateCcw,
  Truck, ArrowLeftRight, FileText, Receipt, Boxes, User, UserCircle
} from "lucide-react";

// Language translations
const t = {
  en: {
    quickList: "Quick List",
    dashboard: "Dashboard",
    sales: "Sales",
    pos: "POS",
    orderReturn: "Order Return",
    products: "Products",
    categories: "Categories",
    subCategories: "Sub Categories",
    productWastage: "Product Wastage",
    purchases: "Purchases",
    purchaseReturn: "Purchase Return",
    customers: "Customers",
    suppliers: "Suppliers",
    reports: "Reports",
    mainBusinessReport: "Main Business",
    profitLossReport: "Profit & Loss",
    salesReport: "Sales",
    purchaseReport: "Purchases",
    inventoryReport: "Inventory",
    customerReport: "Customers",
    supplierReport: "Suppliers",
    staffReport: "Staff",
    expenseReport: "Expenses",
    financeReport: "Finance",
    creditDebits: "Credit & Debits",
    expenses: "Expenses",
    staff: "Staff",
    logout: "Logout",
    settings: "Settings",
    profile: "Profile",
    users: "Users"
  },
  ur: {
    quickList: "فوری لسٹ",
    dashboard: "ڈیش بورڈ",
    sales: "سیلز",
    pos: "پوائنٹ آف سیلز",
    orderReturn: "آرڈر واپسی",
    products: "پروڈکٹس",
    categories: "زمرے",
    subCategories: "ذیلی زمرے",
    productWastage: "ضیاع",
    purchases: "خریداری",
    purchaseReturn: "خریداری واپسی",
    customers: "گاہک",
    suppliers: "سپلائرز",
    reports: "رپورٹس",
    mainBusinessReport: "مین بزنس",
    profitLossReport: "منافع اور نقصان",
    salesReport: "سیلز",
    purchaseReport: "خریداری",
    inventoryReport: "انوینٹری",
    customerReport: "گاہک",
    supplierReport: "سپلائرز",
    staffReport: "اسٹاف",
    expenseReport: "خرچے",
    financeReport: "فنانس",
    creditDebits: "کریڈٹ اور ڈیبٹس",
    expenses: "اخراجات",
    staff: "اسٹاف",
    logout: "لاگ آؤٹ",
    settings: "سیٹنگز",
    profile: "پروفائل",
    users: "صارفین"
  },
  ur_en: {
    quickList: "فوری لسٹ / Quick List",
    dashboard: "ڈیش بورڈ / Dashboard",
    sales: "سیلز / Sales",
    pos: "پوائنٹ آف سیلز / POS",
    orderReturn: "آرڈر واپسی / Order Return",
    products: "پروڈکٹس / Products",
    categories: "زمرے / Categories",
    subCategories: "ذیلی زمرے / Sub Categories",
    productWastage: "ضیاع / Product Wastage",
    purchases: "خریداری / Purchases",
    purchaseReturn: "خریداری واپسی / Purchase Return",
    customers: "گاہک / Customers",
    suppliers: "سپلائرز / Suppliers",
    reports: "رپورٹس / Reports",
    salesReport: "سیلز / Sales",
    purchaseReport: "خریداری / Purchases",
    inventoryReport: "انوینٹری / Inventory",
    financeReport: "فنانس / Finance",
    creditDebits: "کریڈٹ اور ڈیبٹس / Credit & Debits",
    expenses: "اخراجات / Expenses",
    staff: "اسٹاف / Staff",
    logout: "لاگ آؤٹ / Logout",
    settings: "سیٹنگز / Settings",
    profile: "پروفائل / Profile",
    users: "صارفین / Users"
  }
};

// Navigation items configuration
const navItems = [
  { id: "quickList", icon: Package, url: "/quick-list", allowedUrls: ["/quick-list"] },
  { 
    id: "dashboard", 
    icon: BarChart3, 
    url: "/dashboard", 
    allowedUrls: ["/dashboard", "/dashboard/analytics"] 
  },
  {
    id: "sales",
    icon: ShoppingCart,
    url: "/pos",
    allowedUrls: ["/pos", "/product-return"],
    items: [
      { id: "pos", icon: ShoppingCart, url: "/pos", permissions: "Sale" },
      { id: "orderReturn", icon: ArrowLeftRight, url: "/product-return" }
    ]
  },
  {
    id: "products",
    icon: Boxes,
    url: "/products",
    allowedUrls: ["/products", "/products/batches", "/products/categories", "/products/sub-categories"],
    items: [
      { id: "categories", icon: FileText, url: "/products/categories" },
      { id: "subCategories", icon: FileText, url: "/products/sub-categories" }
    ]
  },
  { id: "productWastage", icon: Trash2, url: "/wastage", allowedUrls: ["/wastage"] },
  { id: "purchases", icon: CreditCard, url: "/purchases", allowedUrls: ["/purchases"] },
  { id: "purchaseReturn", icon: RotateCcw, url: "/purchase-returns", allowedUrls: ["/purchase-returns"] },
  { id: "customers", icon: Users, url: "/customers", allowedUrls: ["/customers"] },
  { id: "suppliers", icon: Truck, url: "/suppliers", allowedUrls: ["/suppliers"] },
  {
    id: "reports",
    icon: TrendingUp,
    url: "/reports",
    allowedUrls: [
      "/reports", "/reports/main-business", "/reports/profit-loss", "/reports/sales", "/reports/purchases", "/reports/inventory",
      "/reports/accounts-and-financials", "/reports/profit-and-loss", "/reports/customers", "/reports/suppliers", "/reports/staff", "/reports/expenses",
      "/reports/sales/details", "/reports/purchases/details", "/reports/inventory/details",
      "/reports/finance/details", "/reports/profitLoss/details"
    ],
    items: [
      { id: "mainBusinessReport", icon: BarChart3, url: "/reports/main-business" },
      { id: "profitLossReport", icon: TrendingUp, url: "/reports/profit-loss" },
      { id: "salesReport", icon: Receipt, url: "/reports/sales" },
      { id: "purchaseReport", icon: CreditCard, url: "/reports/purchases" },
      { id: "inventoryReport", icon: Boxes, url: "/reports/inventory" },
      { id: "customerReport", icon: Users, url: "/reports/customers" },
      { id: "supplierReport", icon: Truck, url: "/reports/suppliers" },
      { id: "staffReport", icon: User, url: "/reports/staff" },
      { id: "expenseReport", icon: DollarSign, url: "/reports/expenses" }
    ]
  },
  {
    id: "creditDebits",
    icon: Wallet,
    url: "/qarzaAccount",
    allowedUrls: ["/qarzaAccount", "/EachQarzaAccountRecord"]
  },
  { id: "expenses", icon: DollarSign, url: "/expenses", allowedUrls: ["/expenses"] },
  { id: "staff", icon: Users, url: "/staff", allowedUrls: ["/staff", "/staff/create", "/staff/edit/:id", "/staff/:id"] },
  { id: "profile", icon: UserCircle, url: "/profile", allowedUrls: ["/profile"] },
  { id: "users", icon: Users, url: "/users", allowedUrls: ["/users"] }
];

// Helper to build sidebar data with translations
export const sidebarData = (language = "en") => ({
  navMain: navItems.map(item => ({
    ...item,
    title: t[language]?.[item.id] || t.en[item.id] || item.id,
    items: item.items?.map(sub => ({
      ...sub,
      title: t[language]?.[sub.id] || t.en[sub.id] || sub.id
    }))
  }))
});