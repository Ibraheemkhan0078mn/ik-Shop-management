import {
    getOrderModel,
    getHoldOrderModel,
    getProductModel,
    getBatchModel,
    getPurchaseModel,
    getSupplierModel,
    getExpenseModel,
    getExpenseCategoryModel,
    getWastageModel,
    getPurchaseReturnModel,
    getQarzaAccountModel,
    getQarzaPaymentModel,
    getActivityLogModel,
    getCategoryModel,
    getProductReturnModel,
    getCustomerModel,
    getStaffModel,
    getStaffSalaryPaymentModel,
    getStaffSaleBillModel,
    getStaffAttendanceModel,
} from "./reports.crud.js";

// Helper function to build date filter
const buildDateFilter = (fromDate, toDate) => {
    const filter = {};
    if (fromDate) {
        const startDate = new Date(fromDate);
        startDate.setHours(0, 0, 0, 0);
        filter.createdAt = { ...filter.createdAt, $gte: startDate };
    }
    if (toDate) {
        const endDate = new Date(toDate);
        endDate.setHours(23, 59, 59, 999);
        filter.createdAt = { ...filter.createdAt, $lte: endDate };
    }
    return filter;
};

// Helper function to get today's date range
const getTodayRange = () => {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0, 0);
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);
    return { startOfDay, endOfDay };
};

const getYesterdayRange = () => {
    const now = new Date();
    const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
    const startOfDay = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 0, 0, 0, 0);
    const endOfDay = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 23, 59, 59, 999);
    return { startOfDay, endOfDay };
};

const getWeekRange = () => {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(endOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);
    return { startOfWeek, endOfWeek };
};

const getMonthRange = () => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    return { startOfMonth, endOfMonth };
};

// Dashboard Summary
export const getDashboardSummary = async (filters = {}) => {
    const OrderModel = getOrderModel();
    const PurchaseModel = getPurchaseModel();
    const ExpensesModel = getExpenseModel();
    const BatchModel = getBatchModel();
    const QarzaAccountModel = getQarzaAccountModel();
    const SupplierModel = getSupplierModel();
    const ProductModel = getProductModel();

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
        newSuppliers,
        lowStockCount,
        pendingCredits
    };
};

// Sales Report
export const getSalesReport = async (filters = {}) => {
    const OrderModel = getOrderModel();
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
        OrderModel.find(matchQuery, null, {
            populate: "items.product",
            sort: { createdAt: -1 },
            skip: skip,
            limit: limit
        }),
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
    const PurchaseModel = getPurchaseModel();
    const { fromDate, toDate, supplierId, paymentStatus, deliveryStatus, isRejected, search, period, page = 1, limit = 20 } = filters;

    const matchQuery = {};

    // Handle period-based date filtering
    if (period) {
        let dateRange;
        switch (period) {
            case "today":
                dateRange = getTodayRange();
                matchQuery.createdAt = { $gte: dateRange.startOfDay, $lte: dateRange.endOfDay };
                break;
            case "week":
                dateRange = getWeekRange();
                matchQuery.createdAt = { $gte: dateRange.startOfWeek, $lte: dateRange.endOfWeek };
                break;
            case "month":
                dateRange = getMonthRange();
                matchQuery.createdAt = { $gte: dateRange.startOfMonth, $lte: dateRange.endOfMonth };
                break;
            case "year":
                const now = new Date();
                const startOfYear = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
                const endOfYear = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
                matchQuery.createdAt = { $gte: startOfYear, $lte: endOfYear };
                break;
        }
    } else if (fromDate || toDate) {
        const dateFilter = buildDateFilter(fromDate, toDate);
        matchQuery.createdAt = dateFilter.createdAt;
    }

    if (supplierId) {
        matchQuery.supplier = supplierId;
    }

    if (paymentStatus && paymentStatus !== "all") {
        matchQuery.paymentStatus = paymentStatus;
    }

    if (deliveryStatus && deliveryStatus !== "all") {
        matchQuery.status = deliveryStatus === "received" ? "delivered" : deliveryStatus;
    }

    if (isRejected === "yes") {
        matchQuery.status = "rejected";
    } else if (isRejected === "no") {
        matchQuery.status = { $ne: "rejected" };
    }

    if (search) {
        matchQuery.$or = [
            { invoiceNumber: { $regex: search, $options: "i" } },
            { notes: { $regex: search, $options: "i" } }
        ];
    }

    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
        PurchaseModel.find(matchQuery, null, {
            populate: ["supplier"],
            sort: { createdAt: -1 },
            skip: skip,
            limit: limit
        }),
        PurchaseModel.countDocuments(matchQuery)
    ]);

    // Calculate totals and KPIs
    const totals = await PurchaseModel.aggregate([
        { $match: matchQuery },
        {
            $group: {
                _id: null,
                totalPurchases: { $sum: "$totalAmount" },
                totalPaid: { $sum: { $cond: [{ $eq: ["$paymentStatus", "full"] }, "$totalAmount", 0] } },
                totalDue: { $sum: { $cond: [{ $ne: ["$paymentStatus", "full"] }, { $subtract: ["$totalAmount", { $ifNull: ["$paidAmount", 0] }] }, 0] } },
                totalDeliveredCount: { $sum: { $cond: [{ $eq: ["$status", "delivered"] }, 1, 0] } },
                totalRejectedCount: { $sum: { $cond: [{ $eq: ["$status", "rejected"] }, 1, 0] } },
                uniqueSuppliers: { $addToSet: "$supplier" }
            }
        }
    ]);

    const summary = totals[0] || {};
    const totalSuppliers = summary.uniqueSuppliers ? summary.uniqueSuppliers.length : 0;

    // Get supplier-wise breakdown
    const supplierBreakdown = await PurchaseModel.aggregate([
        { $match: matchQuery },
        {
            $lookup: {
                from: "suppliers",
                localField: "supplier",
                foreignField: "_id",
                as: "supplier"
            }
        },
        { $unwind: "$supplier" },
        {
            $group: {
                _id: "$supplier.name",
                supplierId: { $first: "$supplier._id" },
                totalAmount: { $sum: "$totalAmount" },
                paidAmount: { $sum: { $cond: [{ $eq: ["$paymentStatus", "full"] }, "$totalAmount", { $ifNull: ["$paidAmount", 0] }] } },
                dueAmount: { $sum: { $cond: [{ $ne: ["$paymentStatus", "full"] }, { $subtract: ["$totalAmount", { $ifNull: ["$paidAmount", 0] }] }, 0] } },
                billsCount: { $sum: 1 }
            }
        },
        { $sort: { totalAmount: -1 } }
    ]);

    return {
        data,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        summary: {
            totalPurchases: summary.totalPurchases || 0,
            totalPaid: summary.totalPaid || 0,
            totalDue: summary.totalDue || 0,
            totalDeliveredCount: summary.totalDeliveredCount || 0,
            totalRejectedCount: summary.totalRejectedCount || 0,
            totalSuppliers: totalSuppliers,
            totalBills: total
        },
        supplierBreakdown
    };
};

// Main Business Report
// Sales KPI Report
export const getSalesKPIReport = async (filters = {}) => {
    const OrderModel = getOrderModel();
    const ProductModel = getProductModel();
    const StaffModel = getStaffModel();
    const ProductReturnModel = getProductReturnModel();
    const { fromDate, toDate, period, compareWithPrevious } = filters;

    // Helper to get previous period dates
    const getPreviousPeriodDates = (currentPeriod) => {
        const now = new Date();
        if (currentPeriod === "today") {
            const yesterday = new Date(now);
            yesterday.setDate(yesterday.getDate() - 1);
            return {
                start: new Date(yesterday.setHours(0, 0, 0, 0)),
                end: new Date(yesterday.setHours(23, 59, 59, 999))
            };
        } else if (currentPeriod === "week") {
            const startOfLastWeek = new Date(now);
            startOfLastWeek.setDate(startOfLastWeek.getDate() - startOfLastWeek.getDay() - 7);
            const endOfLastWeek = new Date(startOfLastWeek);
            endOfLastWeek.setDate(endOfLastWeek.getDate() + 6);
            return { start: startOfLastWeek, end: endOfLastWeek };
        } else if (currentPeriod === "month") {
            const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
            return { start: lastMonth, end: endOfLastMonth };
        } else if (currentPeriod === "quarter") {
            const currentQuarter = Math.floor(now.getMonth() / 3);
            const lastQuarterStart = new Date(now.getFullYear(), (currentQuarter - 1) * 3, 1);
            const lastQuarterEnd = new Date(now.getFullYear(), currentQuarter * 3, 0);
            return { start: lastQuarterStart, end: lastQuarterEnd };
        } else if (currentPeriod === "year") {
            const lastYearStart = new Date(now.getFullYear() - 1, 0, 1);
            const lastYearEnd = new Date(now.getFullYear() - 1, 11, 31);
            return { start: lastYearStart, end: lastYearEnd };
        }
        return null;
    };

    let dateFilter = {};
    let previousDateFilter = {};

    if (period === "today") {
        const { startOfDay, endOfDay } = getTodayRange();
        dateFilter = { createdAt: { $gte: startOfDay, $lte: endOfDay } };
        if (compareWithPrevious) {
            const prev = getPreviousPeriodDates("today");
            previousDateFilter = { createdAt: { $gte: prev.start, $lte: prev.end } };
        }
    } else if (period === "week") {
        const now = new Date();
        const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
        const endOfWeek = new Date(now.setDate(now.getDate() - now.getDay() + 6));
        dateFilter = { createdAt: { $gte: startOfWeek, $lte: endOfWeek } };
        if (compareWithPrevious) {
            const prev = getPreviousPeriodDates("week");
            previousDateFilter = { createdAt: { $gte: prev.start, $lte: prev.end } };
        }
    } else if (period === "month") {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        dateFilter = { createdAt: { $gte: startOfMonth, $lte: endOfMonth } };
        if (compareWithPrevious) {
            const prev = getPreviousPeriodDates("month");
            previousDateFilter = { createdAt: { $gte: prev.start, $lte: prev.end } };
        }
    } else if (period === "quarter") {
        const now = new Date();
        const quarter = Math.floor(now.getMonth() / 3);
        const startOfQuarter = new Date(now.getFullYear(), quarter * 3, 1);
        const endOfQuarter = new Date(now.getFullYear(), quarter * 3 + 3, 0);
        dateFilter = { createdAt: { $gte: startOfQuarter, $lte: endOfQuarter } };
        if (compareWithPrevious) {
            const prev = getPreviousPeriodDates("quarter");
            previousDateFilter = { createdAt: { $gte: prev.start, $lte: prev.end } };
        }
    } else if (period === "year") {
        const now = new Date();
        const startOfYear = new Date(now.getFullYear(), 0, 1);
        const endOfYear = new Date(now.getFullYear(), 11, 31);
        dateFilter = { createdAt: { $gte: startOfYear, $lte: endOfYear } };
        if (compareWithPrevious) {
            const prev = getPreviousPeriodDates("year");
            previousDateFilter = { createdAt: { $gte: prev.start, $lte: prev.end } };
        }
    } else if (fromDate && toDate) {
        const start = new Date(fromDate);
        const end = new Date(toDate);
        const daysDiff = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
        dateFilter = { createdAt: { $gte: start, $lte: end } };
        if (compareWithPrevious && daysDiff > 0) {
            const prevStart = new Date(start);
            prevStart.setDate(prevStart.getDate() - daysDiff);
            const prevEnd = new Date(end);
            prevEnd.setDate(prevEnd.getDate() - daysDiff);
            previousDateFilter = { createdAt: { $gte: prevStart, $lte: prevEnd } };
        }
    }

    const orderFilter = { ...dateFilter, status: "completed" };
    const previousOrderFilter = compareWithPrevious ? { ...previousDateFilter, status: "completed" } : null;

    // Debug: log the filter to check
    console.log('Sales KPI Report - dateFilter:', dateFilter);
    console.log('Sales KPI Report - orderFilter:', orderFilter);

    const [
        totalSales,
        totalOrders,
        totalUnitsSold,
        totalDiscount,
        salesByPaymentMethod,
        salesByOrderType,
        salesByStaff,
        topProducts,
        salesByCategory,
        salesByCustomer,
        salesByDate,
        productReturns,
        staffList,
        previousTotalSales,
        previousSalesByDate
    ] = await Promise.all([
        // Total revenue
        OrderModel.aggregate([
            { $match: orderFilter },
            { $group: { _id: null, total: { $sum: "$totalAmount" } } }
        ]),
        // Total transactions
        OrderModel.countDocuments(orderFilter),
        // Total units sold
        OrderModel.aggregate([
            { $match: orderFilter },
            { $unwind: "$items" },
            { $group: { _id: null, totalUnits: { $sum: "$items.quantity" } } }
        ]),
        // Total discounts
        OrderModel.aggregate([
            { $match: orderFilter },
            { $group: { _id: null, totalDiscount: { $sum: "$discountAmount" } } }
        ]),
        // Sales by payment method
        OrderModel.aggregate([
            { $match: orderFilter },
            { $group: { _id: "$paymentMethod", total: { $sum: "$totalAmount" }, count: { $sum: 1 } } },
            { $sort: { total: -1 } }
        ]),
        // Sales by order type (retail vs wholesale)
        OrderModel.aggregate([
            { $match: orderFilter },
            { $group: { _id: "$orderType", total: { $sum: "$totalAmount" }, count: { $sum: 1 } } }
        ]),
        // Sales by staff
        OrderModel.aggregate([
            { $match: orderFilter },
            { $lookup: { from: "staff", localField: "staffId", foreignField: "_id", as: "staff" } },
            { $unwind: { path: "$staff", preserveNullAndEmptyArrays: true } },
            { $group: { _id: { id: "$staff._id", name: "$staff.name" }, total: { $sum: "$totalAmount" }, count: { $sum: 1 } } },
            { $sort: { total: -1 } }
        ]),
        // Top selling products
        OrderModel.aggregate([
            { $match: orderFilter },
            { $unwind: "$items" },
            { $lookup: { from: "products", localField: "items.product", foreignField: "_id", as: "product" } },
            { $unwind: "$product" },
            { $group: { 
                _id: { productId: "$items.product", name: "$items.name", category: "$product.category", costPrice: "$product.costPrice" }, 
                totalRevenue: { $sum: "$items.lineTotal" }, 
                totalUnits: { $sum: "$items.quantity" },
                count: { $sum: 1 },
                totalCost: { $sum: { $multiply: ["$items.quantity", "$product.costPrice"] } }
            } },
            { $sort: { totalRevenue: -1 } },
            { $limit: 20 }
        ]),
        // Sales by category (from products)
        OrderModel.aggregate([
            { $match: orderFilter },
            { $unwind: "$items" },
            { $lookup: { from: "products", localField: "items.product", foreignField: "_id", as: "product" } },
            { $unwind: "$product" },
            { $group: { 
                _id: "$product.category", 
                total: { $sum: "$items.lineTotal" }, 
                count: { $sum: 1 },
                units: { $sum: "$items.quantity" }
            } },
            { $sort: { total: -1 } }
        ]),
        // Sales by customer
        OrderModel.aggregate([
            { $match: orderFilter },
            { $group: { 
                _id: "$customerName", 
                total: { $sum: "$totalAmount" }, 
                count: { $sum: 1 },
                orderType: { $first: "$orderType" },
                lastPurchase: { $max: "$createdAt" }
            } },
            { $sort: { total: -1 } },
            { $limit: 20 }
        ]),
        // Sales by date (for trend chart)
        OrderModel.aggregate([
            { $match: orderFilter },
            { $group: { 
                _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, 
                total: { $sum: "$totalAmount" },
                count: { $sum: 1 }
            } },
            { $sort: { _id: 1 } }
        ]),
        // Product returns for the period
        ProductReturnModel.aggregate([
            { $match: dateFilter },
            { $group: { _id: null, totalReturns: { $sum: "$refundAmount" }, count: { $sum: 1 } } }
        ]),
        // Get all staff for reference
        StaffModel.find({}).select('name _id').lean(),
        // Previous period total for comparison
        previousOrderFilter ? OrderModel.aggregate([
            { $match: previousOrderFilter },
            { $group: { _id: null, total: { $sum: "$totalAmount" } } }
        ]) : Promise.resolve([{ total: 0 }]),
        // Previous period sales by date
        previousOrderFilter ? OrderModel.aggregate([
            { $match: previousOrderFilter },
            { $group: { 
                _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, 
                total: { $sum: "$totalAmount" },
                count: { $sum: 1 }
            } },
            { $sort: { _id: 1 } }
        ]) : Promise.resolve([])
    ]);

    const totalRevenue = totalSales[0]?.total || 0;
    const totalUnits = totalUnitsSold[0]?.totalUnits || 0;
    const totalDiscountAmount = totalDiscount[0]?.totalDiscount || 0;
    const totalReturnsAmount = productReturns[0]?.totalReturns || 0;
    const returnCount = productReturns[0]?.count || 0;
    const previousRevenue = previousTotalSales[0]?.total || 0;

    // Calculate derived metrics
    const netSales = totalRevenue - totalDiscountAmount;
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    const returnRate = totalOrders > 0 ? (returnCount / totalOrders) * 100 : 0;

    // Calculate trend percentage
    const revenueTrend = previousRevenue > 0 ? ((totalRevenue - previousRevenue) / previousRevenue) * 100 : 0;

    // Calculate gross profit (assuming cost price from products)
    const productCosts = await OrderModel.aggregate([
        { $match: orderFilter },
        { $unwind: "$items" },
        { $lookup: { from: "products", localField: "items.product", foreignField: "_id", as: "product" } },
        { $unwind: "$product" },
        { $group: { 
            _id: null, 
            totalCost: { $sum: { $multiply: ["$items.quantity", "$product.costPrice"] } } 
        } }
    ]);
    const totalCost = productCosts[0]?.totalCost || 0;
    const grossProfit = totalRevenue - totalCost;
    const grossProfitMargin = totalRevenue > 0 ? ((grossProfit / totalRevenue) * 100).toFixed(2) : 0;

    // Calculate daily average
    let daysCount = 1;
    if (fromDate && toDate) {
        const start = new Date(fromDate);
        const end = new Date(toDate);
        daysCount = Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24)));
    } else if (period === "today") {
        daysCount = 1;
    } else if (period === "week") {
        daysCount = 7;
    } else if (period === "month") {
        daysCount = 30;
    } else if (period === "quarter") {
        daysCount = 90;
    } else if (period === "year") {
        daysCount = 365;
    }
    const dailyAverage = totalRevenue / daysCount;

    // Calculate cash collected (for reconciliation)
    const cashCollected = salesByPaymentMethod.find(m => m._id === 'cash')?.total || 0;

    return {
        summary: {
            totalRevenue,
            netSales,
            grossProfit,
            grossProfitMargin: parseFloat(grossProfitMargin),
            totalOrders,
            totalUnitsSold: totalUnits,
            totalDiscount: totalDiscountAmount,
            totalReturns: totalReturnsAmount,
            returnRate: parseFloat(returnRate.toFixed(2)),
            averageOrderValue,
            dailyAverage,
            revenueTrend: parseFloat(revenueTrend.toFixed(2)),
            previousRevenue,
            cashCollected
        },
        breakdowns: {
            byPaymentMethod: salesByPaymentMethod.map(item => ({
                method: item._id || 'unknown',
                total: item.total,
                count: item.count,
                percentage: totalRevenue > 0 ? ((item.total / totalRevenue) * 100).toFixed(1) : 0
            })),
            byOrderType: salesByOrderType.map(item => ({
                type: item._id || 'unknown',
                total: item.total,
                count: item.count,
                percentage: totalRevenue > 0 ? ((item.total / totalRevenue) * 100).toFixed(1) : 0
            })),
            byStaff: salesByStaff.map(item => ({
                staffId: item._id?.id,
                staffName: item._id?.name || 'Unknown',
                total: item.total,
                count: item.count,
                averageOrderValue: item.count > 0 ? item.total / item.count : 0,
                percentage: totalRevenue > 0 ? ((item.total / totalRevenue) * 100).toFixed(1) : 0
            })),
            byCategory: salesByCategory.map(item => ({
                category: item._id || 'uncategorized',
                total: item.total,
                count: item.count,
                units: item.units,
                percentage: totalRevenue > 0 ? ((item.total / totalRevenue) * 100).toFixed(1) : 0
            })),
            topProducts: topProducts.map(item => ({
                productId: item._id?.productId,
                productName: item._id?.name,
                category: item._id?.category,
                totalRevenue: item.totalRevenue,
                totalUnits: item.totalUnits,
                count: item.count,
                totalCost: item.totalCost,
                profit: item.totalRevenue - (item.totalCost || 0),
                profitMargin: item.totalRevenue > 0 ? (((item.totalRevenue - (item.totalCost || 0)) / item.totalRevenue) * 100).toFixed(2) : 0,
                percentage: totalRevenue > 0 ? ((item.totalRevenue / totalRevenue) * 100).toFixed(1) : 0
            })),
            topCustomers: salesByCustomer.map(item => ({
                customerName: item._id || 'Walk-in',
                total: item.total,
                count: item.count,
                orderType: item.orderType,
                averageOrderValue: item.count > 0 ? item.total / item.count : 0,
                lastPurchase: item.lastPurchase,
                percentage: totalRevenue > 0 ? ((item.total / totalRevenue) * 100).toFixed(1) : 0
            })),
            salesByDate: salesByDate.map(item => ({
                date: item._id,
                total: item.total,
                count: item.count
            })),
            previousSalesByDate: previousSalesByDate.map(item => ({
                date: item._id,
                total: item.total,
                count: item.count
            }))
        }
    };
};

// Purchase KPI Report
export const getPurchaseKPIReport = async (filters = {}) => {
    const PurchaseModel = getPurchaseModel();
    const SupplierModel = getSupplierModel();
    const ProductModel = getProductModel();
    const PurchaseReturnModel = getPurchaseReturnModel();
    const { fromDate, toDate, period, compareWithPrevious } = filters;

    // Helper to get previous period dates (same as sales report)
    const getPreviousPeriodDates = (currentPeriod) => {
        const now = new Date();
        if (currentPeriod === "today") {
            const yesterday = new Date(now);
            yesterday.setDate(yesterday.getDate() - 1);
            return {
                start: new Date(yesterday.setHours(0, 0, 0, 0)),
                end: new Date(yesterday.setHours(23, 59, 59, 999))
            };
        } else if (currentPeriod === "week") {
            const startOfLastWeek = new Date(now);
            startOfLastWeek.setDate(startOfLastWeek.getDate() - startOfLastWeek.getDay() - 7);
            const endOfLastWeek = new Date(startOfLastWeek);
            endOfLastWeek.setDate(endOfLastWeek.getDate() + 6);
            return { start: startOfLastWeek, end: endOfLastWeek };
        } else if (currentPeriod === "month") {
            const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
            return { start: lastMonth, end: endOfLastMonth };
        } else if (currentPeriod === "quarter") {
            const currentQuarter = Math.floor(now.getMonth() / 3);
            const lastQuarterStart = new Date(now.getFullYear(), (currentQuarter - 1) * 3, 1);
            const lastQuarterEnd = new Date(now.getFullYear(), currentQuarter * 3, 0);
            return { start: lastQuarterStart, end: lastQuarterEnd };
        } else if (currentPeriod === "year") {
            const lastYearStart = new Date(now.getFullYear() - 1, 0, 1);
            const lastYearEnd = new Date(now.getFullYear() - 1, 11, 31);
            return { start: lastYearStart, end: lastYearEnd };
        }
        return null;
    };

    let dateFilter = {};
    let previousDateFilter = {};

    if (period === "today") {
        const { startOfDay, endOfDay } = getTodayRange();
        dateFilter = { date: { $gte: startOfDay, $lte: endOfDay } };
        if (compareWithPrevious) {
            const prev = getPreviousPeriodDates("today");
            previousDateFilter = { date: { $gte: prev.start, $lte: prev.end } };
        }
    } else if (period === "week") {
        const now = new Date();
        const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
        const endOfWeek = new Date(now.setDate(now.getDate() - now.getDay() + 6));
        dateFilter = { date: { $gte: startOfWeek, $lte: endOfWeek } };
        if (compareWithPrevious) {
            const prev = getPreviousPeriodDates("week");
            previousDateFilter = { date: { $gte: prev.start, $lte: prev.end } };
        }
    } else if (period === "month") {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        dateFilter = { date: { $gte: startOfMonth, $lte: endOfMonth } };
        if (compareWithPrevious) {
            const prev = getPreviousPeriodDates("month");
            previousDateFilter = { date: { $gte: prev.start, $lte: prev.end } };
        }
    } else if (period === "quarter") {
        const now = new Date();
        const currentQuarter = Math.floor(now.getMonth() / 3);
        const startOfQuarter = new Date(now.getFullYear(), currentQuarter * 3, 1);
        const endOfQuarter = new Date(now.getFullYear(), currentQuarter * 3 + 2, 31);
        dateFilter = { date: { $gte: startOfQuarter, $lte: endOfQuarter } };
        if (compareWithPrevious) {
            const prev = getPreviousPeriodDates("quarter");
            previousDateFilter = { date: { $gte: prev.start, $lte: prev.end } };
        }
    } else if (period === "year") {
        const now = new Date();
        const startOfYear = new Date(now.getFullYear(), 0, 1);
        const endOfYear = new Date(now.getFullYear(), 11, 31);
        dateFilter = { date: { $gte: startOfYear, $lte: endOfYear } };
        if (compareWithPrevious) {
            const prev = getPreviousPeriodDates("year");
            previousDateFilter = { date: { $gte: prev.start, $lte: prev.end } };
        }
    } else if (fromDate && toDate) {
        const start = new Date(fromDate);
        const end = new Date(toDate);
        dateFilter = { date: { $gte: start, $lte: end } };
        if (compareWithPrevious) {
            const daysDiff = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
            const prevStart = new Date(start);
            prevStart.setDate(prevStart.getDate() - daysDiff);
            const prevEnd = new Date(end);
            prevEnd.setDate(prevEnd.getDate() - daysDiff);
            previousDateFilter = { date: { $gte: prevStart, $lte: prevEnd } };
        }
    }

    console.log('Purchase KPI Report - dateFilter:', dateFilter);

    const purchaseFilter = { ...dateFilter };
    const previousPurchaseFilter = compareWithPrevious ? { ...previousDateFilter } : null;

    const [
        totalPurchases,
        totalPurchaseOrders,
        totalItemsReceived,
        totalUnpaid,
        totalPurchaseReturns,
        purchasesBySupplier,
        purchasesByDate,
        previousTotalPurchases,
        previousPurchasesByDate,
        purchaseReturnsBySupplier,
        supplierList
    ] = await Promise.all([
        // Total amount purchased
        PurchaseModel.aggregate([
            { $match: purchaseFilter },
            { $group: { _id: null, total: { $sum: "$totalAmount" } } }
        ]),
        // Total purchase orders
        PurchaseModel.countDocuments(purchaseFilter),
        // Total items received
        PurchaseModel.aggregate([
            { $match: { ...purchaseFilter, status: "delivered" } },
            { $unwind: "$items" },
            { $group: { _id: null, totalItems: { $sum: "$items.quantity" } } }
        ]),
        // Total unpaid amount
        PurchaseModel.aggregate([
            { $match: purchaseFilter },
            { $group: { _id: null, unpaid: { $sum: { $subtract: ["$totalAmount", "$paidAmount"] } } } }
        ]),
        // Total purchase returns
        PurchaseReturnModel.aggregate([
            { $match: purchaseFilter },
            { $group: { _id: null, totalReturns: { $sum: "$totalAmount" } } }
        ]),
        // Purchases by supplier
        PurchaseModel.aggregate([
            { $match: purchaseFilter },
            { $lookup: { from: "suppliers", localField: "supplier", foreignField: "_id", as: "supplierInfo" } },
            { $unwind: "$supplierInfo" },
            { $group: { 
                _id: "$supplier", 
                supplierName: { $first: "$supplierInfo.name" },
                total: { $sum: "$totalAmount" }, 
                count: { $sum: 1 },
                totalItems: { $sum: { $reduce: { input: "$items", initialValue: 0, in: { $add: ["$$value", "$$this.quantity"] } } } },
                unpaid: { $sum: { $subtract: ["$totalAmount", "$paidAmount"] } }
            } },
            { $sort: { total: -1 } }
        ]),
        // Purchases by date
        PurchaseModel.aggregate([
            { $match: purchaseFilter },
            { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } }, total: { $sum: "$totalAmount" }, count: { $sum: 1 } } },
            { $sort: { _id: 1 } }
        ]),
        // Previous period total
        previousPurchaseFilter ? PurchaseModel.aggregate([
            { $match: previousPurchaseFilter },
            { $group: { _id: null, total: { $sum: "$totalAmount" } } }
        ]) : Promise.resolve([{ total: 0 }]),
        // Previous period by date
        previousPurchaseFilter ? PurchaseModel.aggregate([
            { $match: previousPurchaseFilter },
            { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } }, total: { $sum: "$totalAmount" }, count: { $sum: 1 } } },
            { $sort: { _id: 1 } }
        ]) : Promise.resolve([]),
        // Purchase returns by supplier
        PurchaseReturnModel.aggregate([
            { $match: purchaseFilter },
            { $lookup: { from: "suppliers", localField: "supplier", foreignField: "_id", as: "supplierInfo" } },
            { $unwind: "$supplierInfo" },
            { $group: { 
                _id: "$supplier", 
                supplierName: { $first: "$supplierInfo.name" },
                total: { $sum: "$totalAmount" }, 
                count: { $sum: 1 }
            } },
            { $sort: { total: -1 } }
        ]),
        // Supplier list for performance
        SupplierModel.find({ isActive: true }).select("name type email phone address")
    ]);

    const totalAmount = totalPurchases[0]?.total || 0;
    const previousTotalAmount = previousTotalPurchases[0]?.total || 0;
    const purchaseTrend = previousTotalAmount > 0 ? ((totalAmount - previousTotalAmount) / previousTotalAmount * 100).toFixed(1) : 0;
    const averageOrderValue = totalPurchaseOrders > 0 ? totalAmount / totalPurchaseOrders : 0;

    return {
        summary: {
            totalAmountPurchased: totalAmount,
            totalPurchaseOrders,
            totalItemsReceived: totalItemsReceived[0]?.totalItems || 0,
            totalUnpaid: totalUnpaid[0]?.unpaid || 0,
            averageOrderValue,
            totalPurchaseReturns: totalPurchaseReturns[0]?.totalReturns || 0,
            purchaseTrend
        },
        breakdowns: {
            bySupplier: purchasesBySupplier.map(item => ({
                supplierId: item._id,
                supplierName: item.supplierName,
                totalAmount: item.total,
                orderCount: item.count,
                totalItems: item.totalItems,
                averageOrderValue: item.count > 0 ? item.total / item.count : 0,
                outstandingPayable: item.unpaid,
                percentage: totalAmount > 0 ? ((item.total / totalAmount) * 100).toFixed(1) : 0
            })),
            byDate: purchasesByDate.map(item => ({
                date: item._id,
                total: item.total,
                count: item.count
            })),
            previousByDate: previousPurchasesByDate.map(item => ({
                date: item._id,
                total: item.total,
                count: item.count
            })),
            purchaseReturnsBySupplier: purchaseReturnsBySupplier.map(item => ({
                supplierId: item._id,
                supplierName: item.supplierName,
                total: item.total,
                count: item.count,
                percentage: totalPurchaseReturns[0]?.totalReturns > 0 ? ((item.total / totalPurchaseReturns[0].totalReturns) * 100).toFixed(1) : 0
            })),
            supplierList: supplierList.map(s => ({
                id: s._id,
                name: s.name,
                type: s.type,
                email: s.email,
                phone: s.phone,
                address: s.address
            }))
        }
    };
};

// Supplier KPI Report
export const getSupplierKPIReport = async (filters = {}) => {
    const PurchaseModel = getPurchaseModel();
    const SupplierModel = getSupplierModel();
    const PurchaseReturnModel = getPurchaseReturnModel();
    const { fromDate, toDate, period, compareWithPrevious } = filters;

    // Helper to get previous period dates (same as sales/purchase reports)
    const getPreviousPeriodDates = (currentPeriod) => {
        const now = new Date();
        if (currentPeriod === "today") {
            const yesterday = new Date(now);
            yesterday.setDate(yesterday.getDate() - 1);
            return {
                start: new Date(yesterday.setHours(0, 0, 0, 0)),
                end: new Date(yesterday.setHours(23, 59, 59, 999))
            };
        } else if (currentPeriod === "week") {
            const startOfLastWeek = new Date(now);
            startOfLastWeek.setDate(startOfLastWeek.getDate() - startOfLastWeek.getDay() - 7);
            const endOfLastWeek = new Date(startOfLastWeek);
            endOfLastWeek.setDate(endOfLastWeek.getDate() + 6);
            return { start: startOfLastWeek, end: endOfLastWeek };
        } else if (currentPeriod === "month") {
            const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
            return { start: lastMonth, end: endOfLastMonth };
        } else if (currentPeriod === "quarter") {
            const currentQuarter = Math.floor(now.getMonth() / 3);
            const lastQuarterStart = new Date(now.getFullYear(), (currentQuarter - 1) * 3, 1);
            const lastQuarterEnd = new Date(now.getFullYear(), currentQuarter * 3, 0);
            return { start: lastQuarterStart, end: lastQuarterEnd };
        } else if (currentPeriod === "year") {
            const lastYearStart = new Date(now.getFullYear() - 1, 0, 1);
            const lastYearEnd = new Date(now.getFullYear() - 1, 11, 31);
            return { start: lastYearStart, end: lastYearEnd };
        }
        return null;
    };

    let dateFilter = {};
    let previousDateFilter = {};

    if (period === "today") {
        const { startOfDay, endOfDay } = getTodayRange();
        dateFilter = { date: { $gte: startOfDay, $lte: endOfDay } };
        if (compareWithPrevious) {
            const prev = getPreviousPeriodDates("today");
            previousDateFilter = { date: { $gte: prev.start, $lte: prev.end } };
        }
    } else if (period === "week") {
        const now = new Date();
        const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
        const endOfWeek = new Date(now.setDate(now.getDate() - now.getDay() + 6));
        dateFilter = { date: { $gte: startOfWeek, $lte: endOfWeek } };
        if (compareWithPrevious) {
            const prev = getPreviousPeriodDates("week");
            previousDateFilter = { date: { $gte: prev.start, $lte: prev.end } };
        }
    } else if (period === "month") {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        dateFilter = { date: { $gte: startOfMonth, $lte: endOfMonth } };
        if (compareWithPrevious) {
            const prev = getPreviousPeriodDates("month");
            previousDateFilter = { date: { $gte: prev.start, $lte: prev.end } };
        }
    } else if (period === "quarter") {
        const now = new Date();
        const currentQuarter = Math.floor(now.getMonth() / 3);
        const startOfQuarter = new Date(now.getFullYear(), currentQuarter * 3, 1);
        const endOfQuarter = new Date(now.getFullYear(), currentQuarter * 3 + 2, 31);
        dateFilter = { date: { $gte: startOfQuarter, $lte: endOfQuarter } };
        if (compareWithPrevious) {
            const prev = getPreviousPeriodDates("quarter");
            previousDateFilter = { date: { $gte: prev.start, $lte: prev.end } };
        }
    } else if (period === "year") {
        const now = new Date();
        const startOfYear = new Date(now.getFullYear(), 0, 1);
        const endOfYear = new Date(now.getFullYear(), 11, 31);
        dateFilter = { date: { $gte: startOfYear, $lte: endOfYear } };
        if (compareWithPrevious) {
            const prev = getPreviousPeriodDates("year");
            previousDateFilter = { date: { $gte: prev.start, $lte: prev.end } };
        }
    } else if (fromDate && toDate) {
        const start = new Date(fromDate);
        const end = new Date(toDate);
        dateFilter = { date: { $gte: start, $lte: end } };
        if (compareWithPrevious) {
            const daysDiff = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
            const prevStart = new Date(start);
            prevStart.setDate(prevStart.getDate() - daysDiff);
            const prevEnd = new Date(end);
            prevEnd.setDate(prevEnd.getDate() - daysDiff);
            previousDateFilter = { date: { $gte: prevStart, $lte: prevEnd } };
        }
    }

    console.log('Supplier KPI Report - dateFilter:', dateFilter);

    const purchaseFilter = { ...dateFilter };
    const previousPurchaseFilter = compareWithPrevious ? { ...previousDateFilter } : null;

    const [
        totalSuppliers,
        activeSuppliers,
        totalPurchases,
        totalPurchaseAmount,
        totalUnpaid,
        totalReturns,
        supplierPerformance,
        supplierPurchaseHistory,
        supplierReturns,
        supplierPaymentStatus,
        previousTotalPurchaseAmount
    ] = await Promise.all([
        // Total suppliers
        SupplierModel.countDocuments({}),
        // Active suppliers
        SupplierModel.countDocuments({ isActive: true }),
        // Total purchases
        PurchaseModel.countDocuments(purchaseFilter),
        // Total purchase amount
        PurchaseModel.aggregate([
            { $match: purchaseFilter },
            { $group: { _id: null, total: { $sum: "$totalAmount" } } }
        ]),
        // Total unpaid
        PurchaseModel.aggregate([
            { $match: purchaseFilter },
            { $group: { _id: null, unpaid: { $sum: { $subtract: ["$totalAmount", "$paidAmount"] } } } }
        ]),
        // Total returns
        PurchaseReturnModel.aggregate([
            { $match: purchaseFilter },
            { $group: { _id: null, totalReturns: { $sum: "$totalAmount" } } }
        ]),
        // Supplier performance (orders, delivery, quality)
        SupplierModel.aggregate([
            { $match: { isActive: true } },
            { $lookup: { from: "productpurchases", localField: "_id", foreignField: "supplier", as: "purchases" } },
            { $addFields: {
                totalOrders: { $size: "$purchases" },
                totalSpent: { $sum: "$purchases.totalAmount" }
            }},
            { $sort: { totalSpent: -1 } }
        ]),
        // Supplier purchase history (detailed)
        PurchaseModel.aggregate([
            { $match: purchaseFilter },
            { $lookup: { from: "suppliers", localField: "supplier", foreignField: "_id", as: "supplierInfo" } },
            { $unwind: "$supplierInfo" },
            { $project: {
                _id: 1,
                invoiceNumber: 1,
                date: 1,
                supplierName: "$supplierInfo.name",
                supplierId: "$supplier",
                totalAmount: 1,
                status: 1,
                paymentStatus: 1,
                paidAmount: 1,
                itemCount: { $size: "$items" }
            }},
            { $sort: { date: -1 } }
        ]),
        // Supplier returns
        PurchaseReturnModel.aggregate([
            { $match: purchaseFilter },
            { $lookup: { from: "suppliers", localField: "supplier", foreignField: "_id", as: "supplierInfo" } },
            { $unwind: "$supplierInfo" },
            { $group: {
                _id: "$supplier",
                supplierName: { $first: "$supplierInfo.name" },
                totalReturns: { $sum: "$totalAmount" },
                returnCount: { $sum: 1 }
            }},
            { $sort: { totalReturns: -1 } }
        ]),
        // Supplier payment status (aging)
        PurchaseModel.aggregate([
            { $match: purchaseFilter },
            { $lookup: { from: "suppliers", localField: "supplier", foreignField: "_id", as: "supplierInfo" } },
            { $unwind: "$supplierInfo" },
            { $group: {
                _id: "$supplier",
                supplierName: { $first: "$supplierInfo.name" },
                totalInvoiced: { $sum: "$totalAmount" },
                totalPaid: { $sum: "$paidAmount" },
                outstandingBalance: { $sum: { $subtract: ["$totalAmount", "$paidAmount"] } },
                orderCount: { $sum: 1 }
            }},
            { $sort: { outstandingBalance: -1 } }
        ]),
        // Previous period total
        previousPurchaseFilter ? PurchaseModel.aggregate([
            { $match: previousPurchaseFilter },
            { $group: { _id: null, total: { $sum: "$totalAmount" } } }
        ]) : Promise.resolve([{ total: 0 }])
    ]);

    const totalAmount = totalPurchaseAmount[0]?.total || 0;
    const previousTotalAmount = previousTotalPurchaseAmount[0]?.total || 0;
    const purchaseTrend = previousTotalAmount > 0 ? ((totalAmount - previousTotalAmount) / previousTotalAmount * 100).toFixed(1) : 0;
    const averageOrderValue = totalPurchases > 0 ? totalAmount / totalPurchases : 0;

    return {
        summary: {
            totalSuppliers,
            activeSuppliers,
            totalPurchaseOrders: totalPurchases,
            totalPurchaseAmount: totalAmount,
            totalUnpaid: totalUnpaid[0]?.unpaid || 0,
            totalReturns: totalReturns[0]?.totalReturns || 0,
            averageOrderValue,
            purchaseTrend
        },
        breakdowns: {
            supplierPerformance: supplierPerformance.map(s => ({
                supplierId: s._id,
                supplierName: s.name,
                supplierType: s.type,
                totalOrders: s.totalOrders,
                totalSpent: s.totalSpent,
                averageOrderValue: s.totalOrders > 0 ? s.totalSpent / s.totalOrders : 0,
                performanceRating: s.totalOrders > 10 ? 'High' : s.totalOrders > 5 ? 'Medium' : 'Low'
            })),
            purchaseHistory: supplierPurchaseHistory,
            returnsBySupplier: supplierReturns.map(r => ({
                supplierId: r._id,
                supplierName: r.supplierName,
                totalReturns: r.totalReturns,
                returnCount: r.returnCount
            })),
            paymentStatus: supplierPaymentStatus.map(p => ({
                supplierId: p._id,
                supplierName: p.supplierName,
                totalInvoiced: p.totalInvoiced,
                totalPaid: p.totalPaid,
                outstandingBalance: p.outstandingBalance,
                orderCount: p.orderCount,
                paymentStatus: p.outstandingBalance === 0 ? 'Paid' : p.outstandingBalance > 0 ? 'Partial' : 'Unpaid'
            }))
        }
    };
};

// Customer KPI Report
export const getCustomerKPIReport = async (filters = {}) => {
    const OrderModel = getOrderModel();
    const CustomerModel = getCustomerModel();
    const ProductReturnModel = getProductReturnModel();
    const { fromDate, toDate, period, compareWithPrevious } = filters;

    // Helper to get previous period dates (same as other reports)
    const getPreviousPeriodDates = (currentPeriod) => {
        const now = new Date();
        if (currentPeriod === "today") {
            const yesterday = new Date(now);
            yesterday.setDate(yesterday.getDate() - 1);
            return {
                start: new Date(yesterday.setHours(0, 0, 0, 0)),
                end: new Date(yesterday.setHours(23, 59, 59, 999))
            };
        } else if (currentPeriod === "week") {
            const startOfLastWeek = new Date(now);
            startOfLastWeek.setDate(startOfLastWeek.getDate() - startOfLastWeek.getDay() - 7);
            const endOfLastWeek = new Date(startOfLastWeek);
            endOfLastWeek.setDate(endOfLastWeek.getDate() + 6);
            return { start: startOfLastWeek, end: endOfLastWeek };
        } else if (currentPeriod === "month") {
            const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
            return { start: lastMonth, end: endOfLastMonth };
        } else if (currentPeriod === "quarter") {
            const currentQuarter = Math.floor(now.getMonth() / 3);
            const lastQuarterStart = new Date(now.getFullYear(), (currentQuarter - 1) * 3, 1);
            const lastQuarterEnd = new Date(now.getFullYear(), currentQuarter * 3, 0);
            return { start: lastQuarterStart, end: lastQuarterEnd };
        } else if (currentPeriod === "year") {
            const lastYearStart = new Date(now.getFullYear() - 1, 0, 1);
            const lastYearEnd = new Date(now.getFullYear() - 1, 11, 31);
            return { start: lastYearStart, end: lastYearEnd };
        }
        return null;
    };

    let dateFilter = {};
    let previousDateFilter = {};

    if (period === "today") {
        const { startOfDay, endOfDay } = getTodayRange();
        dateFilter = { createdAt: { $gte: startOfDay, $lte: endOfDay } };
        if (compareWithPrevious) {
            const prev = getPreviousPeriodDates("today");
            previousDateFilter = { createdAt: { $gte: prev.start, $lte: prev.end } };
        }
    } else if (period === "week") {
        const now = new Date();
        const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
        const endOfWeek = new Date(now.setDate(now.getDate() - now.getDay() + 6));
        dateFilter = { createdAt: { $gte: startOfWeek, $lte: endOfWeek } };
        if (compareWithPrevious) {
            const prev = getPreviousPeriodDates("week");
            previousDateFilter = { createdAt: { $gte: prev.start, $lte: prev.end } };
        }
    } else if (period === "month") {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        dateFilter = { createdAt: { $gte: startOfMonth, $lte: endOfMonth } };
        if (compareWithPrevious) {
            const prev = getPreviousPeriodDates("month");
            previousDateFilter = { createdAt: { $gte: prev.start, $lte: prev.end } };
        }
    } else if (period === "quarter") {
        const now = new Date();
        const currentQuarter = Math.floor(now.getMonth() / 3);
        const startOfQuarter = new Date(now.getFullYear(), currentQuarter * 3, 1);
        const endOfQuarter = new Date(now.getFullYear(), currentQuarter * 3 + 2, 31);
        dateFilter = { createdAt: { $gte: startOfQuarter, $lte: endOfQuarter } };
        if (compareWithPrevious) {
            const prev = getPreviousPeriodDates("quarter");
            previousDateFilter = { createdAt: { $gte: prev.start, $lte: prev.end } };
        }
    } else if (period === "year") {
        const now = new Date();
        const startOfYear = new Date(now.getFullYear(), 0, 1);
        const endOfYear = new Date(now.getFullYear(), 11, 31);
        dateFilter = { createdAt: { $gte: startOfYear, $lte: endOfYear } };
        if (compareWithPrevious) {
            const prev = getPreviousPeriodDates("year");
            previousDateFilter = { createdAt: { $gte: prev.start, $lte: prev.end } };
        }
    } else if (fromDate && toDate) {
        const start = new Date(fromDate);
        const end = new Date(toDate);
        dateFilter = { createdAt: { $gte: start, $lte: end } };
        if (compareWithPrevious) {
            const daysDiff = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
            const prevStart = new Date(start);
            prevStart.setDate(prevStart.getDate() - daysDiff);
            const prevEnd = new Date(end);
            prevEnd.setDate(prevEnd.getDate() - daysDiff);
            previousDateFilter = { createdAt: { $gte: prevStart, $lte: prevEnd } };
        }
    }

    console.log('Customer KPI Report - dateFilter:', dateFilter);

    const orderFilter = { ...dateFilter, status: "completed" };
    const previousOrderFilter = compareWithPrevious ? { ...previousDateFilter, status: "completed" } : null;

    const [
        totalCustomers,
        activeCustomers,
        totalOrders,
        totalSales,
        totalUnpaid,
        totalReturns,
        customerPerformance,
        customerPurchaseHistory,
        customerReturns,
        customerPaymentStatus,
        previousTotalSales
    ] = await Promise.all([
        // Total customers
        CustomerModel.countDocuments({}),
        // Active customers (with orders in last 90 days)
        CustomerModel.countDocuments({ lastPurchaseDate: { $gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) } }),
        // Total orders
        OrderModel.countDocuments(orderFilter),
        // Total sales
        OrderModel.aggregate([
            { $match: orderFilter },
            { $group: { _id: null, total: { $sum: "$totalAmount" } } }
        ]),
        // Total unpaid (credit)
        OrderModel.aggregate([
            { $match: { ...orderFilter, paymentMethod: "credit" } },
            { $group: { _id: null, unpaid: { $sum: "$totalAmount" } } }
        ]),
        // Total returns
        ProductReturnModel.aggregate([
            { $match: dateFilter },
            { $group: { _id: null, totalReturns: { $sum: "$totalAmount" } } }
        ]),
        // Customer performance (orders, spending, frequency)
        CustomerModel.aggregate([
            { $lookup: { from: "orders", localField: "_id", foreignField: "customer", as: "orders" } },
            { $addFields: {
                totalOrders: { $size: "$orders" },
                totalSpent: { $sum: "$orders.totalAmount" },
                lastPurchaseDate: { $max: "$orders.createdAt" }
            }},
            { $sort: { totalSpent: -1 } }
        ]),
        // Customer purchase history (detailed)
        OrderModel.aggregate([
            { $match: orderFilter },
            { $lookup: { from: "customers", localField: "customer", foreignField: "_id", as: "customerInfo" } },
            { $unwind: "$customerInfo" },
            { $project: {
                _id: 1,
                orderNumber: 1,
                createdAt: 1,
                customerName: "$customerInfo.name",
                customerId: "$customer",
                totalAmount: 1,
                paymentMethod: 1,
                orderType: 1,
                itemCount: { $size: "$items" }
            }},
            { $sort: { createdAt: -1 } }
        ]),
        // Customer returns
        ProductReturnModel.aggregate([
            { $match: dateFilter },
            { $lookup: { from: "orders", localField: "order", foreignField: "_id", as: "orderInfo" } },
            { $lookup: { from: "customers", localField: "orderInfo.customer", foreignField: "_id", as: "customerInfo" } },
            { $unwind: "$customerInfo" },
            { $group: {
                _id: "$customerInfo._id",
                customerName: { $first: "$customerInfo.name" },
                totalReturns: { $sum: "$totalAmount" },
                returnCount: { $sum: 1 }
            }},
            { $sort: { totalReturns: -1 } }
        ]),
        // Customer payment status (receivables)
        OrderModel.aggregate([
            { $match: { ...orderFilter, paymentMethod: "credit" } },
            { $lookup: { from: "customers", localField: "customer", foreignField: "_id", as: "customerInfo" } },
            { $unwind: "$customerInfo" },
            { $group: {
                _id: "$customer",
                customerName: { $first: "$customerInfo.name" },
                totalCredit: { $sum: "$totalAmount" },
                orderCount: { $sum: 1 }
            }},
            { $sort: { totalCredit: -1 } }
        ]),
        // Previous period total
        previousOrderFilter ? OrderModel.aggregate([
            { $match: previousOrderFilter },
            { $group: { _id: null, total: { $sum: "$totalAmount" } } }
        ]) : Promise.resolve([{ total: 0 }])
    ]);

    const totalAmount = totalSales[0]?.total || 0;
    const previousTotalAmount = previousTotalSales[0]?.total || 0;
    const salesTrend = previousTotalAmount > 0 ? ((totalAmount - previousTotalAmount) / previousTotalAmount * 100).toFixed(1) : 0;
    const averageOrderValue = totalOrders > 0 ? totalAmount / totalOrders : 0;

    return {
        summary: {
            totalCustomers,
            activeCustomers,
            totalOrders,
            totalSales: totalAmount,
            totalUnpaid: totalUnpaid[0]?.unpaid || 0,
            totalReturns: totalReturns[0]?.totalReturns || 0,
            averageOrderValue,
            salesTrend
        },
        breakdowns: {
            customerPerformance: customerPerformance.map(c => ({
                customerId: c._id,
                customerName: c.name,
                totalOrders: c.totalOrders,
                totalSpent: c.totalSpent,
                averageOrderValue: c.totalOrders > 0 ? c.totalSpent / c.totalOrders : 0,
                lastPurchaseDate: c.lastPurchaseDate,
                customerSegment: c.totalSpent > 100000 ? 'VIP' : c.totalSpent > 50000 ? 'Premium' : c.totalSpent > 10000 ? 'Regular' : 'One-time'
            })),
            purchaseHistory: customerPurchaseHistory,
            returnsByCustomer: customerReturns.map(r => ({
                customerId: r._id,
                customerName: r.customerName,
                totalReturns: r.totalReturns,
                returnCount: r.returnCount
            })),
            paymentStatus: customerPaymentStatus.map(p => ({
                customerId: p._id,
                customerName: p.customerName,
                totalCredit: p.totalCredit,
                orderCount: p.orderCount,
                creditStatus: p.totalCredit > 50000 ? 'High Risk' : p.totalCredit > 20000 ? 'Medium Risk' : 'Low Risk'
            }))
        }
    };
};

// Expense KPI Report
export const getExpenseKPIReport = async (filters = {}) => {
    const ExpensesModel = getExpenseModel();
    const { fromDate, toDate, period } = filters;

    let dateFilter = {};
    if (period === "today") {
        const { startOfDay, endOfDay } = getTodayRange();
        dateFilter = { createdAt: { $gte: startOfDay, $lte: endOfDay } };
    } else if (period === "week") {
        const now = new Date();
        const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
        const endOfWeek = new Date(now.setDate(now.getDate() - now.getDay() + 6));
        dateFilter = { createdAt: { $gte: startOfWeek, $lte: endOfWeek } };
    } else if (period === "month") {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        dateFilter = { createdAt: { $gte: startOfMonth, $lte: endOfMonth } };
    } else if (fromDate && toDate) {
        dateFilter = { createdAt: { $gte: new Date(fromDate), $lte: new Date(toDate) } };
    }

    const [totalExpenses, expenseCount, expensesByCategory, expensesByType, highestExpense, lowestExpense, expenseList] = await Promise.all([
        ExpensesModel.aggregate([
            { $match: dateFilter },
            { $group: { _id: null, total: { $sum: "$amount" } } }
        ]),
        ExpensesModel.countDocuments(dateFilter),
        ExpensesModel.aggregate([
            { $match: dateFilter },
            { $group: { _id: "$category", total: { $sum: "$amount" }, count: { $sum: 1 } } },
            { $sort: { total: -1 } }
        ]),
        ExpensesModel.aggregate([
            { $match: dateFilter },
            { $group: { _id: "$type", total: { $sum: "$amount" }, count: { $sum: 1 } } },
            { $sort: { total: -1 } }
        ]),
        ExpensesModel.findOne(dateFilter, null, { sort: { amount: -1 } }),
        ExpensesModel.findOne(dateFilter, null, { sort: { amount: 1 } }),
        ExpensesModel.find(dateFilter, 'amount type date notes category createdAt', { sort: { createdAt: -1 }, limit: 100 }),
    ]);

    const totalAmount = totalExpenses[0]?.total || 0;
    const averageExpense = expenseCount > 0 ? totalAmount / expenseCount : 0;

    // Calculate daily average
    let daysCount = 1;
    if (fromDate && toDate) {
        const start = new Date(fromDate);
        const end = new Date(toDate);
        daysCount = Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24)));
    } else if (period === "today") {
        daysCount = 1;
    } else if (period === "week") {
        daysCount = 7;
    } else if (period === "month") {
        daysCount = 30;
    }
    const dailyAverage = totalAmount / daysCount;

    return {
        summary: {
            totalExpenses: totalAmount,
            expenseCount,
            averageExpense,
            dailyAverage,
            highestExpense: highestExpense?.amount || 0,
            lowestExpense: lowestExpense?.amount || 0,
        },
        breakdowns: {
            byCategory: expensesByCategory.map(item => ({
                category: item._id || 'uncategorized',
                total: item.total,
                count: item.count,
                percentage: totalAmount > 0 ? ((item.total / totalAmount) * 100).toFixed(1) : 0
            })),
            byType: expensesByType.map(item => ({
                type: item._id || 'unknown',
                total: item.total,
                count: item.count,
                percentage: totalAmount > 0 ? ((item.total / totalAmount) * 100).toFixed(1) : 0
            }))
        },
        transactions: expenseList.map(expense => ({
            id: expense._id,
            amount: expense.amount,
            type: expense.type,
            category: expense.category,
            notes: expense.notes,
            date: expense.date || expense.createdAt,
        }))
    };
};

export const getMainBusinessReport = async (filters = {}) => {
    const OrderModel = getOrderModel();
    const PurchaseModel = getPurchaseModel();
    const ExpensesModel = getExpenseModel();
    const WastageModel = getWastageModel();
    const PurchaseReturnModel = getPurchaseReturnModel();
    const ProductReturnModel = getProductReturnModel();
    const StaffSalaryPaymentModel = getStaffSalaryPaymentModel();
    const QarzaAccountModel = getQarzaAccountModel();
    const { fromDate, toDate, period = "today" } = filters;

    let dateFilter = {};
    
    if (period === "custom" && fromDate && toDate) {
        dateFilter = buildDateFilter(fromDate, toDate);
    } else if (period === "today") {
        const { startOfDay, endOfDay } = getTodayRange();
        dateFilter = { createdAt: { $gte: startOfDay, $lte: endOfDay } };
    } else if (period === "yesterday") {
        const { startOfDay, endOfDay } = getYesterdayRange();
        dateFilter = { createdAt: { $gte: startOfDay, $lte: endOfDay } };
    } else if (period === "week") {
        const { startOfWeek, endOfWeek } = getWeekRange();
        dateFilter = { createdAt: { $gte: startOfWeek, $lte: endOfWeek } };
    } else if (period === "month") {
        const { startOfMonth, endOfMonth } = getMonthRange();
        dateFilter = { createdAt: { $gte: startOfMonth, $lte: endOfMonth } };
    } else {
        // Default to current month if period is unrecognized
        const { startOfMonth, endOfMonth } = getMonthRange();
        dateFilter = { createdAt: { $gte: startOfMonth, $lte: endOfMonth } };
    }

    const [sales, purchases, expenses, wastages, purchaseReturns, productReturns, salaryPayments, qarzaReceivableData, qarzaPayableData, salesByPaymentMethod, expensesByCategory, productReturnsByReason, purchaseReturnsBySupplier, wastagesByProduct, salariesByStaff, salesList, purchasesList, expensesList, wastagesList, purchaseReturnsList, productReturnsList, salaryPaymentsList] = await Promise.all([
        OrderModel.aggregate([
            { $match: { ...dateFilter, status: "completed" } },
            { $group: { _id: null, totalSales: { $sum: "$totalAmount" }, totalDiscount: { $sum: "$discountAmount" }, count: { $sum: 1 } } }
        ]),
        PurchaseModel.aggregate([
            { $match: dateFilter },
            { $group: { _id: null, totalPurchases: { $sum: "$totalAmount" }, count: { $sum: 1 } } }
        ]),
        ExpensesModel.aggregate([
            { $match: dateFilter },
            { $group: { _id: null, totalExpenses: { $sum: "$amount" }, count: { $sum: 1 } } }
        ]),
        WastageModel.aggregate([
            { $match: dateFilter },
            { $group: { _id: null, totalWastage: { $sum: { $multiply: ["$quantity", "$costPrice"] } }, count: { $sum: 1 } } }
        ]),
        PurchaseReturnModel.aggregate([
            { $match: dateFilter },
            { $group: { _id: null, totalPurchaseReturns: { $sum: "$totalAmount" }, count: { $sum: 1 } } }
        ]),
        ProductReturnModel.aggregate([
            { $match: dateFilter },
            { $group: { _id: null, totalProductReturns: { $sum: "$refundAmount" }, count: { $sum: 1 } } }
        ]),
        StaffSalaryPaymentModel.aggregate([
            { $match: { ...dateFilter, status: 'paid' } },
            { $group: { _id: null, totalSalaries: { $sum: "$amount" }, count: { $sum: 1 } } }
        ]),
        QarzaAccountModel.aggregate([
            { $match: { ...dateFilter, type: "receivable" } },
            { $group: { _id: null, totalReceivable: { $sum: "$balance" }, count: { $sum: 1 } } }
        ]),
        QarzaAccountModel.aggregate([
            { $match: { ...dateFilter, type: "payable" } },
            { $group: { _id: null, totalPayable: { $sum: "$balance" }, count: { $sum: 1 } } }
        ]),
        OrderModel.aggregate([
            { $match: { ...dateFilter, status: "completed" } },
            { $group: { _id: "$paymentMethod", total: { $sum: "$totalAmount" }, count: { $sum: 1 } } }
        ]),
        ExpensesModel.aggregate([
            { $match: dateFilter },
            { $group: { _id: "$category", total: { $sum: "$amount" }, count: { $sum: 1 } } }
        ]),
        ProductReturnModel.aggregate([
            { $match: dateFilter },
            { $group: { _id: "$reason", total: { $sum: "$refundAmount" }, count: { $sum: 1 } } }
        ]),
        PurchaseReturnModel.aggregate([
            { $match: dateFilter },
            { $group: { _id: "$supplierName", total: { $sum: "$totalAmount" }, count: { $sum: 1 } } }
        ]),
        WastageModel.aggregate([
            { $match: dateFilter },
            { $group: { _id: "$productName", total: { $sum: { $multiply: ["$quantity", "$costPrice"] } }, count: { $sum: 1 }, totalQuantity: { $sum: "$quantity" } } }
        ]),
        StaffSalaryPaymentModel.aggregate([
            { $match: dateFilter },
            { $lookup: { from: "staff", localField: "staffId", foreignField: "_id", as: "staff" } },
            { $unwind: "$staff" },
            { $group: { _id: "$staff.name", total: { $sum: "$amount" }, count: { $sum: 1 } } }
        ]),
        OrderModel.find({ ...dateFilter, status: "completed" }, 'orderNumber totalAmount paymentMethod customerName createdAt', { sort: { createdAt: -1 }, limit: 100 }),
        PurchaseModel.find(dateFilter, 'invoiceNumber totalAmount supplierName createdAt', { sort: { createdAt: -1 }, limit: 100 }),
        ExpensesModel.find(dateFilter, 'title amount category description createdAt', { sort: { createdAt: -1 }, limit: 100 }),
        WastageModel.find(dateFilter, 'quantity costPrice productName createdAt', { sort: { createdAt: -1 }, limit: 100 }),
        PurchaseReturnModel.find(dateFilter, 'returnNumber totalAmount supplierName createdAt', { sort: { createdAt: -1 }, limit: 100 }),
        ProductReturnModel.find(dateFilter, 'returnNumber refundAmount customerName createdAt', { sort: { createdAt: -1 }, limit: 100 }),
        StaffSalaryPaymentModel.find({ ...dateFilter, status: 'paid' }, 'amount staffId paidAt', { populate: { path: 'staffId', select: 'name' }, sort: { paidAt: -1 }, limit: 100 }),
    ]);

    const totalSales = sales[0]?.totalSales || 0;
    const totalPurchases = purchases[0]?.totalPurchases || 0;
    const totalExpenses = expenses[0]?.totalExpenses || 0;
    const totalWastage = wastages[0]?.totalWastage || 0;
    const totalPurchaseReturns = purchaseReturns[0]?.totalPurchaseReturns || 0;
    const totalProductReturns = productReturns[0]?.totalProductReturns || 0;
    const totalSalaries = salaryPayments[0]?.totalSalaries || 0;
    const totalReceivable = qarzaReceivableData[0]?.totalReceivable || 0;
    const totalPayable = qarzaPayableData[0]?.totalPayable || 0;

    const grossProfit = totalSales - totalPurchases;
    const grossMarginPercentage = totalSales > 0 ? Number(((grossProfit / totalSales) * 100).toFixed(1)) : 0;
    const netProfit = totalSales - totalPurchases - totalExpenses - totalWastage - totalSalaries - totalProductReturns + totalPurchaseReturns;
    const netMarginPercentage = totalSales > 0 ? Number(((netProfit / totalSales) * 100).toFixed(1)) : 0;

    return {
        summary: {
            totalSales,
            totalPurchases,
            totalExpenses,
            totalSalaries,
            totalPurchaseReturns,
            totalProductReturns,
            totalWastage,
            totalReceivable,
            totalPayable,
            grossProfit,
            grossMarginPercentage,
            netProfit,
            netMarginPercentage,
        },
        details: {
            salesCount: sales[0]?.count || 0,
            purchaseCount: purchases[0]?.count || 0,
            expenseCount: expenses[0]?.count || 0,
            wastageCount: wastages[0]?.count || 0,
            purchaseReturnCount: purchaseReturns[0]?.count || 0,
            productReturnCount: productReturns[0]?.count || 0,
            salaryPaymentCount: salaryPayments[0]?.count || 0,
            qarzaReceivableCount: qarzaReceivableData[0]?.count || 0,
            qarzaPayableCount: qarzaPayableData[0]?.count || 0,
        },
        breakdowns: {
            salesByPaymentMethod: salesByPaymentMethod.map(item => ({
                method: item._id || 'unknown',
                total: item.total,
                count: item.count,
                percentage: totalSales > 0 ? ((item.total / totalSales) * 100).toFixed(1) : 0
            })),
            expensesByCategory: expensesByCategory.map(item => ({
                category: item._id || 'uncategorized',
                total: item.total,
                count: item.count,
                percentage: totalExpenses > 0 ? ((item.total / totalExpenses) * 100).toFixed(1) : 0
            })),
            productReturnsByReason: productReturnsByReason.map(item => ({
                reason: item._id || 'unknown',
                total: item.total,
                count: item.count,
                percentage: totalProductReturns > 0 ? ((item.total / totalProductReturns) * 100).toFixed(1) : 0
            })),
            purchaseReturnsBySupplier: purchaseReturnsBySupplier.map(item => ({
                supplierName: item._id || 'unknown',
                total: item.total,
                count: item.count,
                percentage: totalPurchaseReturns > 0 ? ((item.total / totalPurchaseReturns) * 100).toFixed(1) : 0
            })),
            wastagesByProduct: wastagesByProduct.map(item => ({
                productName: item._id || 'unknown',
                total: item.total,
                count: item.count,
                totalQuantity: item.totalQuantity,
                percentage: totalWastage > 0 ? ((item.total / totalWastage) * 100).toFixed(1) : 0
            })),
            salariesByStaff: salariesByStaff.map(item => ({
                staffName: item._id || 'unknown',
                total: item.total,
                count: item.count,
                percentage: totalSalaries > 0 ? ((item.total / totalSalaries) * 100).toFixed(1) : 0
            }))
        },
        transactions: {
            sales: salesList.map(sale => ({
                id: sale._id,
                orderNumber: sale.orderNumber,
                amount: sale.totalAmount,
                paymentMethod: sale.paymentMethod,
                customerName: sale.customerName,
                date: sale.createdAt
            })),
            purchases: purchasesList.map(purchase => ({
                id: purchase._id,
                invoiceNumber: purchase.invoiceNumber,
                amount: purchase.totalAmount,
                supplierName: purchase.supplierName,
                date: purchase.createdAt
            })),
            expenses: expensesList.map(expense => ({
                id: expense._id,
                title: expense.title,
                amount: expense.amount,
                category: expense.category,
                description: expense.description,
                date: expense.createdAt
            })),
            wastages: wastagesList.map(wastage => ({
                id: wastage._id,
                productName: wastage.productName,
                quantity: wastage.quantity,
                costPrice: wastage.costPrice,
                totalLoss: wastage.quantity * wastage.costPrice,
                date: wastage.createdAt
            })),
            purchaseReturns: purchaseReturnsList.map(ret => ({
                id: ret._id,
                returnNumber: ret.returnNumber,
                amount: ret.totalAmount,
                supplierName: ret.supplierName,
                date: ret.createdAt
            })),
            productReturns: productReturnsList.map(ret => ({
                id: ret._id,
                returnNumber: ret.returnNumber,
                amount: ret.refundAmount,
                customerName: ret.customerName,
                date: ret.createdAt
            })),
            salaryPayments: salaryPaymentsList.map(payment => ({
                id: payment._id,
                amount: payment.amount,
                staffName: payment.staffId?.name || 'Unknown',
                date: payment.paidAt
            }))
        }
    };
};

// Financial Report
export const getFinancialReport = async (filters = {}) => {
    const OrderModel = getOrderModel();
    const PurchaseModel = getPurchaseModel();
    const ExpensesModel = getExpenseModel();
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
    const QarzaAccountModel = getQarzaAccountModel();
    const QarzaPaymentModel = getQarzaPaymentModel();
    const { type, search, page = 1, limit = 20 } = filters;

    const matchQuery = {};
    if (type) matchQuery.type = type;
    if (search) matchQuery.name = { $regex: search, $options: "i" };

    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
        QarzaAccountModel.find(matchQuery, null, {
            sort: { createdAt: -1 },
            skip: skip,
            limit: limit
        }),
        QarzaAccountModel.countDocuments(matchQuery)
    ]);

    // Get recent payments for each account
    const accountsWithPayments = await Promise.all(
        data.map(async (account) => {
            const payments = await QarzaPaymentModel.find({ account: account._id }, null, {
                sort: { createdAt: -1 },
                limit: 5
            });
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

// Purchase Return Report
export const getPurchaseReturnReport = async (filters = {}) => {
    const PurchaseReturnModel = getPurchaseReturnModel();
    const SupplierModel = getSupplierModel();
    const { fromDate, toDate, supplierId, page = 1, limit = 20 } = filters;

    const matchQuery = {};
    if (fromDate || toDate) {
        const dateFilter = buildDateFilter(fromDate, toDate);
        matchQuery.createdAt = dateFilter.createdAt;
    }
    if (supplierId) matchQuery.supplier = supplierId;

    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
        PurchaseReturnModel.find(matchQuery, null, {
            populate: { path: "supplier", select: "name" },
            sort: { createdAt: -1 },
            skip: skip,
            limit: limit
        }),
        PurchaseReturnModel.countDocuments(matchQuery)
    ]);

    const totals = await PurchaseReturnModel.aggregate([
        { $match: matchQuery },
        { $group: { _id: null, totalAmount: { $sum: "$totalAmount" }, count: { $sum: 1 } } }
    ]);

    const returnsBySupplier = await PurchaseReturnModel.aggregate([
        { $match: matchQuery },
        { $group: { _id: "$supplier", totalAmount: { $sum: "$totalAmount" }, count: { $sum: 1 } } },
        { $lookup: { from: "suppliers", localField: "_id", foreignField: "_id", as: "supplier" } },
        { $unwind: "$supplier" },
        { $project: { supplierName: "$supplier.name", totalAmount: 1, count: 1 } }
    ]);

    return {
        data,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        summary: {
            totalAmount: totals[0]?.totalAmount || 0,
            totalReturns: totals[0]?.count || 0,
        },
        returnsBySupplier,
    };
};

// Sale Return Report
export const getSaleReturnReport = async (filters = {}) => {
    const ProductReturnModel = getProductReturnModel();
    const CustomerModel = getCustomerModel();
    const { fromDate, toDate, customerId, page = 1, limit = 20 } = filters;

    const matchQuery = {};
    if (fromDate || toDate) {
        const dateFilter = buildDateFilter(fromDate, toDate);
        matchQuery.createdAt = dateFilter.createdAt;
    }
    if (customerId) matchQuery.customer = customerId;

    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
        ProductReturnModel.find(matchQuery, null, {
            populate: { path: "customer", select: "name phone" },
            sort: { createdAt: -1 },
            skip: skip,
            limit: limit
        }),
        ProductReturnModel.countDocuments(matchQuery)
    ]);

    const totals = await ProductReturnModel.aggregate([
        { $match: matchQuery },
        { $group: { _id: null, totalRefund: { $sum: "$refundAmount" }, count: { $sum: 1 } } }
    ]);

    const returnsByCustomer = await ProductReturnModel.aggregate([
        { $match: matchQuery },
        { $group: { _id: "$customer", totalRefund: { $sum: "$refundAmount" }, count: { $sum: 1 } } },
        { $lookup: { from: "customers", localField: "_id", foreignField: "_id", as: "customer" } },
        { $unwind: "$customer" },
        { $project: { customerName: "$customer.name", totalRefund: 1, count: 1 } }
    ]);

    return {
        data,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        summary: {
            totalRefund: totals[0]?.totalRefund || 0,
            totalReturns: totals[0]?.count || 0,
        },
        returnsByCustomer,
    };
};

// Inventory Report
export const getInventoryReport = async (filters = {}) => {
    const BatchModel = getBatchModel();
    const ProductModel = getProductModel();
    const OrderModel = getOrderModel();
    const PurchaseModel = getPurchaseModel();
    const WastageModel = getWastageModel();
    const ProductReturnModel = getProductReturnModel();
    const CategoryModel = getCategoryModel();
    
    const { 
        categoryId, 
        lowStock, 
        nearExpiry, 
        page = 1, 
        limit = 20,
        fromDate,
        toDate,
        productName,
        productCode,
        tag,
        sortBy = 'createdAt'
    } = filters;

    const matchQuery = { isActive: true };
    
    // Build date filter
    let dateFilter = {};
    if (fromDate && toDate) {
        const startDate = new Date(fromDate);
        startDate.setHours(0, 0, 0, 0);
        const endDate = new Date(toDate);
        endDate.setHours(23, 59, 59, 999);
        dateFilter = { createdAt: { $gte: startDate, $lte: endDate } };
    }

    // Apply filters
    if (lowStock) matchQuery.quantity = { $gt: 0, $lte: 10 };
    if (nearExpiry) {
        const thirtyDaysFromNow = new Date();
        thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
        matchQuery.expiryDate = { $lte: thirtyDaysFromNow, $gte: new Date() };
    }

    const skip = (page - 1) * limit;

    // Get all products with their data
    let productQuery = { isActive: true };
    if (categoryId) productQuery.category = categoryId;
    if (productName) productQuery.name = { $regex: productName, $options: 'i' };
    if (productCode) productQuery.code = { $regex: productCode, $options: 'i' };

    const products = await ProductModel.find(productQuery, null, {
        populate: 'category',
        sort: { [sortBy]: sortBy === 'expiryDate' ? 1 : -1 },
        skip: skip,
        limit: limit
    });

    const totalProducts = await ProductModel.countDocuments(productQuery);

    // Get statistics for each product
    const productsWithStats = await Promise.all(
        products.map(async (product) => {
            // Get all batches for this product
            const batches = await BatchModel.find({ product: product._id, isActive: true });
            const currentStock = batches.reduce((sum, batch) => sum + batch.quantity, 0);
            const minStockLevel = product.minStockLevel || 0;
            const maxStockLevel = product.maxStockLevel || 0;
            
            // Get earliest expiry date
            const expiryDates = batches
                .filter(b => b.expiryDate)
                .map(b => new Date(b.expiryDate))
                .sort((a, b) => a - b);
            const expiryDate = expiryDates.length > 0 ? expiryDates[0] : null;

            // Get total purchased quantity
            const purchaseFilter = {
                'items.product': product._id,
                ...(Object.keys(dateFilter).length > 0 ? dateFilter : {})
            };
            const purchases = await PurchaseModel.find(purchaseFilter);
            const totalPurchased = purchases.reduce((sum, purchase) => {
                const item = purchase.items.find(i => i.product.toString() === product._id.toString());
                return sum + (item ? item.quantity : 0);
            }, 0);

            // Get total sold quantity
            const orderFilter = {
                'items.product': product._id,
                status: 'completed',
                ...(Object.keys(dateFilter).length > 0 ? dateFilter : {})
            };
            const orders = await OrderModel.find(orderFilter);
            const totalSold = orders.reduce((sum, order) => {
                const item = order.items.find(i => i.product.toString() === product._id.toString());
                return sum + (item ? item.quantity : 0);
            }, 0);

            // Get total returned quantity
            const returnFilter = {
                'items.product': product._id,
                ...(Object.keys(dateFilter).length > 0 ? dateFilter : {})
            };
            const returns = await ProductReturnModel.find(returnFilter);
            const totalReturned = returns.reduce((sum, ret) => {
                const item = ret.items.find(i => i.product.toString() === product._id.toString());
                return sum + (item ? item.quantity : 0);
            }, 0);

            // Get total wasted quantity
            const wastageFilter = {
                product: product._id,
                ...(Object.keys(dateFilter).length > 0 ? dateFilter : {})
            };
            const wastages = await WastageModel.find(wastageFilter);
            const totalWasted = wastages.reduce((sum, w) => sum + w.quantity, 0);

            // Auto-tag the product
            let assignedTag = null;
            const now = new Date();
            
            if (expiryDate && expiryDate < now) {
                assignedTag = 'expired';
            } else if (expiryDate && (expiryDate - now) / (1000 * 60 * 60 * 24) <= 30) {
                assignedTag = 'near_expiry';
            } else if (currentStock === 0) {
                assignedTag = 'dead_stock';
            } else if (currentStock <= minStockLevel && minStockLevel > 0) {
                assignedTag = 'low_stock';
            } else if (currentStock >= maxStockLevel && maxStockLevel > 0) {
                assignedTag = 'overstock';
            } else if (totalSold > (totalPurchased * 0.7)) {
                assignedTag = 'fast_selling';
            } else if (totalReturned > (totalSold * 0.2)) {
                assignedTag = 'high_return';
            }

            // Apply tag filter if specified
            if (tag && assignedTag !== tag) {
                return null;
            }

            return {
                ...product.toObject(),
                currentStock,
                minStockLevel,
                maxStockLevel,
                totalPurchased,
                totalSold,
                totalReturned,
                totalWasted,
                expiryDate,
                tag: assignedTag,
            };
        })
    );

    // Filter out null values (from tag filtering)
    const filteredProducts = productsWithStats.filter(p => p !== null);
    const filteredTotal = filteredProducts.length;

    // Calculate sales and return rankings
    const sortedBySales = [...filteredProducts].sort((a, b) => b.totalSold - a.totalSold);
    const sortedByReturns = [...filteredProducts].sort((a, b) => b.totalReturned - a.totalReturned);

    const salesRankMap = {};
    sortedBySales.forEach((p, index) => {
        salesRankMap[p._id.toString()] = index + 1;
    });

    const returnRankMap = {};
    sortedByReturns.forEach((p, index) => {
        returnRankMap[p._id.toString()] = index + 1;
    });

    // Add ranks to products
    const finalProducts = filteredProducts.map(p => ({
        ...p,
        salesRank: salesRankMap[p._id.toString()],
        returnRank: returnRankMap[p._id.toString()],
    }));

    // Calculate summary totals by tag
    const tagCounts = {
        dead_stock: 0,
        expired: 0,
        low_stock: 0,
        fast_selling: 0,
        overstock: 0,
        high_return: 0,
        near_expiry: 0,
    };

    finalProducts.forEach(p => {
        if (p.tag && tagCounts[p.tag] !== undefined) {
            tagCounts[p.tag]++;
        }
    });

    // Sort based on sortBy parameter
    let sortedProducts = [...finalProducts];
    if (sortBy === 'tag') {
        // Sort by tag priority: expired > near_expiry > dead_stock > high_return > low_stock > overstock > fast_selling > none
        const tagPriority = {
            expired: 1,
            near_expiry: 2,
            dead_stock: 3,
            high_return: 4,
            low_stock: 5,
            overstock: 6,
            fast_selling: 7,
        };
        sortedProducts.sort((a, b) => {
            const aPriority = a.tag ? tagPriority[a.tag] || 8 : 8;
            const bPriority = b.tag ? tagPriority[b.tag] || 8 : 8;
            return aPriority - bPriority;
        });
    } else if (sortBy === 'highest_sales') {
        sortedProducts.sort((a, b) => b.totalSold - a.totalSold);
    } else if (sortBy === 'lowest_sales') {
        sortedProducts.sort((a, b) => a.totalSold - b.totalSold);
    } else if (sortBy === 'most_returned') {
        sortedProducts.sort((a, b) => b.totalReturned - a.totalReturned);
    } else if (sortBy === 'expiry_date') {
        sortedProducts.sort((a, b) => {
            if (!a.expiryDate) return 1;
            if (!b.expiryDate) return -1;
            return new Date(a.expiryDate) - new Date(b.expiryDate);
        });
    } else if (sortBy === 'stock_level') {
        sortedProducts.sort((a, b) => a.currentStock - b.currentStock);
    }

    return {
        data: sortedProducts,
        total: filteredTotal,
        page,
        limit,
        totalPages: Math.ceil(filteredTotal / limit),
        summary: {
            totalProducts: filteredTotal,
            deadStockCount: tagCounts.dead_stock,
            expiredCount: tagCounts.expired,
            lowStockCount: tagCounts.low_stock,
            fastSellingCount: tagCounts.fast_selling,
            overstockCount: tagCounts.overstock,
            highReturnCount: tagCounts.high_return,
            nearExpiryCount: tagCounts.near_expiry,
        },
    };
};

// Product Wastage Report
export const getProductWastageReport = async (filters = {}) => {
    const WastageModel = getWastageModel();
    const ProductModel = getProductModel();
    const { fromDate, toDate, productId, page = 1, limit = 20 } = filters;

    const matchQuery = {};
    if (fromDate || toDate) {
        const dateFilter = buildDateFilter(fromDate, toDate);
        matchQuery.createdAt = dateFilter.createdAt;
    }
    if (productId) matchQuery.product = productId;

    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
        WastageModel.find(matchQuery)
            .populate("product", "name")
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit),
        WastageModel.countDocuments(matchQuery)
    ]);

    const totals = await WastageModel.aggregate([
        { $match: matchQuery },
        { $group: { _id: null, totalQuantity: { $sum: "$quantity" }, totalLoss: { $sum: { $multiply: ["$quantity", "$costPrice"] } }, count: { $sum: 1 } } }
    ]);

    const wastageByProduct = await WastageModel.aggregate([
        { $match: matchQuery },
        { $group: { _id: "$product", totalQuantity: { $sum: "$quantity" }, totalLoss: { $sum: { $multiply: ["$quantity", "$costPrice"] } }, count: { $sum: 1 } } },
        { $lookup: { from: "products", localField: "_id", foreignField: "_id", as: "product" } },
        { $unwind: "$product" },
        { $project: { productName: "$product.name", totalQuantity: 1, totalLoss: 1, count: 1 } },
        { $sort: { totalLoss: -1 } }
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
            totalWastages: totals[0]?.count || 0,
        },
        wastageByProduct,
    };
};

// Customer Report
export const getCustomerReport = async (filters = {}) => {
    const CustomerModel = getCustomerModel();
    const OrderModel = getOrderModel();
    const { search, page = 1, limit = 20 } = filters;

    const matchQuery = {};
    if (search) {
        matchQuery.$or = [
            { name: { $regex: search, $options: "i" } },
            { phone: { $regex: search, $options: "i" } }
        ];
    }

    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
        CustomerModel.find(matchQuery)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit),
        CustomerModel.countDocuments(matchQuery)
    ]);

    const customersWithStats = await Promise.all(
        data.map(async (customer) => {
            const orders = await OrderModel.find({ customerName: customer.name, status: "completed" });
            const totalPurchases = orders.reduce((sum, order) => sum + order.totalAmount, 0);
            const pendingCredit = await OrderModel.aggregate([
                { $match: { customerName: customer.name, paymentMethod: "credit", status: "completed" } },
                { $group: { _id: null, total: { $sum: "$totalAmount" } } }
            ]);
            return {
                ...customer.toObject(),
                totalOrders: orders.length,
                totalPurchases,
                pendingCredit: pendingCredit[0]?.total || 0,
            };
        })
    );

    const topCustomers = await OrderModel.aggregate([
        { $match: { status: "completed" } },
        { $group: { _id: "$customerName", totalPurchases: { $sum: "$totalAmount" }, count: { $sum: 1 } } },
        { $sort: { totalPurchases: -1 } },
        { $limit: 10 }
    ]);

    return {
        data: customersWithStats,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        summary: {
            totalCustomers: total,
            topCustomers,
        },
    };
};

// Supplier Report
export const getSupplierReport = async (filters = {}) => {
    const SupplierModel = getSupplierModel();
    const PurchaseModel = getPurchaseModel();
    const PurchaseReturnModel = getPurchaseReturnModel();
    const { search, page = 1, limit = 20 } = filters;

    const matchQuery = {};
    if (search) {
        matchQuery.$or = [
            { name: { $regex: search, $options: "i" } },
            { phone: { $regex: search, $options: "i" } }
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

    const suppliersWithStats = await Promise.all(
        data.map(async (supplier) => {
            const purchases = await PurchaseModel.find({ supplier: supplier._id });
            const totalPurchases = purchases.reduce((sum, purchase) => sum + purchase.totalAmount, 0);
            const pendingPayments = purchases.filter(p => p.paymentStatus !== "paid").reduce((sum, p) => sum + p.totalAmount, 0);
            const returns = await PurchaseReturnModel.find({ supplier: supplier._id });
            const totalReturns = returns.reduce((sum, ret) => sum + ret.totalAmount, 0);
            return {
                ...supplier.toObject(),
                totalPurchases,
                pendingPayments,
                totalReturns,
                returnCount: returns.length,
            };
        })
    );

    return {
        data: suppliersWithStats,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        summary: {
            totalSuppliers: total,
        },
    };
};

// Staff Report
export const getStaffReport = async (filters = {}) => {
    const StaffModel = getStaffModel();
    const StaffSalaryPaymentModel = getStaffSalaryPaymentModel();
    const StaffSaleBillModel = getStaffSaleBillModel();
    const StaffAttendanceModel = getStaffAttendanceModel();
    const OrderModel = getOrderModel();
    
    const { 
        role, 
        status, 
        page = 1, 
        limit = 20,
        fromDate,
        toDate,
        staffId,
        orderType 
    } = filters;

    const matchQuery = {};
    if (role) matchQuery.role = role;
    if (status) matchQuery.status = status;
    if (staffId) matchQuery._id = staffId;

    const skip = (page - 1) * limit;

    // Build date filter for orders and attendance
    let dateFilter = {};
    if (fromDate && toDate) {
        const startDate = new Date(fromDate);
        startDate.setHours(0, 0, 0, 0);
        const endDate = new Date(toDate);
        endDate.setHours(23, 59, 59, 999);
        dateFilter = { createdAt: { $gte: startDate, $lte: endDate } };
    }

    // Build order type filter
    let orderTypeFilter = {};
    if (orderType && orderType !== 'both') {
        orderTypeFilter = { orderType: orderType };
    }

    const [data, total] = await Promise.all([
        StaffModel.find(matchQuery)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit),
        StaffModel.countDocuments(matchQuery)
    ]);

    const staffWithStats = await Promise.all(
        data.map(async (staff) => {
            // Get salary payments with date filter
            const salaryPayments = await StaffSalaryPaymentModel.find({ 
                staffId: staff._id,
                ...(Object.keys(dateFilter).length > 0 ? dateFilter : {})
            });
            const totalPaid = salaryPayments.reduce((sum, payment) => sum + payment.amount, 0);
            
            // Get advance/deductions
            const advance = salaryPayments.reduce((sum, payment) => sum + (payment.advance || 0), 0);
            const deductions = salaryPayments.reduce((sum, payment) => sum + (payment.deduction || 0), 0);

            // Get orders handled by this staff
            const orderFilter = {
                ...(Object.keys(dateFilter).length > 0 ? dateFilter : {}),
                ...orderTypeFilter,
                'staffId': staff._id
            };
            
            const orders = await OrderModel.find(orderFilter);
            const totalOrders = orders.length;
            
            // Calculate sales amounts
            const totalSales = orders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
            const retailSales = orders
                .filter(o => o.orderType === 'retail')
                .reduce((sum, order) => sum + (order.totalAmount || 0), 0);
            const wholesaleSales = orders
                .filter(o => o.orderType === 'wholesale')
                .reduce((sum, order) => sum + (order.totalAmount || 0), 0);

            // Get attendance data
            const attendanceFilter = {
                ...(Object.keys(dateFilter).length > 0 ? dateFilter : {})
            };
            
            const attendanceRecords = await StaffAttendanceModel.find(attendanceFilter);
            let totalPresentDays = 0;
            let totalAbsentDays = 0;
            let totalWorkingHours = 0;

            attendanceRecords.forEach(record => {
                const staffAttendance = record.attendance.find(a => a.staff.toString() === staff._id.toString());
                if (staffAttendance) {
                    if (staffAttendance.status === 'present') {
                        totalPresentDays++;
                    } else if (staffAttendance.status === 'absent') {
                        totalAbsentDays++;
                    }
                    // Calculate working hours (assuming 8 hours per present day)
                    if (staffAttendance.status === 'present' || staffAttendance.status === 'late') {
                        totalWorkingHours += 8 - (staffAttendance.lateHours || 0);
                    }
                }
            });

            // Calculate net payable
            const monthlySalary = staff.salaryType === 'fixed' ? (staff.monthlySalary || 0) : 0;
            const netPayable = monthlySalary - totalPaid - deductions + advance;

            return {
                ...staff.toObject(),
                totalOrders,
                totalSales,
                retailSales,
                wholesaleSales,
                totalPresentDays,
                totalAbsentDays,
                totalWorkingHours,
                salaryPaid: totalPaid,
                advance,
                deductions,
                netPayable,
                paymentCount: salaryPayments.length,
            };
        })
    );

    // Calculate summary totals
    const grandTotalSales = staffWithStats.reduce((sum, staff) => sum + staff.totalSales, 0);
    const grandTotalOrders = staffWithStats.reduce((sum, staff) => sum + staff.totalOrders, 0);
    const grandTotalSalaryPaid = staffWithStats.reduce((sum, staff) => sum + staff.salaryPaid, 0);

    // Calculate performance rank based on total sales
    const rankedStaff = [...staffWithStats].sort((a, b) => b.totalSales - a.totalSales);
    rankedStaff.forEach((staff, index) => {
        staff.rank = index + 1;
    });

    // Re-sort by original order
    const finalData = data.map(staff => 
        rankedStaff.find(r => r._id.toString() === staff._id.toString())
    );

    return {
        data: finalData,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        summary: {
            totalStaff: total,
            grandTotalSales,
            grandTotalOrders,
            grandTotalSalaryPaid,
        },
    };
};

// Profit & Loss Report
export const getProfitLossReport = async (filters = {}) => {
    const OrderModel = getOrderModel();
    const PurchaseModel = getPurchaseModel();
    const ExpensesModel = getExpenseModel();
    const WastageModel = getWastageModel();
    const StaffSalaryPaymentModel = getStaffSalaryPaymentModel();
    const ProductReturnModel = getProductReturnModel();
    const { fromDate, toDate, period = "month" } = filters;

    let dateFilter = {};
    if (period === "custom" && fromDate && toDate) {
        dateFilter = buildDateFilter(fromDate, toDate);
    } else if (period === "month") {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        dateFilter = { createdAt: { $gte: startOfMonth, $lte: endOfMonth } };
    }

    const [revenue, costOfGoodsSold, expenses, wastages, salaries, refunds] = await Promise.all([
        OrderModel.aggregate([
            { $match: { ...dateFilter, status: "completed" } },
            { $group: { _id: null, total: { $sum: "$totalAmount" }, discount: { $sum: "$discountAmount" } } }
        ]),
        PurchaseModel.aggregate([
            { $match: dateFilter },
            { $group: { _id: null, total: { $sum: "$totalAmount" } } }
        ]),
        ExpensesModel.aggregate([
            { $match: dateFilter },
            { $group: { _id: null, total: { $sum: "$amount" } } }
        ]),
        WastageModel.aggregate([
            { $match: dateFilter },
            { $group: { _id: null, total: { $sum: { $multiply: ["$quantity", "$costPrice"] } } } }
        ]),
        StaffSalaryPaymentModel.aggregate([
            { $match: dateFilter },
            { $group: { _id: null, total: { $sum: "$amount" } } }
        ]),
        ProductReturnModel.aggregate([
            { $match: dateFilter },
            { $group: { _id: null, total: { $sum: "$refundAmount" } } }
        ]),
    ]);

    const totalRevenue = revenue[0]?.total || 0;
    const totalDiscount = revenue[0]?.discount || 0;
    const netRevenue = totalRevenue - totalDiscount;
    const totalCOGS = costOfGoodsSold[0]?.total || 0;
    const totalExpenses = expenses[0]?.total || 0;
    const totalWastage = wastages[0]?.total || 0;
    const totalSalaries = salaries[0]?.total || 0;
    const totalRefunds = refunds[0]?.total || 0;

    const grossProfit = netRevenue - totalCOGS;
    const operatingExpenses = totalExpenses + totalWastage + totalSalaries;
    const netProfit = grossProfit - operatingExpenses - totalRefunds;
    const profitMargin = netRevenue > 0 ? ((netProfit / netRevenue) * 100).toFixed(2) : 0;

    return {
        summary: {
            totalRevenue,
            totalDiscount,
            netRevenue,
            totalCOGS,
            grossProfit,
            totalExpenses,
            totalWastage,
            totalSalaries,
            totalRefunds,
            operatingExpenses,
            netProfit,
            profitMargin: parseFloat(profitMargin),
        },
    };
};

// Expense Report
export const getExpenseReport = async (filters = {}) => {
    const ExpensesModel = getExpenseModel();
    const ExpenseCategoryModel = getExpenseCategoryModel();
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

// Wastage Report
export const getWastageReport = async (filters = {}) => {
    const WastageModel = getWastageModel();
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
    const ActivityLogModel = getActivityLogModel();
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
    const OrderModel = getOrderModel();
    const { fromDate, toDate, limit = 10 } = filters;
    const limitNum = parseInt(limit) || 10;

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
        { $limit: limitNum }
    ]);

    return topProducts;
};

// Top Customers
export const getTopCustomers = async (filters = {}) => {
    const OrderModel = getOrderModel();
    const { fromDate, toDate, limit = 10 } = filters;
    const limitNum = parseInt(limit) || 10;

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
        { $limit: limitNum }
    ]);

    return topCustomers;
};

// Low Stock Products
export const getLowStockProducts = async (filters = {}) => {
    const BatchModel = getBatchModel();
    const ProductModel = getProductModel();
    const { limit = 10 } = filters;
    const limitNum = parseInt(limit) || 10;

    const lowStockBatches = await BatchModel.find({
        quantity: { $gt: 0, $lte: 10 },
        isActive: true
    })
        .populate("product", "name defaultSalePrice")
        .sort({ quantity: 1 })
        .limit(limitNum);

    return lowStockBatches;
};

// Near Expiry Products
export const getNearExpiryProducts = async (filters = {}) => {
    const BatchModel = getBatchModel();
    const { limit = 10 } = filters;
    const limitNum = parseInt(limit) || 10;

    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    const nearExpiryBatches = await BatchModel.find({
        expiryDate: { $lte: thirtyDaysFromNow, $gte: new Date() },
        quantity: { $gt: 0 },
        isActive: true
    })
        .populate("product", "name defaultSalePrice")
        .sort({ expiryDate: 1 })
        .limit(limitNum);

    return nearExpiryBatches;
};

// Recent Sales
export const getRecentSales = async (filters = {}) => {
    const OrderModel = getOrderModel();
    const { limit = 10 } = filters;

    const recentSales = await OrderModel.find({ status: "completed" })
        .populate("items.product", "name")
        .sort({ createdAt: -1 })
        .limit(limit);

    return recentSales;
};

// Recent Purchases
export const getRecentPurchases = async (filters = {}) => {
    const PurchaseModel = getPurchaseModel();
    const { limit = 10 } = filters;

    const recentPurchases = await PurchaseModel.find()
        .populate("supplier", "name")
        .populate("items.product", "name")
        .sort({ createdAt: -1 })
        .limit(limit);

    return recentPurchases;
};
