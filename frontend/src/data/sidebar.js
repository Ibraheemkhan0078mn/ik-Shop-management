import {
    BarChart3,
    Wallet,
    ShoppingCart,
    Users,
    DollarSign,
    CreditCard,
    Package,
    TrendingUp,
} from "lucide-react";

export const sidebarData = (language = "en") => ({
    navMain: [
        {
            id: "Dashboard",
            title: language === "en" ? "Dashboard" : "ڈیش بورڈ",
            url: "/dashboard/quick-actions",
            icon: BarChart3,
            allowedUrls: ["/dashboard/analytics", "/dashboard/quick-actions"],
        },
        {
            id: "Sale",
            title: language === "en" ? "POS" : "سیل",
            url: "/pos",
            icon: ShoppingCart,
        },
        {
            id: "Stock & Expenses",
            title: "Products",
            url: "/products/",
            icon: Package,
            allowedUrls: [
                "/products/",
                "/products/batches",
                "/products/categories",
                "/products/sub-categories",
            ],
        },
        // {
        //     id: "Business Expenses",
        //     title: "Business Expenses",
        //     url: "/expenses/business",
        //     icon: DollarSign,
        //     allowedUrls: ["/expenses/business"],
        // },
        {
            id: "Purchases",
            title: "Purchases",
            url: "/purchases",
            icon: CreditCard,
            allowedUrls: ["/purchases", "/wastage", "/returns", "/suppliers"],
            items: [
                { title: "Product Purchases", url: "/purchases" },
                { title: "Wastage",           url: "/wastage"   },
                { title: "Returns",           url: "/returns"   },
                { title: "Suppliers",         url: "/suppliers" },
            ],
        },
        {
            id: "Reports",
            title: "Reports",
            url: "/reports/sales",
            icon: TrendingUp,
            allowedUrls: [
                "/reports/sales",
                "/reports/purchases",
                "/reports/inventory",
                "/reports/accounts-and-financials",
                "/reports/profit-and-loss",

                // details of each modules
                "/reports/sales/details",
                "/reports/purchases/details",
                "/reports/inventory/details",
                "/reports/finance/details",
                "/reports/profitLoss/details",
            ],
        },
        // {
        //     id: "Accounts",
        //     title: "Accounts",
        //     url: "/accounts/customers",
        //     icon: Wallet,
        //     allowedUrls: [
        //         "/accounts/customers",
        //         "/accounts/staff",
        //         "/accounts/suppliers",
        //     ],
        // },

        // {
        //     id: "Staff",
        //     title: language === "en" ? "Staff" : "ملازمین",
        //     url: "/staff",
        //     icon: Users,
        //     allowedUrls: ["/staff"],
        // },
        {
            id: "Credit & Debits",
            title: language === "en" ? "Credit & Debits" : "کریڈٹ اور ڈیبٹس",
            url: "/qarzaAccount",
            icon: Wallet,
            allowedUrls: ["/qarzaAccount"],
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
            allowedUrls: ["/members"],
        },
        {
            id: "Expenses",
            title: "Expenses",
            url: "/expenses",
            icon: DollarSign,
            allowedUrls: ["/expenses"],
        }
    ],
});
