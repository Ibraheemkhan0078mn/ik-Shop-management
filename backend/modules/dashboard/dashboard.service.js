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
} from "../../configs/connect.db.js";

export const getDashboardData = async () => {
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

    const now = new Date();
    const startOfDay = new Date(now.setHours(0, 0, 0, 0));
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

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
        pendingWastages,
        pendingPurchaseReturns,
        pendingProductReturns,
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
        OrderModel.find().sort({ createdAt: -1 }).limit(10).populate('items.product'),
        PurchaseModel.find().sort({ createdAt: -1 }).limit(10),
        
        // Top selling products
        OrderModel.aggregate([
            { $match: { createdAt: { $gte: startOfMonth } } },
            { $unwind: "$items" },
            { $group: { _id: "$items.product", totalQuantity: { $sum: "$items.quantity" } } },
            { $sort: { totalQuantity: -1 } },
            { $limit: 10 },
            { $lookup: { from: "products", localField: "_id", foreignField: "_id", as: "product" } },
            { $unwind: "$product" },
            { $project: { _id: 1, name: "$product.name", totalQuantity: 1 } }
        ]),
        
        // Pending approvals
        WastageModel.countDocuments({ status: "pending" }),
        PurchaseReturnModel.countDocuments({ status: "pending" }),
        ProductReturnModel.countDocuments({ returnStatus: "pending" }),
    ]);

    // Calculate KPIs
    const todaySales = todayOrders.length;
    const todayRevenue = todayOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
    const todayPurchasesTotal = todayPurchases.reduce((sum, purchase) => sum + (purchase.totalAmount || 0), 0);
    const todayExpensesTotal = todayExpenses.reduce((sum, expense) => sum + (expense.amount || 0), 0);
    
    const monthlyRevenue = monthlyOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
    const monthlyPurchasesTotal = monthlyPurchases.reduce((sum, purchase) => sum + (purchase.totalAmount || 0), 0);
    const monthlyExpensesTotal = monthlyExpenses.reduce((sum, expense) => sum + (expense.amount || 0), 0);
    const netProfit = monthlyRevenue - monthlyPurchasesTotal - monthlyExpensesTotal;

    // Low stock alerts
    const lowStockAlerts = lowStockProducts.filter(p => (p.currentStockLevel || 0) <= (p.minStockLevel || 5));

    // Expiry alerts
    expiredBatches = expiredBatches.filter(b => b.expiryDate && new Date(b.expiryDate) < new Date());
    expiringBatches = expiringBatches.filter(b => b.expiryDate && new Date(b.expiryDate) >= new Date() && new Date(b.expiryDate) <= thirtyDaysFromNow);

    // Chart data (last 7 days)
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const salesChart = await OrderModel.aggregate([
        { $match: { createdAt: { $gte: sevenDaysAgo } } },
        { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, total: { $sum: "$totalAmount" } } },
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

    return {
        kpis: {
            todaySales,
            todayRevenue,
            todayPurchases: todayPurchasesTotal,
            todayExpenses: todayExpensesTotal,
            totalProducts,
            totalCustomers,
            totalSuppliers,
            monthlyRevenue,
            monthlyPurchases: monthlyPurchasesTotal,
            monthlyExpenses: monthlyExpensesTotal,
        },
        lowStockAlerts,
        expiryAlerts: {
            expiredBatches,
            expiringIn30Days: expiringBatches,
        },
        recentOrders,
        recentPurchases,
        topSellingProducts,
        salesChart,
        purchaseChart,
        wastageChart,
        pendingApprovals: {
            pendingWastages,
            pendingPurchaseReturns,
            pendingProductReturns,
        },
        financialSummary: {
            totalReceivables: 0, // TODO: Calculate from qarza accounts
            totalPayables: 0, // TODO: Calculate from supplier accounts
            netProfit,
        },
    };
};
