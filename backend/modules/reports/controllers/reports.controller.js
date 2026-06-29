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
    getMainBusinessReport,
    getPurchaseReturnReport,
    getSaleReturnReport,
    getInventoryReport,
    getProductWastageReport,
    getCustomerReport,
    getStaffReport,
    getProfitLossReport,
    getTopSellingProducts,
    getTopCustomers,
    getLowStockProducts,
    getNearExpiryProducts,
    getRecentSales,
    getRecentPurchases,
    getExpenseKPIReport,
    getSalesKPIReport,
    getPurchaseKPIReport,
    getSupplierKPIReport,
    getCustomerKPIReport,
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

// Main Business Report
export const getMainBusinessReportData = asyncHandler(async (req, res, next) => {
    const filters = req.query;
    const report = await getMainBusinessReport(filters);

    res.status(200).json({
        success: true,
        message: "Main business report retrieved successfully",
        ...report,
    });
});

// Expense KPI Report
export const getExpenseKPIReportData = asyncHandler(async (req, res, next) => {
    const filters = req.query;
    const report = await getExpenseKPIReport(filters);

    res.status(200).json({
        success: true,
        message: "Expense KPI report retrieved successfully",
        data: report,
    });
});

// Sales KPI Report
export const getSalesKPIReportData = asyncHandler(async (req, res, next) => {
    const filters = req.query;
    console.log('Sales KPI Report Controller - filters:', filters);
    const report = await getSalesKPIReport(filters);
    console.log('Sales KPI Report Controller - report result:', JSON.stringify(report, null, 2));

    res.status(200).json({
        success: true,
        message: "Sales KPI report retrieved successfully",
        data: report,
    });
});

// Purchase KPI Report
export const getPurchaseKPIReportData = asyncHandler(async (req, res, next) => {
    const filters = req.query;
    console.log('Purchase KPI Report Controller - filters:', filters);
    const report = await getPurchaseKPIReport(filters);
    console.log('Purchase KPI Report Controller - report result:', JSON.stringify(report, null, 2));

    res.status(200).json({
        success: true,
        message: "Purchase KPI report retrieved successfully",
        data: report,
    });
});

// Supplier KPI Report
export const getSupplierKPIReportData = asyncHandler(async (req, res, next) => {
    const filters = req.query;
    console.log('Supplier KPI Report Controller - filters:', filters);
    const report = await getSupplierKPIReport(filters);
    console.log('Supplier KPI Report Controller - report result:', JSON.stringify(report, null, 2));

    res.status(200).json({
        success: true,
        message: "Supplier KPI report retrieved successfully",
        data: report,
    });
});

// Customer KPI Report
export const getCustomerKPIReportData = asyncHandler(async (req, res, next) => {
    const filters = req.query;
    console.log('Customer KPI Report Controller - filters:', filters);
    const report = await getCustomerKPIReport(filters);
    console.log('Customer KPI Report Controller - report result:', JSON.stringify(report, null, 2));

    res.status(200).json({
        success: true,
        message: "Customer KPI report retrieved successfully",
        data: report,
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

// Purchase Return Report
export const getPurchaseReturnReportData = asyncHandler(async (req, res, next) => {
    const filters = req.query;
    const report = await getPurchaseReturnReport(filters);

    res.status(200).json({
        success: true,
        message: "Purchase return report retrieved successfully",
        ...report,
    });
});

// Sale Return Report
export const getSaleReturnReportData = asyncHandler(async (req, res, next) => {
    const filters = req.query;
    const report = await getSaleReturnReport(filters);

    res.status(200).json({
        success: true,
        message: "Sale return report retrieved successfully",
        ...report,
    });
});

// Inventory Report
export const getInventoryReportData = asyncHandler(async (req, res, next) => {
    const filters = req.query;
    const report = await getInventoryReport(filters);

    res.status(200).json({
        success: true,
        message: "Inventory report retrieved successfully",
        ...report,
    });
});

// Product Wastage Report
export const getProductWastageReportData = asyncHandler(async (req, res, next) => {
    const filters = req.query;
    const report = await getProductWastageReport(filters);

    res.status(200).json({
        success: true,
        message: "Product wastage report retrieved successfully",
        ...report,
    });
});

// Customer Report
export const getCustomerReportData = asyncHandler(async (req, res, next) => {
    const filters = req.query;
    const report = await getCustomerReport(filters);

    res.status(200).json({
        success: true,
        message: "Customer report retrieved successfully",
        ...report,
    });
});

// Staff Report
export const getStaffReportData = asyncHandler(async (req, res, next) => {
    const filters = req.query;
    const report = await getStaffReport(filters);

    res.status(200).json({
        success: true,
        message: "Staff report retrieved successfully",
        ...report,
    });
});

// Profit & Loss Report
export const getProfitLossReportData = asyncHandler(async (req, res, next) => {
    const filters = req.query;
    const report = await getProfitLossReport(filters);

    res.status(200).json({
        success: true,
        message: "Profit & loss report retrieved successfully",
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
