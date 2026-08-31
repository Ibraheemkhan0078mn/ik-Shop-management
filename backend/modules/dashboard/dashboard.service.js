import {
    getOrderModel,
    getPurchaseModel,
    getExpenseModel,
    getProductModel,
    getCustomerModel,
    getSupplierModel,
    getBatchModel,
    getWastageModel,
    getPurchaseReturnModel,
    getProductReturnModel,
    getCategoryModel,
    getQarzaAccountModel,
} from "./dashboard.crud.js";
import { findDocs, countDocs } from "../../common/services/db/mongodbCentralizedCrud.service.js";
import { findOrderService } from "../pos/services/order.crud.js";
import { findBatchService, countBatchService } from "../productPurchases/services/batch.crud.js";
import { findProductService, countProductService } from "../product/services/product.crud.js";
import { calculateBatchesStockStatus } from "../productPurchases/services/batchStockStatus.service.js";
import { findCategoryService } from "../product/services/category.crud.js";

// Helper function to get date range based on filter
const getDateRange = (range) => {
    const now = new Date();
    let startDate;
    let endDate;

    // Handle custom date range
    if (typeof range === 'object' && range.type === 'custom') {
        // Parse custom dates and set to start/end of day in local time
        const start = new Date(range.startDate);
        const end = new Date(range.endDate);
        return {
            startDate: new Date(start.getFullYear(), start.getMonth(), start.getDate(), 0, 0, 0, 0),
            endDate: new Date(end.getFullYear(), end.getMonth(), end.getDate(), 23, 59, 59, 999)
        };
    }

    switch (range) {
        case 'Today':
            // Start of today (00:00:00.000)
            startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
            // End of today (23:59:59.999)
            endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
            break;
        case '3D':
            startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 3, 0, 0, 0, 0);
            endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
            break;
        case '7D':
            startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7, 0, 0, 0, 0);
            endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
            break;
        case '30D':
            startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 30, 0, 0, 0, 0);
            endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
            break;
        case '3M':
            startDate = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate(), 0, 0, 0, 0);
            endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
            break;
        case '90D':
            startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 90, 0, 0, 0, 0);
            endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
            break;
        case '1Y':
            startDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate(), 0, 0, 0, 0);
            endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
            break;
        case 'All':
            startDate = new Date(0);
            endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
            break;
        default:
            startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 30, 0, 0, 0, 0);
            endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    }

    return { startDate, endDate };
};

// Helper to safely convert to number
const toNumber = (value) => {
    const num = Number(value);
    return isNaN(num) ? 0 : num;
};

export const getDashboardData = async () => {
    try {
        const OrderModel = getOrderModel();
        const PurchaseModel = getPurchaseModel();
        const ExpenseModel = getExpenseModel();
        const ProductModel = getProductModel();
        const CustomerModel = getCustomerModel();
        const SupplierModel = getSupplierModel();
        const BatchModel = getBatchModel();
        const WastageModel = getWastageModel();
        const PurchaseReturnModel = getPurchaseReturnModel();
        const ProductReturnModel = getProductReturnModel();
        const QarzaAccountModel = getQarzaAccountModel();

    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [
        todayOrders,
        todayPurchases,
        todayExpenses,
        monthlyOrders,
        monthlyPurchases,
        monthlyExpenses,
        totalProducts,
        totalCustomers,
        totalSuppliers,
        allProducts,
        allBatches,
        recentOrders,
        recentPurchases,
        pendingWastages,
        pendingPurchaseReturns,
        pendingProductReturns,
        qarzaAccounts,
    ] = await Promise.all([
        // Today's data - using centralized service via findDocs
        findDocs({ model: OrderModel, filter: { createdAt: { $gte: startOfDay } } }),
        findDocs({ model: PurchaseModel, filter: { createdAt: { $gte: startOfDay } } }),
        findDocs({ model: ExpenseModel, filter: { createdAt: { $gte: startOfDay } } }),
        
        // Monthly data
        findDocs({ model: OrderModel, filter: { createdAt: { $gte: startOfMonth } } }),
        findDocs({ model: PurchaseModel, filter: { createdAt: { $gte: startOfMonth } } }),
        findDocs({ model: ExpenseModel, filter: { createdAt: { $gte: startOfMonth } }  }),
        
        // Counts - automatically excludes deleted
        countDocs({ model: ProductModel, filter: { isActive: true } }),
        countDocs({ model: CustomerModel }),
        countDocs({ model: SupplierModel }),
        
        // Stock data for calculations
        findDocs({ model: ProductModel, filter: { isActive: true }, options: { lean: true, populate: 'category' } }),
        findDocs({ model: BatchModel, filter: { isActive: true }, options: { lean: true, populate: ['product', 'supplier'] } }),
        
        // Recent data with populated fields
        findDocs({ model: OrderModel, options: { sort: { createdAt: -1 }, limit: 10, populate: ['customer'] } }),
        findDocs({ model: PurchaseModel, options: { sort: { createdAt: -1 }, limit: 10, populate: 'supplier' } }),
        
        // Pending approvals
        countDocs({ model: WastageModel, filter: { status: "pending" } }),
        countDocs({ model: PurchaseReturnModel, filter: { status: "pending" } }),
        countDocs({ model: ProductReturnModel, filter: { returnStatus: "pending" } }),
        
        // Financial data
        findDocs({ model: QarzaAccountModel, filter: {} }),
    ]);

    // Calculate KPIs with safe number conversion
    const todaySalesCount = todayOrders.length;
    const todayRevenue = todayOrders.reduce((sum, order) => sum + toNumber(order.totalAmount), 0);
    const todayPurchasesTotal = todayPurchases.reduce((sum, purchase) => sum + toNumber(purchase.totalAmount), 0);
    const todayExpensesTotal = todayExpenses.reduce((sum, expense) => sum + toNumber(expense.amount), 0);
    
    const monthlyRevenue = monthlyOrders.reduce((sum, order) => sum + toNumber(order.totalAmount), 0);
    const monthlyPurchasesTotal = monthlyPurchases.reduce((sum, purchase) => sum + toNumber(purchase.totalAmount), 0);
    const monthlyExpensesTotal = monthlyExpenses.reduce((sum, expense) => sum + toNumber(expense.amount), 0);
    const netProfit = monthlyRevenue - monthlyPurchasesTotal - monthlyExpensesTotal;
    const profitMargin = monthlyRevenue > 0 ? toNumber((netProfit / monthlyRevenue) * 100).toFixed(2) : 0;
    
    const avgOrderValue = monthlyOrders.length > 0 ? toNumber(monthlyRevenue / monthlyOrders.length) : 0;
    
    // Calculate inventory value manually
    let totalInventoryValue = 0;
    let totalInventoryQuantity = 0;
    allBatches.forEach(batch => {
        if (batch.quantity > 0) {
            totalInventoryValue += toNumber(batch.quantity) * toNumber(batch.purchasePrice || 0);
            totalInventoryQuantity += toNumber(batch.quantity);
        }
    });

    // Calculate stock status using service
    const batchesWithStatus = await calculateBatchesStockStatus(allBatches);
    const lowStockAlerts = batchesWithStatus.filter(b => b.stockStatus === 'low_stock');

    // Expiry alerts - manual filtering
    const expiredBatches = allBatches.filter(b => b.expiryDate && new Date(b.expiryDate) < now);
    const expiringIn30Days = allBatches.filter(b => 
        b.expiryDate && new Date(b.expiryDate) >= now && new Date(b.expiryDate) <= thirtyDaysFromNow
    );

    // Top selling products - manual calculation from monthly orders
    const productSales = {};
    monthlyOrders.forEach(order => {
        if (order.items && Array.isArray(order.items)) {
            order.items.forEach(item => {
                const productId = item.product?.toString() || item.product;
                if (!productSales[productId]) {
                    productSales[productId] = {
                        _id: productId,
                        name: item.name || 'Unknown',
                        totalQuantity: 0,
                        totalRevenue: 0
                    };
                }
                productSales[productId].totalQuantity += toNumber(item.quantity);
                productSales[productId].totalRevenue += toNumber(item.quantity) * toNumber(item.unitPrice);
            });
        }
    });
    const topSellingProducts = Object.values(productSales)
        .sort((a, b) => b.totalQuantity - a.totalQuantity)
        .slice(0, 10);

    // Top customers - manual calculation
    const customerStats = {};
    monthlyOrders.filter(o => o.status === 'completed').forEach(order => {
        const customerId = order.customerId?.toString() || order.customerId || 'guest';
        const customerName = order.customerName || 'Guest';
        if (!customerStats[customerId]) {
            customerStats[customerId] = {
                _id: customerId,
                name: customerName,
                totalSpent: 0,
                orderCount: 0
            };
        }
        customerStats[customerId].totalSpent += toNumber(order.totalAmount);
        customerStats[customerId].orderCount += 1;
    });
    const topCustomers = Object.values(customerStats)
        .sort((a, b) => b.totalSpent - a.totalSpent)
        .slice(0, 10);

    // Payment method breakdown - manual calculation
    const paymentMethods = { cash: 0, card: 0, credit: 0, hybrid: 0, other: 0 };
    monthlyOrders.filter(o => o.status === 'completed').forEach(order => {
        const method = order.paymentMethod?.toLowerCase() || 'other';
        if (paymentMethods.hasOwnProperty(method)) {
            paymentMethods[method] += toNumber(order.totalAmount);
        } else {
            paymentMethods.other += toNumber(order.totalAmount);
        }
    });

    // Category-wise sales - manual calculation
    const categorySales = {};
    monthlyOrders.filter(o => o.status === 'completed').forEach(order => {
        if (order.items && Array.isArray(order.items)) {
            order.items.forEach(item => {
                // Find product to get category
                const product = allProducts.find(p => p._id?.toString() === item.product?.toString());
                const categoryId = product?.category?._id?.toString() || product?.category?.toString() || 'uncategorized';
                const categoryName = product?.category?.name || 'Uncategorized';
                
                if (!categorySales[categoryId]) {
                    categorySales[categoryId] = {
                        _id: categoryId,
                        name: categoryName,
                        totalRevenue: 0,
                        totalQuantity: 0
                    };
                }
                categorySales[categoryId].totalRevenue += toNumber(item.quantity) * toNumber(item.unitPrice);
                categorySales[categoryId].totalQuantity += toNumber(item.quantity);
            });
        }
    });
    const categorySalesArray = Object.values(categorySales).sort((a, b) => b.totalRevenue - a.totalRevenue);

    // Chart data (last 7 days) - manual calculation
    const salesByDate = {};
    const purchasesByDate = {};
    const wastageByDate = {};
    
    // Get wastage data for charts
    const recentWastage = await findDocs({
        model: WastageModel,
        filter: { createdAt: { $gte: sevenDaysAgo }, status: 'approved' }
    });

    // Group orders by date
    todayOrders.concat(await findDocs({
        model: OrderModel,
        filter: { createdAt: { $gte: sevenDaysAgo } }
    })).forEach(order => {
        const dateKey = new Date(order.createdAt).toISOString().split('T')[0];
        if (!salesByDate[dateKey]) {
            salesByDate[dateKey] = { _id: dateKey, total: 0, count: 0 };
        }
        salesByDate[dateKey].total += toNumber(order.totalAmount);
        salesByDate[dateKey].count += 1;
    });

    // Group purchases by date
    todayPurchases.concat(await findDocs({
        model: PurchaseModel,
        filter: { createdAt: { $gte: sevenDaysAgo } }
    })).forEach(purchase => {
        const dateKey = new Date(purchase.createdAt).toISOString().split('T')[0];
        if (!purchasesByDate[dateKey]) {
            purchasesByDate[dateKey] = { _id: dateKey, total: 0 };
        }
        purchasesByDate[dateKey].total += toNumber(purchase.totalAmount);
    });

    // Group wastage by date
    recentWastage.forEach(wastage => {
        const dateKey = new Date(wastage.createdAt).toISOString().split('T')[0];
        if (!wastageByDate[dateKey]) {
            wastageByDate[dateKey] = { _id: dateKey, total: 0 };
        }
        wastageByDate[dateKey].total += toNumber(wastage.totalLossAmount);
    });

    const salesChart = Object.values(salesByDate).sort((a, b) => a._id.localeCompare(b._id));
    const purchaseChart = Object.values(purchasesByDate).sort((a, b) => a._id.localeCompare(b._id));
    const wastageChart = Object.values(wastageByDate).sort((a, b) => a._id.localeCompare(b._id));

    // Financial summary - manual calculation
    const receivables = qarzaAccounts.filter(qa => qa.type === 'receivable' && toNumber(qa.balance) > 0);
    const payables = qarzaAccounts.filter(qa => qa.type === 'payable' && toNumber(qa.balance) > 0);
    
    const totalReceivables = receivables.reduce((sum, qa) => sum + toNumber(qa.balance), 0);
    const totalPayables = payables.reduce((sum, qa) => sum + toNumber(qa.balance), 0);

    return {
        kpis: {
            todaySales: todaySalesCount,
            todayRevenue,
            todayPurchases: todayPurchasesTotal,
            todayExpenses: todayExpensesTotal,
            totalProducts,
            totalCustomers,
            totalSuppliers,
            monthlyRevenue,
            monthlyPurchases: monthlyPurchasesTotal,
            monthlyExpenses: monthlyExpensesTotal,
            netProfit,
            profitMargin: parseFloat(profitMargin),
            avgOrderValue,
            totalInventoryValue,
            totalInventoryQuantity,
        },
        lowStockAlerts,
        expiryAlerts: {
            expiredBatches,
            expiringIn30Days,
        },
        recentOrders,
        recentPurchases,
        topSellingProducts,
        topCustomers,
        salesChart,
        purchaseChart,
        wastageChart,
        categorySales: categorySalesArray,
        paymentMethods,
        pendingApprovals: {
            pendingWastages,
            pendingPurchaseReturns,
            pendingProductReturns,
        },
        financialSummary: {
            totalReceivables,
            totalReceivablesCount: receivables.length,
            totalPayables,
            totalPayablesCount: payables.length,
            netProfit,
        },
    };
    } catch (error) {
        console.error("Error fetching dashboard data:", error);
        return {
            kpis: {
                todaySales: 0,
                todayRevenue: 0,
                todayPurchases: 0,
                todayExpenses: 0,
                totalProducts: 0,
                totalCustomers: 0,
                totalSuppliers: 0,
                monthlyRevenue: 0,
                monthlyPurchases: 0,
                monthlyExpenses: 0,
                netProfit: 0,
                profitMargin: 0,
                avgOrderValue: 0,
                totalInventoryValue: 0,
                totalInventoryQuantity: 0,
            },
            lowStockAlerts: [],
            expiryAlerts: {
                expiredBatches: [],
                expiringIn30Days: [],
            },
            recentOrders: [],
            recentPurchases: [],
            topSellingProducts: [],
            topCustomers: [],
            salesChart: [],
            purchaseChart: [],
            wastageChart: [],
            categorySales: [],
            paymentMethods: {
                cash: 0,
                card: 0,
                credit: 0,
                hybrid: 0,
                other: 0
            },
            pendingApprovals: {
                pendingWastages: 0,
                pendingPurchaseReturns: 0,
                pendingProductReturns: 0,
            },
            financialSummary: {
                totalReceivables: 0,
                totalReceivablesCount: 0,
                totalPayables: 0,
                totalPayablesCount: 0,
                netProfit: 0,
            },
        };
    }
};

// Sales & Revenue KPIs
export const getSalesRevenueKPIs = async (range = '30D') => {
    try {
        const { startDate, endDate } = getDateRange(range);
        
        const OrderModel = getOrderModel();

        // Use centralized DB service for all queries
        const orders = await findDocs({
            model: OrderModel,
            filter: {
                createdAt: { $gte: startDate, $lte: endDate },
                status: 'completed'
            },
            options: { sort: { createdAt: -1 } }
        });

        const retailOrders = orders.filter(o => o.orderType === 'retail');
        const wholesaleOrders = orders.filter(o => o.orderType === 'wholesale');

        let totalRevenue = 0;
        let retailRevenue = 0;
        let wholesaleRevenue = 0;
        let totalCostOfGoodsSold = 0;
        let retailCostOfGoodsSold = 0;
        let wholesaleCostOfGoodsSold = 0;

        // Calculate revenue and cost from each order item
        for (const order of orders) {
            const orderRevenue = toNumber(order.totalAmount);
            
            if (order.orderType === 'retail') {
                retailRevenue += orderRevenue;
            } else if (order.orderType === 'wholesale') {
                wholesaleRevenue += orderRevenue;
            }
            
            totalRevenue += orderRevenue;

            // Calculate cost from items
            if (order.items && Array.isArray(order.items)) {
                for (const item of order.items) {
                    let costPrice = 0;
                    
                    // Get cost price from batch using service
                    if (item.batchId) {
                        const batches = await findBatchService({ _id: item.batchId });
                        if (batches[0] && batches[0].purchasePrice) {
                            costPrice = toNumber(batches[0].purchasePrice);
                        }
                    }
                    
                    const itemCost = costPrice * toNumber(item.quantity);
                    totalCostOfGoodsSold += itemCost;
                    
                    if (order.orderType === 'retail') {
                        retailCostOfGoodsSold += itemCost;
                    } else if (order.orderType === 'wholesale') {
                        wholesaleCostOfGoodsSold += itemCost;
                    }
                }
            }
        }

        const totalOrders = orders.length;
        const avgOrderValue = totalOrders > 0 ? toNumber(totalRevenue / totalOrders) : 0;
        const retailAvg = retailOrders.length > 0 ? toNumber(retailRevenue / retailOrders.length) : 0;
        const wholesaleAvg = wholesaleOrders.length > 0 ? toNumber(wholesaleRevenue / wholesaleOrders.length) : 0;

        // Calculate profits
        const totalProfit = totalRevenue - totalCostOfGoodsSold;
        const retailProfit = retailRevenue - retailCostOfGoodsSold;
        const wholesaleProfit = wholesaleRevenue - wholesaleCostOfGoodsSold;
        
        // Calculate profit percentages
        const totalProfitPercentage = totalRevenue > 0 ? toNumber((totalProfit / totalRevenue) * 100) : 0;
        const retailProfitPercentage = retailRevenue > 0 ? toNumber((retailProfit / retailRevenue) * 100) : 0;
        const wholesaleProfitPercentage = wholesaleRevenue > 0 ? toNumber((wholesaleProfit / wholesaleRevenue) * 100) : 0;

        // Calculate review percentages (assuming completed orders count as "reviewed")
        // This can be adjusted based on actual review system
        const retailReviewPercentage = retailOrders.length > 0 ? 100 : 0;
        const wholesaleReviewPercentage = wholesaleOrders.length > 0 ? 100 : 0;

        // Simple profit calculation for backward compatibility
        const grossProfit = totalProfit;
        const grossMargin = totalProfitPercentage;

        return {
            totalRevenue,
            retailRevenue,
            wholesaleRevenue,
            totalOrders,
            retailOrders: retailOrders.length,
            wholesaleOrders: wholesaleOrders.length,
            avgOrderValue,
            retailAvgOrderValue: retailAvg,
            wholesaleAvgOrderValue: wholesaleAvg,
            grossProfit,
            grossMargin,
            totalCostOfGoodsSold,
            // New fields for the updated KPI cards
            totalProfit: parseFloat(totalProfit.toFixed(2)),
            retailProfit: parseFloat(retailProfit.toFixed(2)),
            wholesaleProfit: parseFloat(wholesaleProfit.toFixed(2)),
            retailProfitPercentage: parseFloat(retailProfitPercentage.toFixed(2)),
            wholesaleProfitPercentage: parseFloat(wholesaleProfitPercentage.toFixed(2)),
            retailReviewPercentage: parseFloat(retailReviewPercentage.toFixed(2)),
            wholesaleReviewPercentage: parseFloat(wholesaleReviewPercentage.toFixed(2)),
        };
    } catch (error) {
        console.error('Error fetching sales revenue KPIs:', error);
        return {
            totalRevenue: 0,
            retailRevenue: 0,
            wholesaleRevenue: 0,
            totalOrders: 0,
            retailOrders: 0,
            wholesaleOrders: 0,
            avgOrderValue: 0,
            retailAvgOrderValue: 0,
            wholesaleAvgOrderValue: 0,
            grossProfit: 0,
            grossMargin: 0,
            totalCostOfGoodsSold: 0,
            // New fields
            totalProfit: 0,
            retailProfit: 0,
            wholesaleProfit: 0,
            retailProfitPercentage: 0,
            wholesaleProfitPercentage: 0,
            retailReviewPercentage: 0,
            wholesaleReviewPercentage: 0,
        };
    }
};

// Inventory Alert KPIs
export const getInventoryAlertKPIs = async (range = '30D') => {
    try {
        const BatchModel = getBatchModel();
        const ProductModel = getProductModel();

        const now = new Date();
        const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
        const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

        // Use centralized DB service for all queries
        const [batches, totalProducts, totalBatches] = await Promise.all([
            findDocs({ model: BatchModel, filter: { isActive: true } }),
            countDocs({ model: ProductModel, filter: { isActive: true } }),
            countDocs({ model: BatchModel, filter: { isActive: true } }),
        ]);

        // Calculate stock status for all batches using the service
        const batchesWithStatus = await calculateBatchesStockStatus(batches);

        const expiringSoon = batchesWithStatus.filter(b =>
            b.expiryDate &&
            new Date(b.expiryDate) >= now &&
            new Date(b.expiryDate) <= thirtyDaysFromNow
        );

        const expiringIn7Days = batchesWithStatus.filter(b =>
            b.expiryDate &&
            new Date(b.expiryDate) >= now &&
            new Date(b.expiryDate) <= sevenDaysFromNow
        );

        const lowStock = batchesWithStatus.filter(b =>
            b.stockStatus === 'low_stock'
        );

        const outOfStock = batchesWithStatus.filter(b => b.stockStatus === 'empty');

        return {
            expiringSoon: expiringSoon.length,
            expiringIn7Days: expiringIn7Days.length,
            lowStock: lowStock.length,
            outOfStock: outOfStock.length,
            hasCriticalExpiry: expiringIn7Days.length > 0,
            totalProducts,
            totalBatches,
        };
    } catch (error) {
        console.error('Error fetching inventory alert KPIs:', error);
        return {
            expiringSoon: 0,
            expiringIn7Days: 0,
            lowStock: 0,
            outOfStock: 0,
            hasCriticalExpiry: false,
            totalProducts: 0,
            totalBatches: 0,
        };
    }
};

// Expiry Products (paginated)
export const getExpiryProducts = async (range = '30D', page = 1, limit = 10) => {
    try {
        const BatchModel = getBatchModel();
        
        const now = new Date();
        const daysRange = range === '7D' ? 7 : 30;
        const expiryDate = new Date(now.getTime() + daysRange * 24 * 60 * 60 * 1000);

        const query = {
            isActive: true,
            expiryDate: { $gte: now, $lte: expiryDate }
        };

        // Use centralized DB service for all queries
        const [batches, total] = await Promise.all([
            findDocs({
                model: BatchModel,
                filter: query,
                options: {
                    populate: ['product'],
                    sort: { expiryDate: 1 },
                    skip: (page - 1) * limit,
                    limit
                }
            }),
            countDocs({ model: BatchModel, filter: query })
        ]);

        const data = batches.map(b => {
            const daysRemaining = Math.ceil((new Date(b.expiryDate) - now) / (1000 * 60 * 60 * 24));
            return {
                productName: b.product?.name || 'Unknown',
                sku: b.product?.productCode || 'N/A',
                batchNumber: b.batchNumber || 'N/A',
                expiryDate: b.expiryDate,
                daysRemaining,
                stockQty: toNumber(b.quantity),
                category: b.product?.category?.name || 'N/A',
                costPrice: toNumber(b.purchasePrice) || 0,
                supplier: b.supplier?.name || 'N/A',
                mfgDate: b.mfgDate || 'N/A',
                sellingPrice: toNumber(b.sellingPrice) || 0,
                discount: b.discount?.amount || 0,
                discountType: b.discount?.type || 'percentage',
            };
        });

        return {
            data,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    } catch (error) {
        console.error('Error fetching expiry products:', error);
        return {
            data: [],
            pagination: {
                total: 0,
                page,
                limit,
                totalPages: 0,
            },
        };
    }
};

// Low Stock Products (paginated)
export const getLowStockProducts = async (page = 1, limit = 10) => {
    try {
        const BatchModel = getBatchModel();
        
        // Use centralized DB service for all queries
        const batches = await findDocs({
            model: BatchModel,
            filter: {
                isActive: true,
                quantity: { $gt: 0 }
            },
            options: {
                populate: ['product'],
                sort: { quantity: 1 },
                skip: (page - 1) * limit,
                limit
            }
        });

        // Calculate stock status for batches using the service
        const batchesWithStatus = await calculateBatchesStockStatus(batches);

        const lowStockBatches = batchesWithStatus.filter(b =>
            b.stockStatus === 'low_stock'
        );

        const total = await countDocs({
            model: BatchModel,
            filter: {
                isActive: true,
                quantity: { $gt: 0 }
            }
        });

        // Get all batches to calculate accurate total count
        const allBatches = await findDocs({
            model: BatchModel,
            filter: {
                isActive: true,
                quantity: { $gt: 0 }
            }
        });
        const allBatchesWithStatus = await calculateBatchesStockStatus(allBatches);
        const lowStockCount = allBatchesWithStatus.filter(b => b.stockStatus === 'low_stock').length;

        const data = lowStockBatches.map(b => ({
            productName: b.product?.name || 'Unknown',
            sku: b.product?.productCode || 'N/A',
            batchNumber: b.batchNumber || 'N/A',
            currentStock: toNumber(b.quantity),
            minStock: toNumber(b.product?.minStockLevel || 5),
            maxStock: toNumber(b.product?.maxStockLevel || 10),
            shortage: toNumber(b.product?.minStockLevel || 5) - toNumber(b.quantity),
            category: b.product?.category?.name || 'N/A',
            costPrice: toNumber(b.purchasePrice) || 0,
            supplier: b.supplier?.name || 'N/A',
            mfgDate: b.mfgDate || 'N/A',
            expiryDate: b.expiryDate || 'N/A',
            sellingPrice: toNumber(b.sellingPrice) || 0,
            discount: b.discount?.amount || 0,
            discountType: b.discount?.type || 'percentage',
        }));

        return {
            data,
            pagination: {
                total: lowStockCount,
                page,
                limit,
                totalPages: Math.ceil(lowStockCount / limit),
            },
        };
    } catch (error) {
        console.error('Error fetching low stock products:', error);
        return {
            data: [],
            pagination: { total: 0, page, limit, totalPages: 0 },
        };
    }
};

// Out of Stock Products (paginated)
export const getOutOfStockProducts = async (page = 1, limit = 10) => {
    try {
        const BatchModel = getBatchModel();
        
        // Use centralized DB service
        const batches = await findDocs({
            model: BatchModel,
            filter: {
                isActive: true,
                quantity: 0
            },
            options: {
                populate: ['product', 'supplier'],
                sort: { updatedAt: -1 },
                skip: (page - 1) * limit,
                limit
            }
        });

        // Calculate stock status for batches using the service
        const batchesWithStatus = await calculateBatchesStockStatus(batches);

        const outOfStockBatches = batchesWithStatus.filter(b => b.stockStatus === 'empty');

        const total = await countDocs({
            model: BatchModel,
            filter: {
                isActive: true,
                quantity: 0
            }
        });

        const data = outOfStockBatches.map(b => ({
            productName: b.product?.name || 'Unknown',
            sku: b.product?.productCode || 'N/A',
            batchNumber: b.batchNumber || 'N/A',
            lastStockDate: b.updatedAt || 'N/A',
            minStock: toNumber(b.product?.minStockLevel || 5),
            category: b.product?.category?.name || 'N/A',
            costPrice: toNumber(b.purchasePrice) || 0,
            supplier: b.supplier?.name || 'N/A',
            mfgDate: b.mfgDate || 'N/A',
            expiryDate: b.expiryDate || 'N/A',
            sellingPrice: toNumber(b.sellingPrice) || 0,
            discount: b.discount?.amount || 0,
            discountType: b.discount?.type || 'percentage',
        }));

        return {
            data,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    } catch (error) {
        console.error('Error fetching out of stock products:', error);
        return {
            data: [],
            pagination: { total: 0, page, limit, totalPages: 0 },
        };
    }
};

// Revenue Over Time
export const getRevenueOverTime = async (range = '30D') => {
    try {
        const { startDate, endDate } = getDateRange(range);

        // Use service to get orders (auto-filters deleted)
        const orders = await findOrderService({
            createdAt: { $gte: startDate, $lte: endDate },
            status: 'completed'
        });

        // Manual grouping by date
        const revenueByDate = {};
        orders.forEach(order => {
            const dateKey = range === '7D' || range === '30D' || range === '90D'
                ? new Date(order.createdAt).toISOString().split('T')[0]  // YYYY-MM-DD
                : new Date(order.createdAt).toISOString().substring(0, 7);  // YYYY-MM

            if (!revenueByDate[dateKey]) {
                revenueByDate[dateKey] = { date: dateKey, retail: 0, wholesale: 0 };
            }

            if (order.orderType === 'retail') {
                revenueByDate[dateKey].retail += toNumber(order.totalAmount);
            } else if (order.orderType === 'wholesale') {
                revenueByDate[dateKey].wholesale += toNumber(order.totalAmount);
            }
        });

        return Object.values(revenueByDate).sort((a, b) => a.date.localeCompare(b.date));
    } catch (error) {
        console.error('Error fetching revenue over time:', error);
        return [];
    }
};

// Orders Over Time
export const getOrdersOverTime = async (range = '30D') => {
    try {
        const { startDate, endDate } = getDateRange(range);

        // Use service to get orders (auto-filters deleted)
        const orders = await findOrderService({
            createdAt: { $gte: startDate, $lte: endDate },
            status: 'completed'
        });

        // Manual grouping by date
        const ordersByDate = {};
        orders.forEach(order => {
            const dateKey = range === '7D' || range === '30D' || range === '90D'
                ? new Date(order.createdAt).toISOString().split('T')[0]
                : new Date(order.createdAt).toISOString().substring(0, 7);

            if (!ordersByDate[dateKey]) {
                ordersByDate[dateKey] = { date: dateKey, retail: 0, wholesale: 0 };
            }

            if (order.orderType === 'retail') {
                ordersByDate[dateKey].retail += 1;
            } else if (order.orderType === 'wholesale') {
                ordersByDate[dateKey].wholesale += 1;
            }
        });

        return Object.values(ordersByDate).sort((a, b) => a.date.localeCompare(b.date));
    } catch (error) {
        console.error('Error fetching orders over time:', error);
        return [];
    }
};

// Top Selling Products
export const getTopSellingProducts = async (range = '30D', metric = 'revenue') => {
    try {
        const { startDate, endDate } = getDateRange(range);

        // Use service to get orders (auto-filters deleted)
        const orders = await findOrderService({
            createdAt: { $gte: startDate, $lte: endDate },
            status: 'completed'
        });

        // Get all products for name lookup
        const products = await findProductService({ isActive: true });
        const productMap = {};
        products.forEach(p => {
            productMap[p._id.toString()] = p.name;
        });

        // Manual calculation
        const productSales = {};
        orders.forEach(order => {
            if (order.items && Array.isArray(order.items)) {
                order.items.forEach(item => {
                    const productId = item.product?.toString() || item.product;
                    if (!productSales[productId]) {
                        productSales[productId] = {
                            name: item.name || productMap[productId] || 'Unknown',
                            unitsSold: 0,
                            revenue: 0
                        };
                    }
                    productSales[productId].unitsSold += toNumber(item.quantity);
                    productSales[productId].revenue += toNumber(item.quantity) * toNumber(item.unitPrice);
                });
            }
        });

        // Sort and limit
        const sortField = metric === 'revenue' ? 'revenue' : 'unitsSold';
        return Object.values(productSales)
            .sort((a, b) => b[sortField] - a[sortField])
            .slice(0, 10);
    } catch (error) {
        console.error('Error fetching top selling products:', error);
        return [];
    }
};

// Sales by Category
export const getSalesByCategory = async (range = '30D') => {
    try {
        const { startDate, endDate } = getDateRange(range);

        // Use services to get data (auto-filters deleted)
        const orders = await findOrderService({
            createdAt: { $gte: startDate, $lte: endDate },
            status: 'completed'
        });

        const products = await findProductService({ isActive: true }, { populate: 'category' });

        // Create lookup maps
        const productMap = {};
        products.forEach(p => {
            productMap[p._id.toString()] = {
                categoryId: p.category?._id?.toString() || p.category?.toString() || 'uncategorized',
                categoryName: p.category?.name || 'Uncategorized'
            };
        });

        // Manual calculation
        const categorySales = {};
        orders.forEach(order => {
            if (order.items && Array.isArray(order.items)) {
                order.items.forEach(item => {
                    const productId = item.product?.toString() || item.product;
                    const productInfo = productMap[productId];
                    if (!productInfo) return;

                    const categoryId = productInfo.categoryId;
                    const categoryName = productInfo.categoryName;

                    if (!categorySales[categoryId]) {
                        categorySales[categoryId] = {
                            category: categoryName,
                            totalRevenue: 0,
                            totalQuantity: 0
                        };
                    }
                    categorySales[categoryId].totalRevenue += toNumber(item.quantity) * toNumber(item.unitPrice);
                    categorySales[categoryId].totalQuantity += toNumber(item.quantity);
                });
            }
        });

        return Object.values(categorySales).sort((a, b) => b.totalRevenue - a.totalRevenue);
    } catch (error) {
        console.error('Error fetching sales by category:', error);
        return [];
    }
};

// Retail vs Wholesale Comparison
export const getRetailVsWholesaleComparison = async (range = '30D') => {
    try {
        const { startDate, endDate } = getDateRange(range);

        // Use service to get orders (auto-filters deleted)
        const orders = await findOrderService({
            createdAt: { $gte: startDate, $lte: endDate },
            status: 'completed'
        });

        // Manual grouping by date
        const comparisonByDate = {};
        orders.forEach(order => {
            const dateKey = range === '7D' || range === '30D' || range === '90D'
                ? new Date(order.createdAt).toISOString().split('T')[0]
                : new Date(order.createdAt).toISOString().substring(0, 7);

            if (!comparisonByDate[dateKey]) {
                comparisonByDate[dateKey] = { date: dateKey, retail: 0, wholesale: 0 };
            }

            if (order.orderType === 'retail') {
                comparisonByDate[dateKey].retail += toNumber(order.totalAmount);
            } else if (order.orderType === 'wholesale') {
                comparisonByDate[dateKey].wholesale += toNumber(order.totalAmount);
            }
        });

        return Object.values(comparisonByDate).sort((a, b) => a.date.localeCompare(b.date));
    } catch (error) {
        console.error('Error fetching retail vs wholesale comparison:', error);
        return [];
    }
};

// Stock Level by Category
export const getStockLevelByCategory = async () => {
    try {
        // Use services (auto-filter deleted)
        const products = await findProductService({ isActive: true }, { populate: 'category' });
        const batches = await findBatchService({ isActive: true });
        const categories = await findCategoryService({});
        
        // Group batches by product
        const batchesByProduct = {};
        batches.forEach(batch => {
            if (batch.product) {
                if (!batchesByProduct[batch.product]) {
                    batchesByProduct[batch.product] = [];
                }
                batchesByProduct[batch.product].push(batch);
            }
        });
        
        // Calculate stock by category
        const categoryStock = {};
        products.forEach(product => {
            const categoryId = product.category?._id?.toString() || product.category?.toString() || 'uncategorized';
            const categoryName = product.category?.name || 'Uncategorized';
            const productId = product._id?.toString();
            const productBatches = batchesByProduct[productId] || [];
            const totalStock = productBatches.reduce((sum, batch) => sum + toNumber(batch.quantity), 0);
            
            if (!categoryStock[categoryId]) {
                categoryStock[categoryId] = {
                    name: categoryName,
                    stockLevel: 0
                };
            }
            categoryStock[categoryId].stockLevel += totalStock;
        });
        
        return Object.values(categoryStock).sort((a, b) => b.stockLevel - a.stockLevel);
    } catch (error) {
        console.error('Error fetching stock level by category:', error);
        return [];
    }
};
