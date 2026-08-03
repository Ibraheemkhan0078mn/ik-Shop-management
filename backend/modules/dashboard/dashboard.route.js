import express from "express";
import {
    getDashboard,
    getSalesRevenueKPIsData,
    getInventoryAlertKPIsData,
    getExpiryProductsData,
    getLowStockProductsData,
    getOutOfStockProductsData,
    getRevenueOverTimeData,
    getOrdersOverTimeData,
    getTopSellingProductsData,
    getSalesByCategoryData,
    getRetailVsWholesaleComparisonData,
    getStockLevelByCategoryData,
    getInventoryValueByCategoryData,
} from "./dashboard.controller.js";

const router = express.Router();

// Legacy endpoint
router.get("/", getDashboard);

// Sales & Revenue KPIs
router.get("/sales-revenue", getSalesRevenueKPIsData);

// Inventory Alert KPIs
router.get("/inventory-alerts", getInventoryAlertKPIsData);

// Expiry Products (paginated)
router.get("/expiry-products", getExpiryProductsData);

// Low Stock Products (paginated)
router.get("/low-stock", getLowStockProductsData);

// Out of Stock Products (paginated)
router.get("/out-of-stock", getOutOfStockProductsData);

// Revenue Over Time
router.get("/revenue-over-time", getRevenueOverTimeData);

// Orders Over Time
router.get("/orders-over-time", getOrdersOverTimeData);

// Top Selling Products
router.get("/top-products", getTopSellingProductsData);

// Sales by Category
router.get("/sales-by-category", getSalesByCategoryData);

// Retail vs Wholesale Comparison
router.get("/retail-wholesale", getRetailVsWholesaleComparisonData);

// Stock Level by Category
router.get("/stock-by-category", getStockLevelByCategoryData);

// Inventory Value by Category
router.get("/inventory-value-by-category", getInventoryValueByCategoryData);

export default router;
