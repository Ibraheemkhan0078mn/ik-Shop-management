import asyncHandler from "express-async-handler";
import ErrorResponse from "../../../common/utils/ErrorResponse.js";
import {
    getDashboardSummary,
    getSalesReport,
    getPurchaseReport,
    getFinancialReport,
    getCreditDebitReport,
    getExpenseReport,
    getSupplierReport,
    getWastageReport,
    getActivityReport,
    getTopSellingProducts,
    getTopCustomers,
    getLowStockProducts,
    getNearExpiryProducts,
    getRecentSales,
    getRecentPurchases,
} from "../services/reports.service.js";

// Dashboard Summary
export const getDashboardSummaryData = asyncHandler(async (req, res, next) => {
    const filters = req.query;
    const summary = await getDashboardSummary(filters);

    res.status(200).json({
        success: true,
        message: "Dashboard summary retrieved successfully",
        data: summary,
    });
});

// Sales Report
export const getSalesReportData = asyncHandler(async (req, res, next) => {
    const filters = req.query;
    const report = await getSalesReport(filters);

    res.status(200).json({
        success: true,
        message: "Sales report retrieved successfully",
        ...report,
    });
});

// Purchase Report
export const getPurchaseReportData = asyncHandler(async (req, res, next) => {
    const filters = req.query;
    const report = await getPurchaseReport(filters);

    res.status(200).json({
        success: true,
        message: "Purchase report retrieved successfully",
        ...report,
    });
});

// Financial Report
export const getFinancialReportData = asyncHandler(async (req, res, next) => {
    const filters = req.query;
    const report = await getFinancialReport(filters);

    res.status(200).json({
        success: true,
        message: "Financial report retrieved successfully",
        ...report,
    });
});

// Credit/Debit Report (Qarza)
export const getCreditDebitReportData = asyncHandler(async (req, res, next) => {
    const filters = req.query;
    const report = await getCreditDebitReport(filters);

    res.status(200).json({
        success: true,
        message: "Credit/Debit report retrieved successfully",
        ...report,
    });
});

// Expense Report
export const getExpenseReportData = asyncHandler(async (req, res, next) => {
    const filters = req.query;
    const report = await getExpenseReport(filters);

    res.status(200).json({
        success: true,
        message: "Expense report retrieved successfully",
        ...report,
    });
});

// Supplier Report
export const getSupplierReportData = asyncHandler(async (req, res, next) => {
    const filters = req.query;
    const report = await getSupplierReport(filters);

    res.status(200).json({
        success: true,
        message: "Supplier report retrieved successfully",
        ...report,
    });
});

// Wastage Report
export const getWastageReportData = asyncHandler(async (req, res, next) => {
    const filters = req.query;
    const report = await getWastageReport(filters);

    res.status(200).json({
        success: true,
        message: "Wastage report retrieved successfully",
        ...report,
    });
});

// Activity Report
export const getActivityReportData = asyncHandler(async (req, res, next) => {
    const filters = req.query;
    const report = await getActivityReport(filters);

    res.status(200).json({
        success: true,
        message: "Activity report retrieved successfully",
        ...report,
    });
});

// Top Selling Products
export const getTopSellingProductsData = asyncHandler(async (req, res, next) => {
    const filters = req.query;
    const data = await getTopSellingProducts(filters);

    res.status(200).json({
        success: true,
        message: "Top selling products retrieved successfully",
        data,
    });
});

// Top Customers
export const getTopCustomersData = asyncHandler(async (req, res, next) => {
    const filters = req.query;
    const data = await getTopCustomers(filters);

    res.status(200).json({
        success: true,
        message: "Top customers retrieved successfully",
        data,
    });
});

// Low Stock Products
export const getLowStockProductsData = asyncHandler(async (req, res, next) => {
    const filters = req.query;
    const data = await getLowStockProducts(filters);

    res.status(200).json({
        success: true,
        message: "Low stock products retrieved successfully",
        data,
    });
});

// Near Expiry Products
export const getNearExpiryProductsData = asyncHandler(async (req, res, next) => {
    const filters = req.query;
    const data = await getNearExpiryProducts(filters);

    res.status(200).json({
        success: true,
        message: "Near expiry products retrieved successfully",
        data,
    });
});

// Recent Sales
export const getRecentSalesData = asyncHandler(async (req, res, next) => {
    const filters = req.query;
    const data = await getRecentSales(filters);

    res.status(200).json({
        success: true,
        message: "Recent sales retrieved successfully",
        data,
    });
});

// Recent Purchases
export const getRecentPurchasesData = asyncHandler(async (req, res, next) => {
    const filters = req.query;
    const data = await getRecentPurchases(filters);

    res.status(200).json({
        success: true,
        message: "Recent purchases retrieved successfully",
        data,
    });
});
