import {
    getLocalOrderModel,
    getLocalHoldOrderModel,
    getLocalProductModel,
    getLocalBatchModel,
    getLocalPurchaseModel,
    getLocalSupplierModel,
    getLocalMemberModel,
    getLocalExpensesModel,
    getLocalExpenseCategoryModel,
    getLocalInventoryModel,
    getLocalWastageModel,
    getLocalReturnModel,
    getLocalPurchaseReturnModel,
    getLocalQarzaAccountModel,
    getLocalQarzaPaymentModel,
    getLocalActivityLogModel,
    getLocalCategoryModel,
} from "../../../configs/connect.db.js";

// Helper function to build date filter
const buildDateFilter = (fromDate, toDate) => {
    const filter = {};
    if (fromDate) filter.createdAt = { $gte: new Date(fromDate) };
    if (toDate) {
        if (filter.createdAt) {
            filter.createdAt.$lte = new Date(toDate);
        } else {
            filter.createdAt = { $lte: new Date(toDate) };
        }
    }
    return filter;
};

// Helper function to get today's date range
const getTodayRange = () => {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
    return { startOfDay, endOfDay };
};

// Dashboard Summary
export const getDashboardSummary = async (filters = {}) => {
    const OrderModel = getLocalOrderModel();
    const PurchaseModel = getLocalPurchaseModel();
    const ExpensesModel = getLocalExpensesModel();
    const BatchModel = getLocalBatchModel();
    const QarzaAccountModel = getLocalQarzaAccountModel();
    const MemberModel = getLocalMemberModel();
    const SupplierModel = getLocalSupplierModel();
    const ProductModel = getLocalProductModel();

    const { startOfDay, endOfDay } = getTodayRange();

    // Today's Sales
    const todaySales = await OrderModel.aggregate([
        { $match: { createdAt: { $gte: startOfDay, $lt: endOfDay }, status: "completed" } },
        { $group: { _id: null, total: { $sum: "$totalAmount" } } }
    ]);

    // Today's Purchases
    const todayPurchases = await PurchaseModel.aggregate([
        { $match: { createdAt: { $gte: startOfDay, $lt: endOfDay } } },
        { $group: { _id: null, total: { $sum: "$totalAmount" } } }
    ]);

    // Today's Expenses
    const todayExpenses = await ExpensesModel.aggregate([
        { $match: { createdAt: { $gte: startOfDay, $lt: endOfDay } } },
        { $group: { _id: null, total: { $sum: "$amount" } } }
    ]);

    // Today's Profit (Sales - Purchases - Expenses)
    const salesTotal = todaySales[0]?.total || 0;
    const purchasesTotal = todayPurchases[0]?.total || 0;
    const expensesTotal = todayExpenses[0]?.total || 0;
    const todayProfit = salesTotal - purchasesTotal - expensesTotal;

    // Cash Balance (from today's cash payments)
    const cashBalance = await OrderModel.aggregate([
        { $match: { createdAt: { $gte: startOfDay, $lt: endOfDay }, paymentMethod: "cash", status: "completed" } },
        { $group: { _id: null, total: { $sum: "$cashReceived" }, change: { $sum: "$change" } } }
    ]);
    const netCashBalance = (cashBalance[0]?.total || 0) - (cashBalance[0]?.change || 0);

    // Total Receivable (Qarza credit accounts)
    const totalReceivable = await QarzaAccountModel.aggregate([
        { $match: { type: "receivable" } },
        { $group: { _id: null, total: { $sum: "$balance" } } }
    ]);

    // Total Payable (Qarza payable accounts)
    const totalPayable = await QarzaAccountModel.aggregate([
        { $match: { type: "payable" } },
        { $group: { _id: null, total: { $sum: "$balance" } } }
    ]);

    // Inventory Value
    const inventoryValue = await BatchModel.aggregate([
        { $match: { quantity: { $gt: 0 }, isActive: true } },
        { $group: { _id: null, total: { $sum: { $multiply: ["$quantity", "$costPrice"] } } } }
    ]);

    // New Members (today)
    const newMembers = await MemberModel.countDocuments({
        createdAt: { $gte: startOfDay, $lt: endOfDay }
    });

    // New Suppliers (today)
    const newSuppliers = await SupplierModel.countDocuments({
        createdAt: { $gte: startOfDay, $lt: endOfDay }
    });

    // Low Stock Count
    const lowStockCount = await BatchModel.countDocuments({
        quantity: { $gt: 0, $lte: 10 },
        isActive: true
    });

    // Pending Credits (Qarza accounts with balance)
    const pendingCredits = await QarzaAccountModel.countDocuments({ balance: { $gt: 0 } });

    return {
        todaySales: salesTotal,
        todayPurchase: purchasesTotal,
        todayProfit,
        cashBalance: netCashBalance,
        totalReceivable: totalReceivable[0]?.total || 0,
        totalPayable: totalPayable[0]?.total || 0,
        todayExpense: expensesTotal,
        inventoryValue: inventoryValue[0]?.total || 0,
        newMembers,
        newSuppliers,
        lowStockCount,
        pendingCredits
    };
};

// Sales Report
export const getSalesReport = async (filters = {}) => {
    const OrderModel = getLocalOrderModel();
    const { fromDate, toDate, productId, paymentMethod, search, page = 1, limit = 20 } = filters;

    const matchQuery = { status: "completed" };
    
    if (fromDate || toDate) {
        const dateFilter = buildDateFilter(fromDate, toDate);
        matchQuery.createdAt = dateFilter.createdAt;
    }

    if (paymentMethod) {
        matchQuery.paymentMethod = paymentMethod;
    }

    if (search) {
        matchQuery.$or = [
            { orderNumber: { $regex: search, $options: "i" } },
            { customerName: { $regex: search, $options: "i" } }
        ];
    }

    if (productId) {
        matchQuery["items.product"] = productId;
    }

    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
        OrderModel.find(matchQuery)
            .populate("items.product", "name")
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit),
        OrderModel.countDocuments(matchQuery)
    ]);

    // Calculate totals
    const totals = await OrderModel.aggregate([
        { $match: matchQuery },
        {
            $group: {
                _id: null,
                totalSales: { $sum: "$totalAmount" },
                totalDiscount: { $sum: "$discountAmount" },
                totalItems: { $sum: { $size: "$items" } }
            }
        }
    ]);

    return {
        data,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        summary: {
            totalSales: totals[0]?.totalSales || 0,
            totalDiscount: totals[0]?.totalDiscount || 0,
            totalItems: totals[0]?.totalItems || 0,
            totalOrders: total
        }
    };
};

// Purchase Report
export const getPurchaseReport = async (filters = {}) => {
    const PurchaseModel = getLocalPurchaseModel();
    const { fromDate, toDate, supplierId, search, page = 1, limit = 20 } = filters;

    const matchQuery = {};

    if (fromDate || toDate) {
        const dateFilter = buildDateFilter(fromDate, toDate);
        matchQuery.createdAt = dateFilter.createdAt;
    }

    if (supplierId) {
        matchQuery.supplier = supplierId;
    }

    if (search) {
        matchQuery.$or = [
            { invoiceNumber: { $regex: search, $options: "i" } },
            { notes: { $regex: search, $options: "i" } }
        ];
    }

    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
        PurchaseModel.find(matchQuery)
            .populate("supplier", "name phoneNo")
            .populate("items.product", "name")
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit),
        PurchaseModel.countDocuments(matchQuery)
    ]);

    // Calculate totals
    const totals = await PurchaseModel.aggregate([
        { $match: matchQuery },
        {
            $group: {
                _id: null,
                totalPurchases: { $sum: "$totalAmount" },
                totalItems: { $sum: { $size: "$items" } }
            }
        }
    ]);

    return {
        data,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        summary: {
            totalPurchases: totals[0]?.totalPurchases || 0,
            totalItems: totals[0]?.totalItems || 0,
            totalPurchaseOrders: total
        }
    };
};

// Inventory Report
export const getInventoryReport = async (filters = {}) => {
    const BatchModel = getLocalBatchModel();
    const ProductModel = getLocalProductModel();
    const { categoryId, subCategoryId, search, lowStock, nearExpiry, page = 1, limit = 20 } = filters;

    const matchQuery = { isActive: true };

    if (lowStock) {
        matchQuery.quantity = { $gt: 0, $lte: 10 };
    }

    if (nearExpiry) {
        const thirtyDaysFromNow = new Date();
        thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
        matchQuery.expiryDate = { $lte: thirtyDaysFromNow, $gte: new Date() };
    }

    if (search) {
        matchQuery.batchNumber = { $regex: search, $options: "i" };
    }

    const skip = (page - 1) * limit;

    let data = await BatchModel.find(matchQuery)
        .populate("product", "name defaultSalePrice")
        .sort({ expiryDate: 1, createdAt: -1 })
        .skip(skip)
        .limit(limit);

    // Filter by category/subcategory if provided
    if (categoryId || subCategoryId) {
        const productIds = await ProductModel.find({
            ...(categoryId && { category: categoryId }),
            ...(subCategoryId && { subCategory: subCategoryId })
        }).distinct("_id");
        data = data.filter(batch => productIds.includes(batch.product._id.toString()));
    }

    const total = await BatchModel.countDocuments(matchQuery);

    // Calculate totals
    const totals = await BatchModel.aggregate([
        { $match: matchQuery },
        {
            $group: {
                _id: null,
                totalQuantity: { $sum: "$quantity" },
                totalValue: { $sum: { $multiply: ["$quantity", "$costPrice"] } },
                totalBatches: { $sum: 1 }
            }
        }
    ]);

    return {
        data,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        summary: {
            totalQuantity: totals[0]?.totalQuantity || 0,
            totalValue: totals[0]?.totalValue || 0,
            totalBatches: totals[0]?.totalBatches || 0
        }
    };
};

// Financial Report
export const getFinancialReport = async (filters = {}) => {
    const OrderModel = getLocalOrderModel();
    const PurchaseModel = getLocalPurchaseModel();
    const ExpensesModel = getLocalExpensesModel();
    const { fromDate, toDate, page = 1, limit = 20 } = filters;

    const dateFilter = buildDateFilter(fromDate, toDate);

    // Get sales, purchases, and expenses
    const [sales, purchases, expenses] = await Promise.all([
        OrderModel.aggregate([
            { $match: { ...dateFilter, status: "completed" } },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                    totalSales: { $sum: "$totalAmount" },
                    totalDiscount: { $sum: "$discountAmount" },
                    count: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]),
        PurchaseModel.aggregate([
            { $match: dateFilter },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                    totalPurchases: { $sum: "$totalAmount" },
                    count: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]),
        ExpensesModel.aggregate([
            { $match: dateFilter },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                    totalExpenses: { $sum: "$amount" },
                    count: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ])
    ]);

    // Merge data by date
    const mergedData = {};
    sales.forEach(s => {
        mergedData[s._id] = { date: s._id, totalSales: s.totalSales, totalDiscount: s.totalDiscount, salesCount: s.count };
    });
    purchases.forEach(p => {
        if (mergedData[p._id]) {
            mergedData[p._id].totalPurchases = p.totalPurchases;
            mergedData[p._id].purchaseCount = p.count;
        } else {
            mergedData[p._id] = { date: p._id, totalPurchases: p.totalPurchases, purchaseCount: p.count };
        }
    });
    expenses.forEach(e => {
        if (mergedData[e._id]) {
            mergedData[e._id].totalExpenses = e.totalExpenses;
            mergedData[e._id].expenseCount = e.count;
        } else {
            mergedData[e._id] = { date: e._id, totalExpenses: e.totalExpenses, expenseCount: e.count };
        }
    });

    const data = Object.values(mergedData).map(d => ({
        ...d,
        profit: (d.totalSales || 0) - (d.totalPurchases || 0) - (d.totalExpenses || 0)
    })).sort((a, b) => new Date(a.date) - new Date(b.date));

    const skip = (page - 1) * limit;
    const paginatedData = data.slice(skip, skip + limit);

    // Calculate overall totals
    const summary = {
        totalSales: sales.reduce((sum, s) => sum + s.totalSales, 0),
        totalPurchases: purchases.reduce((sum, p) => sum + p.totalPurchases, 0),
        totalExpenses: expenses.reduce((sum, e) => sum + e.totalExpenses, 0),
        totalProfit: data.reduce((sum, d) => sum + d.profit, 0)
    };

    return {
        data: paginatedData,
        total: data.length,
        page,
        limit,
        totalPages: Math.ceil(data.length / limit),
        summary
    };
};

// Credit/Debit Report (Qarza)
export const getCreditDebitReport = async (filters = {}) => {
    const QarzaAccountModel = getLocalQarzaAccountModel();
    const QarzaPaymentModel = getLocalQarzaPaymentModel();
    const { type, search, page = 1, limit = 20 } = filters;

    const matchQuery = {};
    if (type) matchQuery.type = type;
    if (search) matchQuery.name = { $regex: search, $options: "i" };

    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
        QarzaAccountModel.find(matchQuery)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit),
        QarzaAccountModel.countDocuments(matchQuery)
    ]);

    // Get recent payments for each account
    const accountsWithPayments = await Promise.all(
        data.map(async (account) => {
            const payments = await QarzaPaymentModel.find({ account: account._id })
                .sort({ createdAt: -1 })
                .limit(5);
            return { ...account.toObject(), recentPayments: payments };
        })
    );

    // Calculate totals
    const totals = await QarzaAccountModel.aggregate([
        { $match: matchQuery },
        {
            $group: {
                _id: null,
                totalBalance: { $sum: "$balance" },
                totalAccounts: { $sum: 1 }
            }
        }
    ]);

    return {
        data: accountsWithPayments,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        summary: {
            totalBalance: totals[0]?.totalBalance || 0,
            totalAccounts: totals[0]?.totalAccounts || 0
        }
    };
};

// Expense Report
export const getExpenseReport = async (filters = {}) => {
    const ExpensesModel = getLocalExpensesModel();
    const ExpenseCategoryModel = getLocalExpenseCategoryModel();
    const { fromDate, toDate, categoryId, search, page = 1, limit = 20 } = filters;

    const matchQuery = {};

    if (fromDate || toDate) {
        const dateFilter = buildDateFilter(fromDate, toDate);
        matchQuery.createdAt = dateFilter.createdAt;
    }

    if (categoryId) {
        matchQuery.category = categoryId;
    }

    if (search) {
        matchQuery.$or = [
            { description: { $regex: search, $options: "i" } },
            { notes: { $regex: search, $options: "i" } }
        ];
    }

    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
        ExpensesModel.find(matchQuery)
            .populate("category", "name")
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit),
        ExpensesModel.countDocuments(matchQuery)
    ]);

    // Calculate totals by category
    const categoryTotals = await ExpensesModel.aggregate([
        { $match: matchQuery },
        {
            $group: {
                _id: "$category",
                total: { $sum: "$amount" },
                count: { $sum: 1 }
            }
        },
        {
            $lookup: {
                from: "ExpensesCategory",
                localField: "_id",
                foreignField: "_id",
                as: "category"
            }
        }
    ]);

    // Calculate overall total
    const overallTotal = await ExpensesModel.aggregate([
        { $match: matchQuery },
        { $group: { _id: null, total: { $sum: "$amount" } } }
    ]);

    return {
        data,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        summary: {
            totalExpenses: overallTotal[0]?.total || 0,
            categoryBreakdown: categoryTotals
        }
    };
};

// Supplier Report
export const getSupplierReport = async (filters = {}) => {
    const SupplierModel = getLocalSupplierModel();
    const PurchaseModel = getLocalPurchaseModel();
    const { search, page = 1, limit = 20 } = filters;

    const matchQuery = {};
    if (search) {
        matchQuery.$or = [
            { name: { $regex: search, $options: "i" } },
            { phoneNo: { $regex: search, $options: "i" } }
        ];
    }

    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
        SupplierModel.find(matchQuery)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit),
        SupplierModel.countDocuments(matchQuery)
    ]);

    // Get purchase statistics for each supplier
    const suppliersWithStats = await Promise.all(
        data.map(async (supplier) => {
            const stats = await PurchaseModel.aggregate([
                { $match: { supplier: supplier._id } },
                {
                    $group: {
                        _id: null,
                        totalPurchases: { $sum: "$totalAmount" },
                        purchaseCount: { $sum: 1 },
                        lastPurchaseDate: { $max: "$createdAt" }
                    }
                }
            ]);
            return {
                ...supplier.toObject(),
                stats: stats[0] || { totalPurchases: 0, purchaseCount: 0, lastPurchaseDate: null }
            };
        })
    );

    return {
        data: suppliersWithStats,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
    };
};

// Member Report
export const getMemberReport = async (filters = {}) => {
    const MemberModel = getLocalMemberModel();
    const OrderModel = getLocalOrderModel();
    const { search, page = 1, limit = 20 } = filters;

    const matchQuery = {};
    if (search) {
        matchQuery.$or = [
            { name: { $regex: search, $options: "i" } },
            { phoneNo: { $regex: search, $options: "i" } }
        ];
    }

    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
        MemberModel.find(matchQuery)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit),
        MemberModel.countDocuments(matchQuery)
    ]);

    // Get order statistics for each member
    const membersWithStats = await Promise.all(
        data.map(async (member) => {
            const stats = await OrderModel.aggregate([
                { $match: { customerName: member.name, status: "completed" } },
                {
                    $group: {
                        _id: null,
                        totalOrders: { $sum: 1 },
                        totalSpent: { $sum: "$totalAmount" },
                        lastOrderDate: { $max: "$createdAt" }
                    }
                }
            ]);
            return {
                ...member.toObject(),
                stats: stats[0] || { totalOrders: 0, totalSpent: 0, lastOrderDate: null }
            };
        })
    );

    return {
        data: membersWithStats,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
    };
};

// Wastage Report
export const getWastageReport = async (filters = {}) => {
    const WastageModel = getLocalWastageModel();
    const { fromDate, toDate, productId, search, page = 1, limit = 20 } = filters;

    const matchQuery = {};

    if (fromDate || toDate) {
        const dateFilter = buildDateFilter(fromDate, toDate);
        matchQuery.createdAt = dateFilter.createdAt;
    }

    if (productId) {
        matchQuery.product = productId;
    }

    if (search) {
        matchQuery.$or = [
            { reason: { $regex: search, $options: "i" } },
            { notes: { $regex: search, $options: "i" } }
        ];
    }

    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
        WastageModel.find(matchQuery)
            .populate("product", "name")
            .populate("batch", "batchNumber")
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit),
        WastageModel.countDocuments(matchQuery)
    ]);

    // Calculate totals
    const totals = await WastageModel.aggregate([
        { $match: matchQuery },
        {
            $group: {
                _id: null,
                totalQuantity: { $sum: "$quantity" },
                totalLoss: { $sum: { $multiply: ["$quantity", "$costPrice"] } },
                totalRecords: { $sum: 1 }
            }
        }
    ]);

    return {
        data,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        summary: {
            totalQuantity: totals[0]?.totalQuantity || 0,
            totalLoss: totals[0]?.totalLoss || 0,
            totalRecords: totals[0]?.totalRecords || 0
        }
    };
};

// Activity Report
export const getActivityReport = async (filters = {}) => {
    const ActivityLogModel = getLocalActivityLogModel();
    const { fromDate, toDate, userId, action, search, page = 1, limit = 20 } = filters;

    const matchQuery = {};

    if (fromDate || toDate) {
        const dateFilter = buildDateFilter(fromDate, toDate);
        matchQuery.createdAt = dateFilter.createdAt;
    }

    if (userId) {
        matchQuery.user = userId;
    }

    if (action) {
        matchQuery.action = action;
    }

    if (search) {
        matchQuery.$or = [
            { description: { $regex: search, $options: "i" } },
            { details: { $regex: search, $options: "i" } }
        ];
    }

    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
        ActivityLogModel.find(matchQuery)
            .populate("user", "name email")
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit),
        ActivityLogModel.countDocuments(matchQuery)
    ]);

    // Calculate activity by action type
    const actionStats = await ActivityLogModel.aggregate([
        { $match: matchQuery },
        {
            $group: {
                _id: "$action",
                count: { $sum: 1 }
            }
        }
    ]);

    return {
        data,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        summary: {
            actionStats,
            totalActivities: total
        }
    };
};

// Top Selling Products
export const getTopSellingProducts = async (filters = {}) => {
    const OrderModel = getLocalOrderModel();
    const { fromDate, toDate, limit = 10 } = filters;

    const matchQuery = { status: "completed" };
    if (fromDate || toDate) {
        const dateFilter = buildDateFilter(fromDate, toDate);
        matchQuery.createdAt = dateFilter.createdAt;
    }

    const topProducts = await OrderModel.aggregate([
        { $match: matchQuery },
        { $unwind: "$items" },
        {
            $group: {
                _id: "$items.product",
                totalQuantity: { $sum: "$items.quantity" },
                totalRevenue: { $sum: { $multiply: ["$items.quantity", "$items.unitPrice"] } },
                orderCount: { $sum: 1 }
            }
        },
        {
            $lookup: {
                from: "Products",
                localField: "_id",
                foreignField: "_id",
                as: "product"
            }
        },
        { $unwind: "$product" },
        { $sort: { totalRevenue: -1 } },
        { $limit: limit }
    ]);

    return topProducts;
};

// Top Customers
export const getTopCustomers = async (filters = {}) => {
    const OrderModel = getLocalOrderModel();
    const { fromDate, toDate, limit = 10 } = filters;

    const matchQuery = { status: "completed" };
    if (fromDate || toDate) {
        const dateFilter = buildDateFilter(fromDate, toDate);
        matchQuery.createdAt = dateFilter.createdAt;
    }

    const topCustomers = await OrderModel.aggregate([
        { $match: matchQuery },
        {
            $group: {
                _id: "$customerName",
                totalSpent: { $sum: "$totalAmount" },
                orderCount: { $sum: 1 },
                lastOrderDate: { $max: "$createdAt" }
            }
        },
        { $match: { _id: { $ne: "" } } },
        { $sort: { totalSpent: -1 } },
        { $limit: limit }
    ]);

    return topCustomers;
};

// Low Stock Products
export const getLowStockProducts = async (filters = {}) => {
    const BatchModel = getLocalBatchModel();
    const ProductModel = getLocalProductModel();
    const { limit = 10 } = filters;

    const lowStockBatches = await BatchModel.find({
        quantity: { $gt: 0, $lte: 10 },
        isActive: true
    })
        .populate("product", "name defaultSalePrice")
        .sort({ quantity: 1 })
        .limit(limit);

    return lowStockBatches;
};

// Near Expiry Products
export const getNearExpiryProducts = async (filters = {}) => {
    const BatchModel = getLocalBatchModel();
    const { limit = 10 } = filters;

    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    const nearExpiryBatches = await BatchModel.find({
        expiryDate: { $lte: thirtyDaysFromNow, $gte: new Date() },
        quantity: { $gt: 0 },
        isActive: true
    })
        .populate("product", "name defaultSalePrice")
        .sort({ expiryDate: 1 })
        .limit(limit);

    return nearExpiryBatches;
};

// Recent Sales
export const getRecentSales = async (filters = {}) => {
    const OrderModel = getLocalOrderModel();
    const { limit = 10 } = filters;

    const recentSales = await OrderModel.find({ status: "completed" })
        .populate("items.product", "name")
        .sort({ createdAt: -1 })
        .limit(limit);

    return recentSales;
};

// Recent Purchases
export const getRecentPurchases = async (filters = {}) => {
    const PurchaseModel = getLocalPurchaseModel();
    const { limit = 10 } = filters;

    const recentPurchases = await PurchaseModel.find()
        .populate("supplier", "name")
        .populate("items.product", "name")
        .sort({ createdAt: -1 })
        .limit(limit);

    return recentPurchases;
};
