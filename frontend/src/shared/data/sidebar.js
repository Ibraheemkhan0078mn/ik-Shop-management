// src/data/sidebar.js
import {
  BarChart3, Wallet, Users, DollarSign, CreditCard,
  Package, TrendingUp, Trash2, RotateCcw, Truck,
  FileText, Receipt, Boxes, User, Tag
} from "lucide-react";

const translations = {
  en: {
    quickList: "Quick List", dashboard: "Dashboard", products: "Products",
    categories: "Categories", subCategories: "Sub Categories", brands: "Brands", productWastage: "Product Wastage",
    purchases: "Purchases", purchaseReturn: "Purchase Return", customers: "Customers",
    suppliers: "Suppliers", reports: "Reports", mainBusinessReport: "Main Business",
    salesReport: "Sales", purchaseKPIReport: "Purchase (KPI)", inventoryReport: "Inventory",
    customerReport: "Customers", supplierReport: "Suppliers", staffReport: "Staff",
    expenseReport: "Expenses", creditDebits: "General Credits & Debits",
    expenses: "Expenses", staff: "Staff", profile: "Profile", users: "Users",
    orders: "Orders", orderHistory: "Order History", orderReturn: "Order Return",
  },
  ur: {
    quickList: "فوری لسٹ", dashboard: "ڈیش بورڈ", products: "پروڈکٹس",
    categories: "زمرے", subCategories: "ذیلی زمرے", brands: "برانڈز", productWastage: "ضیاع",
    purchases: "خریداری", purchaseReturn: "خریداری واپسی", customers: "گاہک",
    suppliers: "سپلائرز", reports: "رپورٹس", mainBusinessReport: "مین بزنس",
    salesReport: "سیلز", purchaseKPIReport: "خریداری (KPI)", inventoryReport: "انوینٹری",
    customerReport: "گاہک", supplierReport: "سپلائرز", staffReport: "اسٹاف",
    expenseReport: "خرچے", creditDebits: "جنرل کریڈٹ اور ڈیبٹس",
    expenses: "اخراجات", staff: "اسٹاف", profile: "پروفائل", users: "صارفین",
    orders: "آرڈرز", orderHistory: "آرڈر ہسٹری", orderReturn: "آرڈر واپسی",
  },
  ur_en: {
    quickList: "فوری / Quick", dashboard: "ڈیش / Dashboard", products: "پروڈکٹس / Products",
    categories: "زمرے / Categories", subCategories: "ذیلی / Sub Categories", brands: "برانڈز / Brands", productWastage: "ضیاع / Wastage",
    purchases: "خریداری / Purchases", purchaseReturn: "واپسی / Return", customers: "گاہک / Customers",
    suppliers: "سپلائرز / Suppliers", reports: "رپورٹس / Reports", mainBusinessReport: "مین / Main Business",
    salesReport: "سیلز / Sales", purchaseKPIReport: "خریداری / Purchase (KPI)", inventoryReport: "انوینٹری / Inventory",
    customerReport: "گاہک / Customers", supplierReport: "سپلائرز / Suppliers", staffReport: "اسٹاف / Staff",
    expenseReport: "خرچے / Expenses", creditDebits: "جنرل / General Credits & Debits",
    expenses: "اخراجات / Expenses", staff: "اسٹاف / Staff", profile: "پروفائل / Profile", users: "صارفین / Users",
    orders: "آرڈرز / Orders", orderHistory: "ہسٹری / History", orderReturn: "واپسی / Return",
  },
};

const NAV_ITEMS = [
  { id: "quickList", icon: Package, url: "/quick-list", allowedUrls: ["/quick-list"] },
  { id: "dashboard", icon: BarChart3, url: "/dashboard", allowedUrls: ["/dashboard"] },
  {
    id: "products", icon: Boxes, url: "/products",
    allowedUrls: ["/products", "/products/categories", "/products/sub-categories", "/products/brands"],
    items: [
      { id: "categories", icon: FileText, url: "/products/categories" },
      { id: "brands", icon: Tag, url: "/products/brands" },
    ],
  },
  { id: "suppliers", icon: Truck, url: "/suppliers", allowedUrls: ["/suppliers"] },
  { id: "customers", icon: Users, url: "/customers", allowedUrls: ["/customers"] },
  { id: "expenses", icon: DollarSign, url: "/expenses", allowedUrls: ["/expenses"] },
  { id: "creditDebits", icon: Wallet, url: "/qarzaAccount", allowedUrls: ["/qarzaAccount", "/EachQarzaAccountRecord"] },
  { id: "staff", icon: Users, url: "/staff", allowedUrls: ["/staff"] },
  { id: "users", icon: Users, url: "/users", allowedUrls: ["/users"] },
  { id: "purchases", icon: CreditCard, url: "/purchases", allowedUrls: ["/purchases"] },
  { id: "purchaseReturn", icon: RotateCcw, url: "/purchase-returns", allowedUrls: ["/purchase-returns"] },
  { id: "productWastage", icon: Trash2, url: "/wastage", allowedUrls: ["/wastage"] },
  {
    id: "orders", icon: Receipt, url: "/order-history",
    allowedUrls: ["/order-history", "/product-return"],
    items: [
      { id: "orderHistory", icon: Receipt, url: "/order-history" },
      { id: "orderReturn", icon: RotateCcw, url: "/product-return" },
    ],
  },
  {
    id: "reports", icon: TrendingUp, url: "/reports/main-business",
    allowedUrls: ["/reports/main-business", "/reports/sales", "/reports/purchases-kpi",
      "/reports/inventory", "/reports/customers", "/reports/suppliers",
      "/reports/staff", "/reports/expenses", "/reports/credits-debits"],
    items: [
      { id: "mainBusinessReport", icon: BarChart3, url: "/reports/main-business" },
      { id: "salesReport", icon: Receipt, url: "/reports/sales" },
      { id: "purchaseKPIReport", icon: Package, url: "/reports/purchases-kpi" },
      { id: "inventoryReport", icon: Boxes, url: "/reports/inventory" },
      { id: "customerReport", icon: Users, url: "/reports/customers" },
      { id: "supplierReport", icon: Truck, url: "/reports/suppliers" },
      { id: "staffReport", icon: User, url: "/reports/staff" },
      { id: "expenseReport", icon: DollarSign, url: "/reports/expenses" },
      { id: "creditDebits", icon: Wallet, url: "/reports/credits-debits" },
    ],
  },
];

const label = (lang, id) => translations[lang]?.[id] ?? translations.en[id] ?? id;

export const sidebarData = (lang = "en") => ({
  navMain: NAV_ITEMS.map(item => ({
    ...item,
    title: label(lang, item.id),
    items: item.items?.map(sub => ({ ...sub, title: label(lang, sub.id) })),
  })),
});