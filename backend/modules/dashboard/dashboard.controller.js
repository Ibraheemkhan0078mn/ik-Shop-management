import asyncHandler from "express-async-handler";
import { 
    getDashboardData,
    getSalesRevenueKPIs,
    getInventoryAlertKPIs,
    getExpiryProducts,
    getLowStockProducts,
    getOutOfStockProducts,
    getRevenueOverTime,
    getOrdersOverTime,
    getTopSellingProducts,
    getSalesByCategory,
    getRetailVsWholesaleComparison,
    getStockLevelByCategory,
    getInventoryValueByCategory,
} from "./dashboard.service.js";

export const getDashboard = asyncHandler(async (req, res) => {
    const data = await getDashboardData();
    res.status(200).json({ success: true, data });
});

// Sales & Revenue KPIs
export const getSalesRevenueKPIsData = asyncHandler(async (req, res) => {
    const { range = '30D' } = req.query;
    const data = await getSalesRevenueKPIs(range);
    res.status(200).json({ success: true, data });
});

// Inventory Alert KPIs
export const getInventoryAlertKPIsData = asyncHandler(async (req, res) => {
    const { range = '30D' } = req.query;
    const data = await getInventoryAlertKPIs(range);
    res.status(200).json({ success: true, data });
});

// Expiry Products (paginated)
export const getExpiryProductsData = asyncHandler(async (req, res) => {
    const { range = '30D', page = 1, limit = 10 } = req.query;
    const data = await getExpiryProducts(range, parseInt(page), parseInt(limit));
    res.status(200).json({ success: true, data });
});

// Low Stock Products (paginated)
export const getLowStockProductsData = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10 } = req.query;
    const data = await getLowStockProducts(parseInt(page), parseInt(limit));
    res.status(200).json({ success: true, data });
});

// Out of Stock Products (paginated)
export const getOutOfStockProductsData = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10 } = req.query;
    const data = await getOutOfStockProducts(parseInt(page), parseInt(limit));
    res.status(200).json({ success: true, data });
});

// Revenue Over Time
export const getRevenueOverTimeData = asyncHandler(async (req, res) => {
    const { range = '30D' } = req.query;
    const data = await getRevenueOverTime(range);
    res.status(200).json({ success: true, data });
});

// Orders Over Time
export const getOrdersOverTimeData = asyncHandler(async (req, res) => {
    const { range = '30D' } = req.query;
    const data = await getOrdersOverTime(range);
    res.status(200).json({ success: true, data });
});

// Top Selling Products
export const getTopSellingProductsData = asyncHandler(async (req, res) => {
    const { range = '30D', metric = 'revenue' } = req.query;
    const data = await getTopSellingProducts(range, metric);
    res.status(200).json({ success: true, data });
});

// Sales by Category
export const getSalesByCategoryData = asyncHandler(async (req, res) => {
    const { range = '30D' } = req.query;
    const data = await getSalesByCategory(range);
    res.status(200).json({ success: true, data });
});

// Retail vs Wholesale Comparison
export const getRetailVsWholesaleComparisonData = asyncHandler(async (req, res) => {
    const { range = '30D' } = req.query;
    const data = await getRetailVsWholesaleComparison(range);
    res.status(200).json({ success: true, data });
});

// Stock Level by Category
export const getStockLevelByCategoryData = asyncHandler(async (req, res) => {
    const data = await getStockLevelByCategory();
    res.status(200).json({ success: true, data });
});

// Inventory Value by Category
export const getInventoryValueByCategoryData = asyncHandler(async (req, res) => {
    const data = await getInventoryValueByCategory();
    res.status(200).json({ success: true, data });
});
