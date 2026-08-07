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

// Helper function to get date range based on filter
const getDateRange = (range) => {
    const now = new Date();
    let startDate;
    let endDate = now;

    // Handle custom date range
    if (typeof range === 'object' && range.type === 'custom') {
        return {
            startDate: new Date(range.startDate),
            endDate: new Date(range.endDate)
        };
    }

    switch (range) {
        case 'Today':
            startDate = new Date(now.setHours(0, 0, 0, 0));
            break;
        case '3D':
            startDate = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
            break;
        case '7D':
            startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            break;
        case '30D':
            startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            break;
        case '3M':
            startDate = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
            break;
        case '90D':
            startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
            break;
        case '1Y':
            startDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
            break;
        case 'All':
            startDate = new Date(0);
            break;
        default:
            startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
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
        const CategoryModel = getCategoryModel();
        const QarzaAccountModel = getQarzaAccountModel();

    const now = new Date();
    const startOfDay = new Date(now.setHours(0, 0, 0, 0));
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
        lowStockProducts,
        expiredBatches,
        expiringBatches,
        recentOrders,
        recentPurchases,
        topSellingProducts,
        topCustomers,
        pendingWastages,
        pendingPurchaseReturns,
        pendingProductReturns,
        inventoryValue,
        paymentMethodBreakdown,
        categorySales,
        receivables,
        payables,
    ] = await Promise.all([
        // Today's data
        OrderModel.find({ createdAt: { $gte: startOfDay } }),
        PurchaseModel.find({ createdAt: { $gte: startOfDay } }),
        ExpenseModel.find({ createdAt: { $gte: startOfDay } }),
        
        // Monthly data
        OrderModel.find({ createdAt: { $gte: startOfMonth } }),
        PurchaseModel.find({ createdAt: { $gte: startOfMonth } }),
        ExpenseModel.find({ createdAt: { $gte: startOfMonth } }),
        
        // Counts
        ProductModel.countDocuments({ isActive: true }),
        CustomerModel.countDocuments(),
        SupplierModel.countDocuments(),
        
        // Stock alerts
        ProductModel.find({ isActive: true }).lean(),
        BatchModel.find({ isActive: true }).lean(),
        
        // Recent data
        OrderModel.find().sort({ createdAt: -1 }).limit(10).populate('items.product').populate('customer'),
        PurchaseModel.find().sort({ createdAt: -1 }).limit(10).populate('supplier'),
        
        // Top selling products
        OrderModel.aggregate([
            { $match: { createdAt: { $gte: startOfMonth } } },
            { $unwind: "$items" },
            { $group: { _id: "$items.product", totalQuantity: { $sum: "$items.quantity" }, totalRevenue: { $sum: { $multiply: ["$items.quantity", "$items.unitPrice"] } } } },
            { $sort: { totalQuantity: -1 } },
            { $limit: 10 },
            { $lookup: { from: "products", localField: "_id", foreignField: "_id", as: "product" } },
            { $unwind: "$product" },
            { $project: { _id: 1, name: "$product.name", totalQuantity: 1, totalRevenue: 1 } }
        ]),
        
        // Top customers
        OrderModel.aggregate([
            { $match: { createdAt: { $gte: startOfMonth }, status: "completed" } },
            { $group: { _id: "$customer", totalSpent: { $sum: "$totalAmount" }, orderCount: { $sum: 1 } } },
            { $sort: { totalSpent: -1 } },
            { $limit: 10 },
            { $lookup: { from: "customers", localField: "_id", foreignField: "_id", as: "customer" } },
            { $unwind: { path: "$customer", preserveNullAndEmptyArrays: true } },
            { $project: { _id: 1, name: { $ifNull: ["$customer.name", "Guest"] }, totalSpent: 1, orderCount: 1 } }
        ]),
        
        // Pending approvals
        WastageModel.countDocuments({ status: "pending" }),
        PurchaseReturnModel.countDocuments({ status: "pending" }),
        ProductReturnModel.countDocuments({ returnStatus: "pending" }),
        
        // Inventory value
        BatchModel.aggregate([
            { $match: { quantity: { $gt: 0 }, isActive: true } },
            { $group: { _id: null, totalValue: { $sum: { $multiply: ["$quantity", "$costPrice"] } }, totalQuantity: { $sum: "$quantity" } } }
        ]),
        
        // Payment method breakdown (monthly)
        OrderModel.aggregate([
            { $match: { createdAt: { $gte: startOfMonth }, status: "completed" } },
            { $group: { _id: "$paymentMethod", total: { $sum: "$totalAmount" }, count: { $sum: 1 } } }
        ]),
        
        // Category-wise sales
        OrderModel.aggregate([
            { $match: { createdAt: { $gte: startOfMonth }, status: "completed" } },
            { $unwind: "$items" },
            { $lookup: { from: "products", localField: "items.product", foreignField: "_id", as: "product" } },
            { $unwind: "$product" },
            { $group: { _id: "$product.category", totalRevenue: { $sum: { $multiply: ["$items.quantity", "$items.unitPrice"] } }, totalQuantity: { $sum: "$items.quantity" } } },
            { $lookup: { from: "categories", localField: "_id", foreignField: "_id", as: "category" } },
            { $unwind: { path: "$category", preserveNullAndEmptyArrays: true } },
            { $project: { _id: 1, name: { $ifNull: ["$category.name", "Uncategorized"] }, totalRevenue: 1, totalQuantity: 1 } },
            { $sort: { totalRevenue: -1 } }
        ]),
        
        // Receivables (customer qarza)
        QarzaAccountModel.aggregate([
            { $match: { type: "receivable", balance: { $gt: 0 } } },
            { $group: { _id: null, total: { $sum: "$balance" }, count: { $sum: 1 } } }
        ]),
        
        // Payables (supplier qarza)
        QarzaAccountModel.aggregate([
            { $match: { type: "payable", balance: { $gt: 0 } } },
            { $group: { _id: null, total: { $sum: "$balance" }, count: { $sum: 1 } } }
        ]),
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
    const totalInventoryValue = inventoryValue[0]?.totalValue ? toNumber(inventoryValue[0].totalValue) : 0;
    const totalInventoryQuantity = inventoryValue[0]?.totalQuantity ? toNumber(inventoryValue[0].totalQuantity) : 0;

    // Low stock alerts with safe number conversion
    const lowStockAlerts = lowStockProducts.filter(p => toNumber(p.currentStockLevel) <= toNumber(p.minStockLevel || 5));

    // Expiry alerts
    const filteredExpiredBatches = expiredBatches.filter(b => b.expiryDate && new Date(b.expiryDate) < new Date());
    const filteredExpiringBatches = expiringBatches.filter(b => b.expiryDate && new Date(b.expiryDate) >= new Date() && new Date(b.expiryDate) <= thirtyDaysFromNow);

    // Chart data (last 7 days)
    const salesChart = await OrderModel.aggregate([
        { $match: { createdAt: { $gte: sevenDaysAgo } } },
        { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, total: { $sum: "$totalAmount" }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } }
    ]);
    
    const purchaseChart = await PurchaseModel.aggregate([
        { $match: { createdAt: { $gte: sevenDaysAgo } } },
        { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, total: { $sum: "$totalAmount" } } },
        { $sort: { _id: 1 } }
    ]);
    
    const wastageChart = await WastageModel.aggregate([
        { $match: { createdAt: { $gte: sevenDaysAgo }, status: "approved" } },
        { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, total: { $sum: "$totalLossAmount" } } },
        { $sort: { _id: 1 } }
    ]);

    // Format payment method breakdown
    const paymentMethods = {
        cash: 0,
        card: 0,
        credit: 0,
        other: 0
    };
    paymentMethodBreakdown.forEach(pm => {
        const method = pm._id?.toLowerCase() || 'other';
        if (paymentMethods.hasOwnProperty(method)) {
            paymentMethods[method] = pm.total;
        } else {
            paymentMethods.other += pm.total;
        }
    });

    // Ensure arrays exist
    const receivablesArray = receivables || [];
    const payablesArray = payables || [];

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
            expiredBatches: filteredExpiredBatches,
            expiringIn30Days: filteredExpiringBatches,
        },
        recentOrders,
        recentPurchases,
        topSellingProducts,
        topCustomers,
        salesChart,
        purchaseChart,
        wastageChart,
        categorySales,
        paymentMethods,
        pendingApprovals: {
            pendingWastages,
            pendingPurchaseReturns,
            pendingProductReturns,
        },
        financialSummary: {
            totalReceivables: receivablesArray[0]?.total || 0,
            totalReceivablesCount: receivablesArray[0]?.count || 0,
            totalPayables: payablesArray[0]?.total || 0,
            totalPayablesCount: payablesArray[0]?.count || 0,
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
        
        // Import service functions
        const { findOrderService } = await import('../pos/services/order.crud.js');
        const { findByIdBatchService } = await import('../productPurchases/services/batch.crud.js');

        const orders = await findOrderService({
            createdAt: { $gte: startDate, $lte: endDate },
            status: 'completed'
        }, { sort: { createdAt: -1 } });

        const retailOrders = orders.filter(o => o.orderType === 'retail');
        const wholesaleOrders = orders.filter(o => o.orderType === 'wholesale');

        let totalRevenue = 0;
        let retailRevenue = 0;
        let wholesaleRevenue = 0;
        let totalCostOfGoodsSold = 0;

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
                        const batch = await findByIdBatchService(item.batchId);
                        if (batch && batch.purchasePrice) {
                            costPrice = toNumber(batch.purchasePrice);
                        }
                    }
                    
                    // Cost = costPrice × quantity
                    totalCostOfGoodsSold += costPrice * toNumber(item.quantity);
                }
            }
        }

        const totalOrders = orders.length;
        const avgOrderValue = totalOrders > 0 ? toNumber(totalRevenue / totalOrders) : 0;
        const retailAvg = retailOrders.length > 0 ? toNumber(retailRevenue / retailOrders.length) : 0;
        const wholesaleAvg = wholesaleOrders.length > 0 ? toNumber(wholesaleRevenue / wholesaleOrders.length) : 0;

        // Simple profit calculation
        const grossProfit = totalRevenue - totalCostOfGoodsSold;
        const grossMargin = totalRevenue > 0 ? toNumber((grossProfit / totalRevenue) * 100) : 0;

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
        };
    }
};

// Inventory Alert KPIs
export const getInventoryAlertKPIs = async (range = '30D') => {
    try {
        // Import service functions
        const { findBatchService } = await import('../productPurchases/services/batch.crud.js');
        const { countProductService } = await import('../product/services/product.crud.js');
        const { countBatchService } = await import('../productPurchases/services/batch.crud.js');
        
        const now = new Date();
        const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
        const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

        const [batches, totalProducts, totalBatches] = await Promise.all([
            findBatchService({ isActive: true }),
            countProductService({ isActive: true }),
            countBatchService({ isActive: true }),
        ]);

        const expiringSoon = batches.filter(b => 
            b.expiryDate && 
            new Date(b.expiryDate) >= now && 
            new Date(b.expiryDate) <= thirtyDaysFromNow
        );

        const expiringIn7Days = batches.filter(b =>
            b.expiryDate &&
            new Date(b.expiryDate) >= now &&
            new Date(b.expiryDate) <= sevenDaysFromNow
        );

        const lowStock = batches.filter(b =>
            toNumber(b.quantity) > 0 &&
            toNumber(b.quantity) < toNumber(b.minStock || 5)
        );

        const outOfStock = batches.filter(b => toNumber(b.quantity) === 0);

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
        // Import service functions
        const { findBatchService } = await import('../productPurchases/services/batch.crud.js');
        const { countBatchService } = await import('../productPurchases/services/batch.crud.js');
        
        const now = new Date();
        const daysRange = range === '7D' ? 7 : 30;
        const expiryDate = new Date(now.getTime() + daysRange * 24 * 60 * 60 * 1000);

        const query = {
            isActive: true,
            expiryDate: { $gte: now, $lte: expiryDate }
        };

        const [batches, total] = await Promise.all([
            findBatchService(query, {
                populate: ['product'],
                sort: { expiryDate: 1 },
                skip: (page - 1) * limit,
                limit
            }),
            countBatchService(query)
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
        // Import service functions
        const { findBatchService } = await import('../productPurchases/services/batch.crud.js');
        const { countBatchService } = await import('../productPurchases/services/batch.crud.js');

        const batches = await findBatchService({
            isActive: true,
            quantity: { $gt: 0 }
        }, {
            populate: ['product'],
            sort: { quantity: 1 },
            skip: (page - 1) * limit,
            limit
        });

        const lowStockBatches = batches.filter(b => 
            toNumber(b.quantity) < toNumber(b.minStock || 5)
        );

        const total = await countBatchService({
            isActive: true,
            quantity: { $gt: 0, $lt: 5 }
        });

        const data = lowStockBatches.map(b => ({
            productName: b.product?.name || 'Unknown',
            sku: b.product?.productCode || 'N/A',
            batchNumber: b.batchNumber || 'N/A',
            currentStock: toNumber(b.quantity),
            minStock: toNumber(b.minStock || 5),
            maxStock: toNumber(b.maxStock || 10),
            shortage: toNumber(b.minStock || 5) - toNumber(b.quantity),
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
        // Import service functions
        const { findBatchService } = await import('../productPurchases/services/batch.crud.js');
        const { countBatchService } = await import('../productPurchases/services/batch.crud.js');

        const batches = await findBatchService({
            isActive: true,
            quantity: 0
        }, {
            populate: ['product'],
            sort: { updatedAt: -1 },
            skip: (page - 1) * limit,
            limit
        });

        const total = await countBatchService({
            isActive: true,
            quantity: 0
        });

        const data = batches.map(b => ({
            productName: b.product?.name || 'Unknown',
            sku: b.product?.productCode || 'N/A',
            batchNumber: b.batchNumber || 'N/A',
            lastStockDate: b.updatedAt || 'N/A',
            minStock: toNumber(b.minStock || 5),
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
        const OrderModel = getOrderModel();

        const groupBy = range === '7D' || range === '30D' || range === '90D' ? '%Y-%m-%d' : '%Y-%m';

        const data = await OrderModel.aggregate([
            {
                $match: {
                    createdAt: { $gte: startDate, $lte: endDate },
                    status: 'completed'
                }
            },
            {
                $group: {
                    _id: { $dateToString: { format: groupBy, date: '$createdAt' } },
                    retail: {
                        $sum: { $cond: [{ $eq: ['$orderType', 'retail'] }, '$totalAmount', 0] }
                    },
                    wholesale: {
                        $sum: { $cond: [{ $eq: ['$orderType', 'wholesale'] }, '$totalAmount', 0] }
                    }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        return data.map(d => ({
            date: d._id,
            retail: toNumber(d.retail),
            wholesale: toNumber(d.wholesale),
        }));
    } catch (error) {
        console.error('Error fetching revenue over time:', error);
        return [];
    }
};

// Orders Over Time
export const getOrdersOverTime = async (range = '30D') => {
    try {
        const { startDate, endDate } = getDateRange(range);
        const OrderModel = getOrderModel();

        const groupBy = range === '7D' || range === '30D' || range === '90D' ? '%Y-%m-%d' : '%Y-%m';

        const data = await OrderModel.aggregate([
            {
                $match: {
                    createdAt: { $gte: startDate, $lte: endDate },
                    status: 'completed'
                }
            },
            {
                $group: {
                    _id: { $dateToString: { format: groupBy, date: '$createdAt' } },
                    retail: {
                        $sum: { $cond: [{ $eq: ['$orderType', 'retail'] }, 1, 0] }
                    },
                    wholesale: {
                        $sum: { $cond: [{ $eq: ['$orderType', 'wholesale'] }, 1, 0] }
                    }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        return data.map(d => ({
            date: d._id,
            retail: d.retail,
            wholesale: d.wholesale,
        }));
    } catch (error) {
        console.error('Error fetching orders over time:', error);
        return [];
    }
};

// Top Selling Products
export const getTopSellingProducts = async (range = '30D', metric = 'revenue') => {
    try {
        const { startDate, endDate } = getDateRange(range);
        const OrderModel = getOrderModel();

        const sortField = metric === 'revenue' ? 'totalRevenue' : 'totalQuantity';

        const data = await OrderModel.aggregate([
            {
                $match: {
                    createdAt: { $gte: startDate, $lte: endDate },
                    status: 'completed'
                }
            },
            { $unwind: '$items' },
            {
                $group: {
                    _id: '$items.product',
                    totalQuantity: { $sum: '$items.quantity' },
                    totalRevenue: { $sum: { $multiply: ['$items.quantity', '$items.unitPrice'] } }
                }
            },
            { $sort: { [sortField]: -1 } },
            { $limit: 10 },
            {
                $lookup: {
                    from: 'products',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'product'
                }
            },
            { $unwind: '$product' },
            {
                $project: {
                    name: '$product.name',
                    totalQuantity: 1,
                    totalRevenue: 1
                }
            }
        ]);

        return data.map(d => ({
            name: d.name,
            unitsSold: toNumber(d.totalQuantity),
            revenue: toNumber(d.totalRevenue),
        }));
    } catch (error) {
        console.error('Error fetching top selling products:', error);
        return [];
    }
};

// Sales by Category
export const getSalesByCategory = async (range = '30D') => {
    try {
        const { startDate, endDate } = getDateRange(range);
        const OrderModel = getOrderModel();

        const data = await OrderModel.aggregate([
            {
                $match: {
                    createdAt: { $gte: startDate, $lte: endDate },
                    status: 'completed'
                }
            },
            { $unwind: '$items' },
            {
                $lookup: {
                    from: 'products',
                    localField: 'items.product',
                    foreignField: '_id',
                    as: 'product'
                }
            },
            { $unwind: '$product' },
            {
                $group: {
                    _id: '$product.category',
                    revenue: { $sum: { $multiply: ['$items.quantity', '$items.unitPrice'] } },
                    orderCount: { $sum: 1 }
                }
            },
            {
                $lookup: {
                    from: 'categories',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'category'
                }
            },
            { $unwind: { path: '$category', preserveNullAndEmptyArrays: true } },
            {
                $project: {
                    name: { $ifNull: ['$category.name', 'Uncategorized'] },
                    revenue: 1,
                    orderCount: 1
                }
            },
            { $sort: { revenue: -1 } }
        ]);

        return data.map(d => ({
            name: d.name,
            revenue: toNumber(d.revenue),
            orderCount: d.orderCount,
        }));
    } catch (error) {
        console.error('Error fetching sales by category:', error);
        return [];
    }
};

// Retail vs Wholesale Comparison
export const getRetailVsWholesaleComparison = async (range = '30D') => {
    try {
        const { startDate, endDate } = getDateRange(range);
        const OrderModel = getOrderModel();

        const groupBy = range === '7D' || range === '30D' || range === '90D' ? '%Y-%m-%d' : '%Y-%m';

        const data = await OrderModel.aggregate([
            {
                $match: {
                    createdAt: { $gte: startDate, $lte: endDate },
                    status: 'completed'
                }
            },
            {
                $group: {
                    _id: { $dateToString: { format: groupBy, date: '$createdAt' } },
                    retail: {
                        $sum: { $cond: [{ $eq: ['$orderType', 'retail'] }, '$totalAmount', 0] }
                    },
                    wholesale: {
                        $sum: { $cond: [{ $eq: ['$orderType', 'wholesale'] }, '$totalAmount', 0] }
                    }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        return data.map(d => ({
            date: d._id,
            retail: toNumber(d.retail),
            wholesale: toNumber(d.wholesale),
        }));
    } catch (error) {
        console.error('Error fetching retail vs wholesale comparison:', error);
        return [];
    }
};

// Stock Level by Category
export const getStockLevelByCategory = async () => {
    try {
        // Import service functions
        const { findProductService } = await import('../product/services/product.crud.js');
        const { findBatchService } = await import('../productPurchases/services/batch.crud.js');
        const { findCategoryService } = await import('../product/services/category.crud.js');

        // Get all active products
        const products = await findProductService({ isActive: true });
        
        // Get all active batches
        const batches = await findBatchService({ isActive: true });
        
        // Get all categories
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
            const categoryId = product.category?.toString() || 'uncategorized';
            const productBatches = batchesByProduct[product._id?.toString()] || [];
            const totalStock = productBatches.reduce((sum, batch) => sum + toNumber(batch.quantity), 0);
            
            if (!categoryStock[categoryId]) {
                categoryStock[categoryId] = 0;
            }
            categoryStock[categoryId] += totalStock;
        });
        
        // Map to category names
        const data = Object.keys(categoryStock).map(categoryId => {
            const category = categories.find(c => c._id?.toString() === categoryId);
            return {
                name: category?.name || 'Uncategorized',
                stockLevel: toNumber(categoryStock[categoryId]),
            };
        }).sort((a, b) => b.stockLevel - a.stockLevel);

        return data;
    } catch (error) {
        console.error('Error fetching stock level by category:', error);
        return [];
    }
};
