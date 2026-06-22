import {
    BarChart3,
    Wallet,
    ShoppingCart,
    Users,
    DollarSign,
    CreditCard,
    Package,
    TrendingUp,
    Trash2,
    RotateCcw,
    Truck,
    ArrowLeftRight,
} from "lucide-react";

export const sidebarData = (language = "en") => ({
    navMain: [
       {
            id: "Quick List",
            title: language === "en" ? "Quick List" : "فوری لسٹ",
            url: "/quick-list",
            icon: Package,
            allowedUrls: ["/quick-list"],
        },
        {
            id: "Dashboard",
            title: language === "en" ? "Dashboard" : "ڈیش بورڈ",
            url: "/dashboard",
            icon: BarChart3,
            allowedUrls: ["/dashboard", "/dashboard/analytics"],
        },
        
        {
            id: "Sale",
            title: language === "en" ? "POS" : "سیل",
            url: "/pos",
            icon: ShoppingCart,
        },
          {
            id: "Product Return",
            title: language === "en" ? "Order Return" : "پروڈکٹ واپسی",
            url: "/product-return",
            icon: ArrowLeftRight,
            allowedUrls: ["/product-return"],
        },
     

        {
            id: "Stock & Expenses",
            title: "Products",
            url: "/products",
            icon: Package,
            allowedUrls: [
                "/products",
                "/products/batches",
                "/products/categories",
                "/products/sub-categories",
            ],
        },
             {
            id: "Wastage",
            title: language === "en" ? "Product Wastage" : "ضیاع",
            url: "/wastage",
            icon: Trash2,
            allowedUrls: ["/wastage"],
        },
       
        {
            id: "Purchases",
            title: language === "en" ? "Product Purchases" : "خریداری",
            url: "/purchases",
            icon: CreditCard,
            allowedUrls: ["/purchases"],
        },
        {
            id: "Returns",
            title: language === "en" ? "Purchase Return" : "خریداری واپسی",
            url: "/returns",
            icon: RotateCcw,
            allowedUrls: ["/returns"],
        },
       
      
        {
            id: "Suppliers",
            title: language === "en" ? "Suppliers" : "سپلائرز",
            url: "/suppliers",
            icon: Truck,
            allowedUrls: ["/suppliers"],
        },
        {
            id: "Reports",
            title: "Reports",
            url: "/reports",
            icon: TrendingUp,
            allowedUrls: [
                "/reports",
                "/reports/sales",
                "/reports/purchases",
                "/reports/inventory",
                "/reports/accounts-and-financials",
                "/reports/profit-and-loss",
                "/reports/sales/details",
                "/reports/purchases/details",
                "/reports/inventory/details",
                "/reports/finance/details",
                "/reports/profitLoss/details",
            ],
        },
        {
            id: "Credit & Debits",
            title: language === "en" ? "Credit & Debits" : "کریڈٹ اور ڈیبٹس",
            url: "/qarzaAccount",
            icon: Wallet,
            allowedUrls: ["/qarzaAccount", "/EachQarzaAccountRecord"],
        },
        {
            id: "Investors",
            title: "Investors",
            url: "/investor",
            icon: Users,
            allowedUrls: ["/investor"],
        },
        {
            id: "Members",
            title: "Members",
            url: "/member",
            icon: Users,
            allowedUrls: ["/member", "/members"],
        },
        {
            id: "Expenses",
            title: "Expenses",
            url: "/expenses",
            icon: DollarSign,
            allowedUrls: ["/expenses"],
        },
        {
            id: "Assets",
            title: "Assets",
            url: "/assets",
            icon: Package,
            allowedUrls: ["/assets"],
        },
    ],
});
