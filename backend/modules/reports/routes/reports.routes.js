import express from "express";
import {
    getDashboardSummaryData,
    getSalesReportData,
    getPurchaseReportData,
    getFinancialReportData,
    getCreditDebitReportData,
    getExpenseReportData,
    getSupplierReportData,
    getWastageReportData,
    getActivityReportData,
    getTopSellingProductsData,
    getTopCustomersData,
    getLowStockProductsData,
    getNearExpiryProductsData,
    getRecentSalesData,
    getRecentPurchasesData,
} from "../controllers/reports.controller.js";

const router = express.Router();

// Dashboard Summary
router.get("/dashboard/summary", getDashboardSummaryData);

// Sales Report
router.get("/sales", getSalesReportData);

// Purchase Report
router.get("/purchases", getPurchaseReportData);

// Financial Report
router.get("/financial", getFinancialReportData);

// Credit/Debit Report (Qarza)
router.get("/credit-debit", getCreditDebitReportData);

// Expense Report
router.get("/expenses", getExpenseReportData);

// Supplier Report
router.get("/suppliers", getSupplierReportData);

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
