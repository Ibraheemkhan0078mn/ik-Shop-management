export const dashboardLabels = {
  en: {
    // Page titles
    dashboard: "Dashboard",
    businessOverview: "Overview of your business performance",
    
    // Buttons
    quickList: "Quick List",
    refresh: "Refresh",
    
    // Section headings
    salesPerformance: "Sales Performance",
    productsAndCategories: "Products & Categories",
    retailVsWholesale: "Retail vs Wholesale",
    inventoryOverview: "Inventory Overview",
    
    // KPI labels
    totalSales: "Total Sales",
    totalRevenue: "Total Revenue",
    totalOrders: "Total Orders",
    averageOrderValue: "Average Order Value",
    
    // Inventory alerts
    lowStock: "Low Stock",
    outOfStock: "Out of Stock",
    overstock: "Overstock",
    
    // Charts
    dailySales: "Daily Sales",
    weeklySales: "Weekly Sales",
    monthlySales: "Monthly Sales",
    categoryDistribution: "Category Distribution",
    topProducts: "Top Products",
    
    // Messages
    loading: "Loading...",
    noDataAvailable: "No data available",
    lastUpdated: "Last Updated",
  },
  ur: {
    // Page titles
    dashboard: "ڈیش بورڈ",
    businessOverview: "اپنے کاروبار کی کارکردگی کا جائزہ",
    
    // Buttons
    quickList: "فہرست",
    refresh: "تازہ کاری",
    
    // Section headings
    salesPerformance: "فروخت کی کارکردگی",
    productsAndCategories: "پروڈکٹس اور زمرے",
    retailVsWholesale: "خردار مقابلہ ہوکری",
    inventoryOverview: "انوینٹری کا جائزہ",
    
    // KPI labels
    totalSales: "کل فروخت",
    totalRevenue: "کل آمدنی",
    totalOrders: "کل آرڈرز",
    averageOrderValue: "اوسط آرڈر ویلیو",
    
    // Inventory alerts
    lowStock: "کم اسٹاک",
    outOfStock: "اسٹاک ختم",
    overstock: "زیادہ اسٹاک",
    
    // Charts
    dailySales: "روزانہ فروخت",
    weeklySales: "ہفتہ وار فروخت",
    monthlySales: "مہینہ وار فروخت",
    categoryDistribution: "زمرہ کی تقسیم",
    topProducts: "بہترین پروڈکٹس",
    
    // Messages
    loading: "لوڈ ہو رہا ہے...",
    noDataAvailable: "کوئی ڈیٹا دستیاب نہیں",
    lastUpdated: "آخری اپ ڈیٹ",
  },
  ur_en: {
    // Page titles
    dashboard: "ڈیش بورڈ / Dashboard",
    businessOverview: "اپنے کاروبار کی کارکردگی کا جائزہ / Overview of your business performance",
    
    // Buttons
    quickList: "فہرست / Quick List",
    refresh: "تازہ کاری / Refresh",
    
    // Section headings
    salesPerformance: "فروخت کی کارکردگی / Sales Performance",
    productsAndCategories: "پروڈکٹس اور زمرے / Products & Categories",
    retailVsWholesale: "خردار مقابلہ ہوکری / Retail vs Wholesale",
    inventoryOverview: "انوینٹری کا جائزہ / Inventory Overview",
    
    // KPI labels
    totalSales: "کل فروخت / Total Sales",
    totalRevenue: "کل آمدنی / Total Revenue",
    totalOrders: "کل آرڈرز / Total Orders",
    averageOrderValue: "اوسط آرڈر ویلیو / Average Order Value",
    
    // Inventory alerts
    lowStock: "کم اسٹاک / Low Stock",
    outOfStock: "اسٹاک ختم / Out of Stock",
    overstock: "زیادہ اسٹاک / Overstock",
    
    // Charts
    dailySales: "روزانہ فروخت / Daily Sales",
    weeklySales: "ہفتہ وار فروخت / Weekly Sales",
    monthlySales: "مہینہ وار فروخت / Monthly Sales",
    categoryDistribution: "زمرہ کی تقسیم / Category Distribution",
    topProducts: "بہترین پروڈکٹس / Top Products",
    
    // Messages
    loading: "لوڈ ہو رہا ہے / Loading...",
    noDataAvailable: "کوئی ڈیٹا دستیاب نہیں / No data available",
    lastUpdated: "آخری اپ ڈیٹ / Last Updated",
  },
};

export const getDashboardLabels = (language) => {
  const langKey = language === "ur_en" ? "ur_en" : language === "ur" ? "ur" : "en";
  return dashboardLabels[langKey] || dashboardLabels.en;
};
