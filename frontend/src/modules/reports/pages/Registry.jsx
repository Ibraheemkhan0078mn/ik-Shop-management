export const PNL_REGISTRY = {
    "standard-pl-mtd-ytd": {
        key: "standard-pl-mtd-ytd",
        module: "profitLoss",
        title: {
            en: "Standard P&L (MTD/YTD)",
            ur: "معیاری نفع و نقصان",
        },
        description:
            "Standard view comparing month-to-date and year-to-date performance.",
        api: "/api/reports/profit-loss/standard-pl-mtd-ytd",
        columnsKey: "standardPL",
        exportFile: "standard-pl-mtd-ytd",
        filters: ["dateRange", "branch", "department"],
        roles: ["admin", "manager", "accountant"],
    },

    "pl-by-category": {
        key: "pl-by-category",
        module: "profitLoss",
        title: {
            en: "P&L by Category",
            ur: "زمرہ کے لحاظ سے نفع و نقصان",
        },
        description:
            "Breakdown of profitability across different product categories.",
        api: "/api/reports/profit-loss/pl-by-category",
        columnsKey: "plByCategory",
        exportFile: "pl-by-category",
        filters: ["dateRange", "category", "branch"],
        roles: ["admin", "manager", "accountant"],
    },

    "pl-by-customer": {
        key: "pl-by-customer",
        module: "profitLoss",
        title: {
            en: "P&L by Customer",
            ur: "گاہک کے لحاظ سے نفع و نقصان",
        },
        description:
            "Analysis of profit margins generated from individual clients or accounts.",
        api: "/api/reports/profit-loss/pl-by-customer",
        columnsKey: "plByCustomer",
        exportFile: "pl-by-customer",
        filters: ["dateRange", "customer", "branch"],
        roles: ["admin", "manager", "accountant"],
    },

    "comparative-pl": {
        key: "comparative-pl",
        module: "profitLoss",
        title: {
            en: "Comparative P&L",
            ur: "تقابلی نفع و نقصان",
        },
        description:
            "Side-by-side comparison of current period vs previous period performance.",
        api: "/api/reports/profit-loss/comparative-pl",
        columnsKey: "comparativePL",
        exportFile: "comparative-pl",
        filters: ["dateRange", "branch", "department"],
        roles: ["admin", "manager", "accountant"],
    },

    "pl-by-branch": {
        key: "pl-by-branch",
        module: "profitLoss",
        title: {
            en: "P&L by Warehouse/Branch",
            ur: "برانچ کے لحاظ سے نفع و نقصان",
        },
        description:
            "Evaluate the profitability of specific physical locations or storage units.",
        api: "/api/reports/profit-loss/pl-by-branch",
        columnsKey: "plByBranch",
        exportFile: "pl-by-branch",
        filters: ["dateRange", "branch", "department"],
        roles: ["admin", "manager", "accountant"],
    },

    "gross-margin-analysis": {
        key: "gross-margin-analysis",
        module: "profitLoss",
        title: {
            en: "Gross Margin Analysis",
            ur: "گراس مارجن کا تجزیہ",
        },
        description:
            "Detailed report on revenue minus cost of goods sold before expenses.",
        api: "/api/reports/profit-loss/gross-margin-analysis",
        columnsKey: "grossMarginAnalysis",
        exportFile: "gross-margin-analysis",
        filters: ["dateRange", "category", "branch"],
        roles: ["admin", "manager", "accountant"],
    },

    "expense-ratio-report": {
        key: "expense-ratio-report",
        module: "profitLoss",
        title: {
            en: "Expense Ratio Report",
            ur: "اخراجات کے تناسب کی رپورٹ",
        },
        description:
            "Visualizes expenses as a percentage of total revenue to track efficiency.",
        api: "/api/reports/profit-loss/expense-ratio-report",
        columnsKey: "expenseRatioReport",
        exportFile: "expense-ratio-report",
        filters: ["dateRange", "branch", "department"],
        roles: ["admin", "manager", "accountant"],
    },

    "net-profit-margin-trends": {
        key: "net-profit-margin-trends",
        module: "profitLoss",
        title: {
            en: "Net Profit Margin Trends",
            ur: "خالص منافع کے رجحانات",
        },
        description:
            "Historical view of how net profit margins have changed over time.",
        api: "/api/reports/profit-loss/net-profit-margin-trends",
        columnsKey: "netProfitMarginTrends",
        exportFile: "net-profit-margin-trends",
        filters: ["dateRange", "branch", "category"],
        roles: ["admin", "manager", "accountant"],
    },
};
