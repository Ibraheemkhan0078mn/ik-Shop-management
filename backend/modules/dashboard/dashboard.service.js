import {
    getLocalOrderModel,
    getLocalPurchaseModel,
    getLocalExpensesModel,
    getLocalProductModel,
    getLocalCustomerModel,
    getLocalSupplierModel,
    getLocalBatchModel,
    getLocalWastageModel,
    getLocalPurchaseReturnModel,
    getLocalProductReturnModel,
    getLocalCategoryModel,
    getLocalQarzaAccountModel,
} from "../../configs/connect.db.js";

export const getDashboardData = async () => {
    try {
        const OrderModel = getLocalOrderModel();
        const PurchaseModel = getLocalPurchaseModel();
        const ExpenseModel = getLocalExpensesModel();
        const ProductModel = getLocalProductModel();
        const CustomerModel = getLocalCustomerModel();
        const SupplierModel = getLocalSupplierModel();
        const BatchModel = getLocalBatchModel();
        const WastageModel = getLocalWastageModel();
        const PurchaseReturnModel = getLocalPurchaseReturnModel();
        const ProductReturnModel = getLocalProductReturnModel();
        const CategoryModel = getLocalCategoryModel();
        const QarzaAccountModel = getLocalQarzaAccountModel();

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

    // Calculate KPIs
    const todaySalesCount = todayOrders.length;
    const todayRevenue = todayOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
    const todayPurchasesTotal = todayPurchases.reduce((sum, purchase) => sum + (purchase.totalAmount || 0), 0);
    const todayExpensesTotal = todayExpenses.reduce((sum, expense) => sum + (expense.amount || 0), 0);
    
    const monthlyRevenue = monthlyOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
    const monthlyPurchasesTotal = monthlyPurchases.reduce((sum, purchase) => sum + (purchase.totalAmount || 0), 0);
    const monthlyExpensesTotal = monthlyExpenses.reduce((sum, expense) => sum + (expense.amount || 0), 0);
    const netProfit = monthlyRevenue - monthlyPurchasesTotal - monthlyExpensesTotal;
    const profitMargin = monthlyRevenue > 0 ? ((netProfit / monthlyRevenue) * 100).toFixed(2) : 0;
    
    const avgOrderValue = monthlyOrders.length > 0 ? monthlyRevenue / monthlyOrders.length : 0;
    const totalInventoryValue = inventoryValue[0]?.totalValue || 0;
    const totalInventoryQuantity = inventoryValue[0]?.totalQuantity || 0;

    // Low stock alerts
    const lowStockAlerts = lowStockProducts.filter(p => (p.currentStockLevel || 0) <= (p.minStockLevel || 5));

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
