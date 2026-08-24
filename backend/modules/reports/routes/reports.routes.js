import express from "express";
import {
    getDashboardSummaryData,
    getMainBusinessReportData,
    getSalesReportData,
    getPurchaseReportData,
    getFinancialReportData,
    getCreditDebitReportData,
    getExpenseReportData,
    getSupplierReportData,
    getWastageReportData,
    getActivityReportData,
    getPurchaseReturnReportData,
    getSaleReturnReportData,
    getInventoryReportData,
    getProductWastageReportData,
    getCustomerReportData,
    getCustomerReportKPIData,
    getStaffReportData,
    getStaffKPIReportData,
    getProfitLossReportData,
    getTopSellingProductsData,
    getTopCustomersData,
    getLowStockProductsData,
    getNearExpiryProductsData,
    getRecentSalesData,
    getRecentPurchasesData,
    getExpenseKPIReportData,
    getSalesKPIReportData,
    getPurchaseKPIReportData,
    getSupplierKPIReportData,
    getCustomerKPIReportData,
    getExpenseCategoryBreakdownData,
    getExpenseTransactionsData,
} from "../controllers/reports.controller.js";

const router = express.Router();

// Dashboard Summary
router.get("/dashboard/summary", getDashboardSummaryData);

// Main Business Report
router.get("/main-business", getMainBusinessReportData);

// Sales Report
router.get("/sales", getSalesReportData);

// Purchase Report
router.get("/purchases", getPurchaseReportData);

// Purchase Return Report
router.get("/purchase-returns", getPurchaseReturnReportData);

// Sale Return Report
router.get("/sale-returns", getSaleReturnReportData);

// Inventory Report
router.get("/inventory", getInventoryReportData);

// Product Wastage Report
router.get("/product-wastage", getProductWastageReportData);

// Customer Report
router.get("/customers", getCustomerReportData);

// Customer Report KPI
router.get("/customers-kpi", getCustomerReportKPIData);

// Staff Report
router.get("/staff", getStaffReportData);

// Staff KPI Report
router.get("/staff-kpi", getStaffKPIReportData);

// Financial Report
router.get("/financial", getFinancialReportData);

// Credit/Debit Report (Qarza)
router.get("/credit-debit", getCreditDebitReportData);

// Expense Report
router.get("/expenses", getExpenseReportData);

// Expense KPI Report
router.get("/expenses-kpi", getExpenseKPIReportData);

// Expense Category Breakdown
router.get("/expenses-category-breakdown", getExpenseCategoryBreakdownData);

// Expense Transactions with Pagination
router.get("/expenses-transactions", getExpenseTransactionsData);

// Sales KPI Report
router.get("/sales-kpi", getSalesKPIReportData);

// Purchase KPI Report
router.get("/purchases-kpi", getPurchaseKPIReportData);

// Supplier KPI Report
router.get("/suppliers-kpi", getSupplierKPIReportData);

// Customer KPI Report
router.get("/customers-kpi", getCustomerKPIReportData);

// Supplier Report
router.get("/suppliers", getSupplierReportData);

// Profit & Loss Report
router.get("/profit-loss", getProfitLossReportData);

// Wastage Report
router.get("/wastage", getWastageReportData);

// Activity Report
router.get("/activity", getActivityReportData);

// Dashboard Components
router.get("/dashboard/top-products", getTopSellingProductsData);
router.get("/dashboard/top-customers", getTopCustomersData);
router.get("/dashboard/low-stock", getLowStockProductsData);
router.get("/dashboard/near-expiry", getNearExpiryProductsData);
router.get("/dashboard/recent-sales", getRecentSalesData);
router.get("/dashboard/recent-purchases", getRecentPurchasesData);

export default router;
