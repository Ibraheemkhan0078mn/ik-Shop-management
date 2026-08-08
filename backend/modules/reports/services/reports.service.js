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

// Service function imports
import {
    findOrderService,
    countOrderService,
    findByIdOrderService,
} from '../../pos/services/order.crud.js';
import {
    findPurchaseService,
    countPurchaseService,
} from '../../productPurchases/services/purchase.crud.js';
import {
    findBatchService,
    countBatchService,
    findByIdBatchService,
} from '../../productPurchases/services/batch.crud.js';
import {
    findSupplierService,
    countSupplierService,
} from '../../suppliers/services/supplier.crud.js';
import {
    findExpenseService,
    countExpenseService,
} from '../../expenses/services/expense.crud.js';
import {
    findExpenseCategoryService,
} from '../../expenses/services/expenseCategory.crud.js';
import {
    findWastageService,
    countWastageService,
} from '../../wastage/services/wastage.crud.js';
import {
    findProductService,
    countProductService,
} from '../../product/services/product.crud.js';
import {
    findCustomerService,
    countCustomerService,
} from '../../customer/services/customer.crud.js';
import {
    findStaffService,
    countStaffService,
} from '../../staff/services/staff.crud.js';
import {
    findStaffSalaryPaymentService,
} from '../../staff/services/staffSalaryPayment.crud.js';
import {
    findStaffAttendanceService,
} from '../../staff/services/staffAttendance.crud.js';
import {
    findQarzaAccountService,
    countQarzaAccountService,
} from '../../qarza/services/qarzaAccount.crud.js';
import {
    findQarzaPaymentService,
} from '../../qarza/services/qarzaPayment.crud.js';
import {
    findProductReturnService,
    countProductReturnService,
} from '../../productReturn/services/productReturn.crud.js';
import {
    findPurchaseReturnService,
    countPurchaseReturnService,
} from '../../purchaseReturn/services/purchaseReturn.crud.js';

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
    const { startOfDay, endOfDay } = getTodayRange();

    // Get today's data using service functions
    const [todayOrders, todayPurchases, todayExpenses, allBatches, allQarzaAccounts] = await Promise.all([
        findOrderService({ createdAt: { $gte: startOfDay, $lt: endOfDay }, status: "completed" }),
        findPurchaseService({ createdAt: { $gte: startOfDay, $lt: endOfDay } }),
        findExpenseService({ createdAt: { $gte: startOfDay, $lt: endOfDay } }),
        findBatchService({ isActive: true }),
        findQarzaAccountService({})
    ]);

    // Calculate today's sales
    const salesTotal = todayOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);

    // Calculate today's purchases
    const purchasesTotal = todayPurchases.reduce((sum, purchase) => sum + (purchase.totalAmount || 0), 0);

    // Calculate today's expenses
    const expensesTotal = todayExpenses.reduce((sum, expense) => sum + (expense.amount || 0), 0);

    // Today's Profit (Sales - Purchases - Expenses)
    const todayProfit = salesTotal - purchasesTotal - expensesTotal;

    // Cash Balance (from today's cash payments)
    const cashOrders = todayOrders.filter(o => o.paymentMethod === "cash");
    const netCashBalance = cashOrders.reduce((sum, order) => {
        return sum + (order.cashReceived || 0) - (order.change || 0);
    }, 0);

    // Total Receivable (Qarza credit accounts)
    const totalReceivable = allQarzaAccounts
        .filter(q => q.type === "receivable")
        .reduce((sum, q) => sum + (q.balance || 0), 0);

    // Total Payable (Qarza payable accounts)
    const totalPayable = allQarzaAccounts
        .filter(q => q.type === "payable")
        .reduce((sum, q) => sum + (q.balance || 0), 0);

    // Inventory Value
    const inventoryValue = allBatches
        .filter(b => b.quantity > 0)
        .reduce((sum, batch) => sum + (batch.quantity * (batch.costPrice || 0)), 0);

    // New Suppliers (today)
    const newSuppliers = await countSupplierService({
        createdAt: { $gte: startOfDay, $lt: endOfDay }
    });

    // Low Stock Count
    const lowStockCount = await countBatchService({
        quantity: { $gt: 0, $lte: 10 },
        isActive: true
    });

    // Pending Credits (Qarza accounts with balance)
    const pendingCredits = await countQarzaAccountService({ balance: { $gt: 0 } });

    return {
        todaySales: salesTotal,
        todayPurchase: purchasesTotal,
        todayProfit,
        cashBalance: netCashBalance,
        totalReceivable,
        totalPayable,
        todayExpense: expensesTotal,
        inventoryValue,
        newSuppliers,
        lowStockCount,
        pendingCredits
    };
};

// Sales Report
export const getSalesReport = async (filters = {}) => {
    const { fromDate, toDate, customerType, customerId, paymentStatus, sortBy, sortOrder, search, page = 1, limit = 20 } = filters;

    const matchQuery = { status: "completed" };
    
    // Date filter
    if (fromDate || toDate) {
        const dateFilter = buildDateFilter(fromDate, toDate);
        matchQuery.createdAt = dateFilter.createdAt;
    }

    // Customer type filter
    if (customerType && customerType !== "all") {
        matchQuery.customerType = customerType;
    }

    // Specific customer filter
    if (customerId) {
        matchQuery.customerId = customerId;
    }

    // Payment status filter
    if (paymentStatus && paymentStatus !== "all") {
        if (paymentStatus === "paid") {
            matchQuery.paymentStatus = "full";
        } else if (paymentStatus === "unpaid") {
            matchQuery.paymentStatus = { $in: ["partial", "unpaid"] };
            matchQuery.paidAmount = { $eq: 0 };
        } else if (paymentStatus === "partial") {
            matchQuery.paymentStatus = "partial";
        }
    }

    // Search filter
    if (search) {
        matchQuery.$or = [
            { orderNumber: { $regex: search, $options: "i" } },
            { customerName: { $regex: search, $options: "i" } }
        ];
    }

    const skip = (page - 1) * limit;

    // Sort configuration
    const sortField = sortBy === "amount" ? "totalAmount" : 
                      sortBy === "date" ? "createdAt" : 
                      sortBy === "items" ? "itemsCount" : "createdAt";
    const sortDirection = sortOrder === "asc" ? 1 : -1;

    // Get orders using service function
    const orders = await findOrderService(matchQuery, {
        sort: { [sortField]: sortDirection },
        skip,
        limit
    });

    // Calculate items count and add fields
    const ordersWithStats = orders.map(order => ({
        ...order,
        itemsCount: order.items?.length || 0,
        paidAmount: order.paidAmount || 0,
        dueAmount: (order.totalAmount || 0) - (order.paidAmount || 0)
    }));

    // Populate products for each order using service
    const populatedOrders = await Promise.all(
        ordersWithStats.map(async (order) => {
            const populatedOrder = await findByIdOrderService(order._id, { populate: ['items.product'] });
            return {
                ...order,
                items: populatedOrder?.items || order.items
            };
        })
    );

    // Get total count using service
    const total = await countOrderService(matchQuery);

    // Calculate KPIs from the data
    const totalSales = orders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
    const totalPaid = orders.reduce((sum, order) => sum + (order.paidAmount || 0), 0);
    const totalDue = orders.reduce((sum, order) => sum + ((order.totalAmount || 0) - (order.paidAmount || 0)), 0);
    const totalItems = orders.reduce((sum, order) => sum + (order.items?.length || 0), 0);
    const totalOrders = orders.length;

    const averageOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0;

    // Add rank to each order
    const rankedData = populatedOrders.map((order, index) => ({
        ...order,
        rank: skip + index + 1
    }));

    return {
        data: rankedData,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        summary: {
            totalSales,
            totalOrders,
            totalPaid,
            totalDue,
            averageOrderValue,
            totalItems
        }
    };
};

// Purchase Report
export const getPurchaseReport = async (filters = {}) => {
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
        findPurchaseService(matchQuery, {
            populate: ["supplier"],
            sort: { createdAt: -1 },
            skip,
            limit
        }),
        countPurchaseService(matchQuery)
    ]);

    // Calculate totals and KPIs from the data
    const totalPurchases = data.reduce((sum, purchase) => sum + (purchase.totalAmount || 0), 0);
    const totalPaid = data.reduce((sum, purchase) => sum + (purchase.paymentStatus === "full" ? (purchase.totalAmount || 0) : 0), 0);
    const totalDue = data.reduce((sum, purchase) => {
        if (purchase.paymentStatus !== "full") {
            return sum + ((purchase.totalAmount || 0) - (purchase.paidAmount || 0));
        }
        return sum;
    }, 0);
    const totalDeliveredCount = data.filter(p => p.status === "delivered").length;
    const totalRejectedCount = data.filter(p => p.status === "rejected").length;
    
    // Get unique suppliers
    const uniqueSuppliers = [...new Set(data.map(p => p.supplier?.toString()).filter(Boolean))];
    const totalSuppliers = uniqueSuppliers.length;

    // Get supplier-wise breakdown
    const supplierMap = {};
    data.forEach(purchase => {
        const supplierId = purchase.supplier?.toString();
        if (!supplierId) return;
        
        if (!supplierMap[supplierId]) {
            supplierMap[supplierId] = {
                supplierId,
                supplierName: purchase.supplierName || 'Unknown',
                totalAmount: 0,
                paidAmount: 0,
                dueAmount: 0,
                billsCount: 0
            };
        }
        
        supplierMap[supplierId].totalAmount += purchase.totalAmount || 0;
        supplierMap[supplierId].paidAmount += purchase.paymentStatus === "full" ? (purchase.totalAmount || 0) : (purchase.paidAmount || 0);
        supplierMap[supplierId].dueAmount += purchase.paymentStatus !== "full" ? ((purchase.totalAmount || 0) - (purchase.paidAmount || 0)) : 0;
        supplierMap[supplierId].billsCount += 1;
    });

    const supplierBreakdown = Object.values(supplierMap).sort((a, b) => b.totalAmount - a.totalAmount);

    return {
        data,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        summary: {
            totalPurchases,
            totalPaid,
            totalDue,
            totalDeliveredCount,
            totalRejectedCount,
            totalSuppliers,
            totalBills: total
        },
        supplierBreakdown
    };
};

// Main Business Report
// Sales KPI Report
export const getSalesKPIReport = async (filters = {}) => {
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

    // Fetch all data using service functions
    const [orders, productReturns, staffList, previousOrders] = await Promise.all([
        findOrderService(orderFilter),
        findProductReturnService(dateFilter),
        findStaffService({}).select('name _id'),
        previousOrderFilter ? findOrderService(previousOrderFilter) : []
    ]);

    const totalOrders = orders.length;
    
    // Calculate total revenue
    const totalRevenue = orders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
    
    // Calculate total units sold
    let totalUnits = 0;
    orders.forEach(order => {
        if (order.items) {
            order.items.forEach(item => {
                totalUnits += item.quantity || 0;
            });
        }
    });
    
    // Calculate total discount
    const totalDiscountAmount = orders.reduce((sum, order) => sum + (order.discountAmount || 0), 0);
    
    // Calculate total returns
    const totalReturnsAmount = productReturns.reduce((sum, ret) => sum + (ret.refundAmount || 0), 0);
    const returnCount = productReturns.length;
    
    // Calculate previous revenue
    const previousRevenue = previousOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);

    // Calculate derived metrics
    const netSales = totalRevenue - totalDiscountAmount;
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    const returnRate = totalOrders > 0 ? (returnCount / totalOrders) * 100 : 0;

    // Calculate trend percentage
    const revenueTrend = previousRevenue > 0 ? ((totalRevenue - previousRevenue) / previousRevenue) * 100 : 0;

    // Calculate gross profit from batches
    let totalCost = 0;
    
    for (const order of orders) {
        if (order.items) {
            for (const item of order.items) {
                let costPrice = 0;
                if (item.batchId) {
                    const batch = await findByIdBatchService(item.batchId);
                    if (batch && batch.purchasePrice) {
                        costPrice = batch.purchasePrice;
                    }
                }
                totalCost += costPrice * (item.quantity || 0);
            }
        }
    }
    
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

    // Calculate sales by payment method
    const salesByPaymentMethodMap = {};
    orders.forEach(order => {
        const method = order.paymentMethod || 'unknown';
        if (!salesByPaymentMethodMap[method]) {
            salesByPaymentMethodMap[method] = { total: 0, count: 0 };
        }
        salesByPaymentMethodMap[method].total += order.totalAmount || 0;
        salesByPaymentMethodMap[method].count += 1;
    });
    const salesByPaymentMethod = Object.entries(salesByPaymentMethodMap).map(([method, data]) => ({
        _id: method,
        total: data.total,
        count: data.count
    })).sort((a, b) => b.total - a.total);

    // Calculate sales by order type
    const salesByOrderTypeMap = {};
    orders.forEach(order => {
        const type = order.orderType || 'unknown';
        if (!salesByOrderTypeMap[type]) {
            salesByOrderTypeMap[type] = { total: 0, count: 0 };
        }
        salesByOrderTypeMap[type].total += order.totalAmount || 0;
        salesByOrderTypeMap[type].count += 1;
    });
    const salesByOrderType = Object.entries(salesByOrderTypeMap).map(([type, data]) => ({
        _id: type,
        total: data.total,
        count: data.count
    }));

    // Calculate sales by staff
    const salesByStaffMap = {};
    orders.forEach(order => {
        const staffId = order.staffId?.toString();
        const staff = staffList.find(s => s._id?.toString() === staffId);
        const staffName = staff?.name || 'Unknown';
        if (!salesByStaffMap[staffId]) {
            salesByStaffMap[staffId] = { id: staffId, name: staffName, total: 0, count: 0 };
        }
        salesByStaffMap[staffId].total += order.totalAmount || 0;
        salesByStaffMap[staffId].count += 1;
    });
    const salesByStaff = Object.values(salesByStaffMap).map(staff => ({
        _id: { id: staff.id, name: staff.name },
        total: staff.total,
        count: staff.count
    })).sort((a, b) => b.total - a.total);

    // Calculate top selling products
    const productSalesMap = {};
    for (const order of orders) {
        if (order.items) {
            for (const item of order.items) {
                const productId = item.product?.toString();
                const productName = item.name;
                const category = item.category;
                const quantity = item.quantity || 0;
                const lineTotal = item.lineTotal || (item.unitPrice * quantity);
                
                if (!productSalesMap[productId]) {
                    productSalesMap[productId] = {
                        productId,
                        name: productName,
                        category,
                        totalRevenue: 0,
                        totalUnits: 0,
                        count: 0,
                        totalCost: 0
                    };
                }
                
                productSalesMap[productId].totalRevenue += lineTotal;
                productSalesMap[productId].totalUnits += quantity;
                productSalesMap[productId].count += 1;
                
                // Get cost from batch
                if (item.batchId) {
                    const batch = await findByIdBatchService(item.batchId);
                    if (batch && batch.purchasePrice) {
                        productSalesMap[productId].totalCost += batch.purchasePrice * quantity;
                    }
                }
            }
        }
    }
    const topProducts = Object.values(productSalesMap)
        .map(p => ({
            _id: { productId: p.productId, name: p.name, category: p.category, costPrice: p.totalCost / p.totalUnits || 0 },
            totalRevenue: p.totalRevenue,
            totalUnits: p.totalUnits,
            count: p.count,
            totalCost: p.totalCost
        }))
        .sort((a, b) => b.totalRevenue - a.totalRevenue)
        .slice(0, 20);

    // Calculate sales by category
    const categorySalesMap = {};
    for (const order of orders) {
        if (order.items) {
            for (const item of order.items) {
                const category = item.category?.toString() || 'uncategorized';
                const lineTotal = item.lineTotal || (item.unitPrice * item.quantity);
                const quantity = item.quantity || 0;
                
                if (!categorySalesMap[category]) {
                    categorySalesMap[category] = { total: 0, count: 0, units: 0 };
                }
                categorySalesMap[category].total += lineTotal;
                categorySalesMap[category].count += 1;
                categorySalesMap[category].units += quantity;
            }
        }
    }
    const salesByCategory = Object.entries(categorySalesMap).map(([category, data]) => ({
        _id: category,
        total: data.total,
        count: data.count,
        units: data.units
    })).sort((a, b) => b.total - a.total);

    // Calculate sales by customer
    const customerSalesMap = {};
    orders.forEach(order => {
        const customerName = order.customerName || 'Walk-in';
        if (!customerSalesMap[customerName]) {
            customerSalesMap[customerName] = {
                total: 0,
                count: 0,
                orderType: order.orderType,
                lastPurchase: order.createdAt
            };
        }
        customerSalesMap[customerName].total += order.totalAmount || 0;
        customerSalesMap[customerName].count += 1;
        if (order.createdAt > customerSalesMap[customerName].lastPurchase) {
            customerSalesMap[customerName].lastPurchase = order.createdAt;
        }
    });
    const salesByCustomer = Object.entries(customerSalesMap).map(([name, data]) => ({
        _id: name,
        total: data.total,
        count: data.count,
        orderType: data.orderType,
        lastPurchase: data.lastPurchase
    })).sort((a, b) => b.total - a.total).slice(0, 20);

    // Calculate sales by date
    const salesByDateMap = {};
    orders.forEach(order => {
        const dateStr = new Date(order.createdAt).toISOString().split('T')[0];
        if (!salesByDateMap[dateStr]) {
            salesByDateMap[dateStr] = { total: 0, count: 0 };
        }
        salesByDateMap[dateStr].total += order.totalAmount || 0;
        salesByDateMap[dateStr].count += 1;
    });
    const salesByDate = Object.entries(salesByDateMap).map(([date, data]) => ({
        _id: date,
        total: data.total,
        count: data.count
    })).sort((a, b) => a._id.localeCompare(b._id));

    // Calculate previous sales by date
    const previousSalesByDateMap = {};
    previousOrders.forEach(order => {
        const dateStr = new Date(order.createdAt).toISOString().split('T')[0];
        if (!previousSalesByDateMap[dateStr]) {
            previousSalesByDateMap[dateStr] = { total: 0, count: 0 };
        }
        previousSalesByDateMap[dateStr].total += order.totalAmount || 0;
        previousSalesByDateMap[dateStr].count += 1;
    });
    const previousSalesByDate = Object.entries(previousSalesByDateMap).map(([date, data]) => ({
        _id: date,
        total: data.total,
        count: data.count
    })).sort((a, b) => a._id.localeCompare(b._id));

    // Calculate cash collected
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

    const purchaseFilter = { ...dateFilter };
    const previousPurchaseFilter = compareWithPrevious ? { ...previousDateFilter } : null;

    // Fetch all data using service functions
    const [purchases, purchaseReturns, supplierList, previousPurchases] = await Promise.all([
        findPurchaseService(purchaseFilter),
        findPurchaseReturnService(purchaseFilter),
        findSupplierService({ isActive: true }).select("name type email phone address"),
        previousPurchaseFilter ? findPurchaseService(previousPurchaseFilter) : []
    ]);

    const totalPurchaseOrders = purchases.length;
    
    // Calculate total amount purchased
    const totalAmount = purchases.reduce((sum, purchase) => sum + (purchase.totalAmount || 0), 0);
    
    // Calculate total items received
    let totalItemsReceived = 0;
    purchases.forEach(purchase => {
        if (purchase.status === "delivered" && purchase.items) {
            purchase.items.forEach(item => {
                totalItemsReceived += item.quantity || 0;
            });
        }
    });
    
    // Calculate total unpaid amount
    const totalUnpaid = purchases.reduce((sum, purchase) => {
        return sum + ((purchase.totalAmount || 0) - (purchase.paidAmount || 0));
    }, 0);
    
    // Calculate total purchase returns
    const totalPurchaseReturns = purchaseReturns.reduce((sum, ret) => sum + (ret.totalAmount || 0), 0);
    
    // Calculate previous total
    const previousTotalAmount = previousPurchases.reduce((sum, purchase) => sum + (purchase.totalAmount || 0), 0);
    
    const purchaseTrend = previousTotalAmount > 0 ? ((totalAmount - previousTotalAmount) / previousTotalAmount * 100).toFixed(1) : 0;
    const averageOrderValue = totalPurchaseOrders > 0 ? totalAmount / totalPurchaseOrders : 0;

    // Calculate purchases by supplier
    const purchasesBySupplierMap = {};
    purchases.forEach(purchase => {
        const supplierId = purchase.supplier?.toString();
        if (!supplierId) return;
        
        if (!purchasesBySupplierMap[supplierId]) {
            purchasesBySupplierMap[supplierId] = {
                supplierId,
                supplierName: purchase.supplierName || 'Unknown',
                total: 0,
                count: 0,
                totalItems: 0,
                unpaid: 0
            };
        }
        
        purchasesBySupplierMap[supplierId].total += purchase.totalAmount || 0;
        purchasesBySupplierMap[supplierId].count += 1;
        purchasesBySupplierMap[supplierId].unpaid += (purchase.totalAmount || 0) - (purchase.paidAmount || 0);
        
        if (purchase.items) {
            purchase.items.forEach(item => {
                purchasesBySupplierMap[supplierId].totalItems += item.quantity || 0;
            });
        }
    });
    
    const purchasesBySupplier = Object.values(purchasesBySupplierMap).sort((a, b) => b.total - a.total);

    // Calculate purchases by date
    const purchasesByDateMap = {};
    purchases.forEach(purchase => {
        const dateStr = new Date(purchase.createdAt).toISOString().split('T')[0];
        if (!purchasesByDateMap[dateStr]) {
            purchasesByDateMap[dateStr] = { total: 0, count: 0 };
        }
        purchasesByDateMap[dateStr].total += purchase.totalAmount || 0;
        purchasesByDateMap[dateStr].count += 1;
    });
    const purchasesByDate = Object.entries(purchasesByDateMap).map(([date, data]) => ({
        _id: date,
        total: data.total,
        count: data.count
    })).sort((a, b) => a._id.localeCompare(b._id));

    // Calculate previous purchases by date
    const previousPurchasesByDateMap = {};
    previousPurchases.forEach(purchase => {
        const dateStr = new Date(purchase.createdAt).toISOString().split('T')[0];
        if (!previousPurchasesByDateMap[dateStr]) {
            previousPurchasesByDateMap[dateStr] = { total: 0, count: 0 };
        }
        previousPurchasesByDateMap[dateStr].total += purchase.totalAmount || 0;
        previousPurchasesByDateMap[dateStr].count += 1;
    });
    const previousPurchasesByDate = Object.entries(previousPurchasesByDateMap).map(([date, data]) => ({
        _id: date,
        total: data.total,
        count: data.count
    })).sort((a, b) => a._id.localeCompare(b._id));

    // Calculate purchase returns by supplier
    const purchaseReturnsBySupplierMap = {};
    purchaseReturns.forEach(ret => {
        const supplierId = ret.supplier?.toString();
        if (!supplierId) return;
        
        if (!purchaseReturnsBySupplierMap[supplierId]) {
            purchaseReturnsBySupplierMap[supplierId] = {
                supplierId,
                supplierName: ret.supplierName || 'Unknown',
                total: 0,
                count: 0
            };
        }
        
        purchaseReturnsBySupplierMap[supplierId].total += ret.totalAmount || 0;
        purchaseReturnsBySupplierMap[supplierId].count += 1;
    });
    
    const purchaseReturnsBySupplier = Object.values(purchaseReturnsBySupplierMap).sort((a, b) => b.total - a.total);

    return {
        summary: {
            totalAmountPurchased: totalAmount,
            totalPurchaseOrders,
            totalItemsReceived,
            totalUnpaid,
            averageOrderValue,
            totalPurchaseReturns,
            purchaseTrend
        },
        breakdowns: {
            bySupplier: purchasesBySupplier.map(item => ({
                supplierId: item.supplierId,
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
                supplierId: item.supplierId,
                supplierName: item.supplierName,
                total: item.total,
                count: item.count,
                percentage: totalPurchaseReturns > 0 ? ((item.total / totalPurchaseReturns) * 100).toFixed(1) : 0
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

    const purchaseFilter = { ...dateFilter };
    const previousPurchaseFilter = compareWithPrevious ? { ...previousDateFilter } : null;

    // Fetch all data using service functions
    const [allSuppliers, activeSuppliersList, purchases, purchaseReturns, previousPurchases] = await Promise.all([
        countSupplierService({}),
        countSupplierService({ isActive: true }),
        findPurchaseService(purchaseFilter),
        findPurchaseReturnService(purchaseFilter),
        previousPurchaseFilter ? findPurchaseService(previousPurchaseFilter) : []
    ]);

    const totalSuppliers = allSuppliers;
    const activeSuppliers = activeSuppliersList;
    const totalPurchases = purchases.length;
    
    // Calculate total purchase amount
    const totalAmount = purchases.reduce((sum, purchase) => sum + (purchase.totalAmount || 0), 0);
    
    // Calculate total unpaid
    const totalUnpaid = purchases.reduce((sum, purchase) => {
        return sum + ((purchase.totalAmount || 0) - (purchase.paidAmount || 0));
    }, 0);
    
    // Calculate total returns
    const totalReturns = purchaseReturns.reduce((sum, ret) => sum + (ret.totalAmount || 0), 0);
    
    // Calculate previous total
    const previousTotalAmount = previousPurchases.reduce((sum, purchase) => sum + (purchase.totalAmount || 0), 0);
    
    const purchaseTrend = previousTotalAmount > 0 ? ((totalAmount - previousTotalAmount) / previousTotalAmount * 100).toFixed(1) : 0;
    const averageOrderValue = totalPurchases > 0 ? totalAmount / totalPurchases : 0;

    // Calculate supplier performance
    const supplierPerformanceMap = {};
    purchases.forEach(purchase => {
        const supplierId = purchase.supplier?.toString();
        if (!supplierId) return;
        
        if (!supplierPerformanceMap[supplierId]) {
            supplierPerformanceMap[supplierId] = {
                supplierId,
                supplierName: purchase.supplierName || 'Unknown',
                supplierType: purchase.supplierType,
                totalOrders: 0,
                totalSpent: 0
            };
        }
        
        supplierPerformanceMap[supplierId].totalOrders += 1;
        supplierPerformanceMap[supplierId].totalSpent += purchase.totalAmount || 0;
    });
    
    const supplierPerformance = Object.values(supplierPerformanceMap).sort((a, b) => b.totalSpent - a.totalSpent);

    // Calculate supplier purchase history
    const supplierPurchaseHistory = purchases.map(purchase => ({
        _id: purchase._id,
        invoiceNumber: purchase.invoiceNumber,
        date: purchase.createdAt,
        supplierName: purchase.supplierName,
        supplierId: purchase.supplier,
        totalAmount: purchase.totalAmount,
        status: purchase.status,
        paymentStatus: purchase.paymentStatus,
        paidAmount: purchase.paidAmount,
        itemCount: purchase.items?.length || 0
    })).sort((a, b) => new Date(b.date) - new Date(a.date));

    // Calculate supplier returns
    const supplierReturnsMap = {};
    purchaseReturns.forEach(ret => {
        const supplierId = ret.supplier?.toString();
        if (!supplierId) return;
        
        if (!supplierReturnsMap[supplierId]) {
            supplierReturnsMap[supplierId] = {
                supplierId,
                supplierName: ret.supplierName || 'Unknown',
                totalReturns: 0,
                returnCount: 0
            };
        }
        
        supplierReturnsMap[supplierId].totalReturns += ret.totalAmount || 0;
        supplierReturnsMap[supplierId].returnCount += 1;
    });
    
    const supplierReturns = Object.values(supplierReturnsMap).sort((a, b) => b.totalReturns - a.totalReturns);

    // Calculate supplier payment status
    const supplierPaymentStatusMap = {};
    purchases.forEach(purchase => {
        const supplierId = purchase.supplier?.toString();
        if (!supplierId) return;
        
        if (!supplierPaymentStatusMap[supplierId]) {
            supplierPaymentStatusMap[supplierId] = {
                supplierId,
                supplierName: purchase.supplierName || 'Unknown',
                totalInvoiced: 0,
                totalPaid: 0,
                outstandingBalance: 0,
                orderCount: 0
            };
        }
        
        supplierPaymentStatusMap[supplierId].totalInvoiced += purchase.totalAmount || 0;
        supplierPaymentStatusMap[supplierId].totalPaid += purchase.paidAmount || 0;
        supplierPaymentStatusMap[supplierId].outstandingBalance += (purchase.totalAmount || 0) - (purchase.paidAmount || 0);
        supplierPaymentStatusMap[supplierId].orderCount += 1;
    });
    
    const supplierPaymentStatus = Object.values(supplierPaymentStatusMap).sort((a, b) => b.outstandingBalance - a.outstandingBalance);

    return {
        summary: {
            totalSuppliers,
            activeSuppliers,
            totalPurchaseOrders: totalPurchases,
            totalPurchaseAmount: totalAmount,
            totalUnpaid,
            totalReturns,
            averageOrderValue,
            purchaseTrend
        },
        breakdowns: {
            supplierPerformance: supplierPerformance.map(s => ({
                supplierId: s.supplierId,
                supplierName: s.supplierName,
                supplierType: s.supplierType,
                totalOrders: s.totalOrders,
                totalSpent: s.totalSpent,
                averageOrderValue: s.totalOrders > 0 ? s.totalSpent / s.totalOrders : 0,
                performanceRating: s.totalOrders > 10 ? 'High' : s.totalOrders > 5 ? 'Medium' : 'Low'
            })),
            purchaseHistory: supplierPurchaseHistory,
            returnsBySupplier: supplierReturns.map(r => ({
                supplierId: r.supplierId,
                supplierName: r.supplierName,
                totalReturns: r.totalReturns,
                returnCount: r.returnCount
            })),
            paymentStatus: supplierPaymentStatus.map(p => ({
                supplierId: p.supplierId,
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

    const orderFilter = { ...dateFilter, status: "completed" };
    const previousOrderFilter = compareWithPrevious ? { ...previousDateFilter, status: "completed" } : null;

    // Fetch all data using service functions
    const [allCustomers, allOrders, productReturns, previousOrders] = await Promise.all([
        countCustomerService({}),
        findOrderService(orderFilter),
        findProductReturnService(dateFilter),
        previousOrderFilter ? findOrderService(previousOrderFilter) : []
    ]);

    // Calculate active customers (with orders in last 90 days)
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    const activeCustomers = await countCustomerService({ lastPurchaseDate: { $gte: ninetyDaysAgo } });

    const totalOrders = allOrders.length;
    
    // Calculate total sales
    const totalAmount = allOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
    
    // Calculate total unpaid (credit)
    const totalUnpaid = allOrders
        .filter(o => o.paymentMethod === "credit")
        .reduce((sum, order) => sum + (order.totalAmount || 0), 0);
    
    // Calculate total returns
    const totalReturns = productReturns.reduce((sum, ret) => sum + (ret.totalAmount || 0), 0);
    
    // Calculate previous total
    const previousTotalAmount = previousOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
    
    const salesTrend = previousTotalAmount > 0 ? ((totalAmount - previousTotalAmount) / previousTotalAmount * 100).toFixed(1) : 0;
    const averageOrderValue = totalOrders > 0 ? totalAmount / totalOrders : 0;

    // Calculate customer performance
    const customerPerformanceMap = {};
    allOrders.forEach(order => {
        const customerId = order.customer?.toString();
        if (!customerId) return;
        
        if (!customerPerformanceMap[customerId]) {
            customerPerformanceMap[customerId] = {
                customerId,
                customerName: order.customerName || 'Unknown',
                totalOrders: 0,
                totalSpent: 0,
                lastPurchaseDate: order.createdAt
            };
        }
        
        customerPerformanceMap[customerId].totalOrders += 1;
        customerPerformanceMap[customerId].totalSpent += order.totalAmount || 0;
        if (order.createdAt > customerPerformanceMap[customerId].lastPurchaseDate) {
            customerPerformanceMap[customerId].lastPurchaseDate = order.createdAt;
        }
    });
    
    const customerPerformance = Object.values(customerPerformanceMap).sort((a, b) => b.totalSpent - a.totalSpent);

    // Calculate customer purchase history
    const customerPurchaseHistory = allOrders.map(order => ({
        _id: order._id,
        orderNumber: order.orderNumber,
        createdAt: order.createdAt,
        customerName: order.customerName,
        customerId: order.customer,
        totalAmount: order.totalAmount,
        paymentMethod: order.paymentMethod,
        orderType: order.orderType,
        itemCount: order.items?.length || 0
    })).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    // Calculate customer returns
    const customerReturnsMap = {};
    productReturns.forEach(ret => {
        const customerId = ret.customer?.toString();
        if (!customerId) return;
        
        if (!customerReturnsMap[customerId]) {
            customerReturnsMap[customerId] = {
                customerId,
                customerName: ret.customerName || 'Unknown',
                totalReturns: 0,
                returnCount: 0
            };
        }
        
        customerReturnsMap[customerId].totalReturns += ret.totalAmount || 0;
        customerReturnsMap[customerId].returnCount += 1;
    });
    
    const customerReturns = Object.values(customerReturnsMap).sort((a, b) => b.totalReturns - a.totalReturns);

    // Calculate customer payment status (receivables)
    const customerPaymentStatusMap = {};
    allOrders.forEach(order => {
        if (order.paymentMethod !== "credit") return;
        
        const customerId = order.customer?.toString();
        if (!customerId) return;
        
        if (!customerPaymentStatusMap[customerId]) {
            customerPaymentStatusMap[customerId] = {
                customerId,
                customerName: order.customerName || 'Unknown',
                totalCredit: 0,
                orderCount: 0
            };
        }
        
        customerPaymentStatusMap[customerId].totalCredit += order.totalAmount || 0;
        customerPaymentStatusMap[customerId].orderCount += 1;
    });
    
    const customerPaymentStatus = Object.values(customerPaymentStatusMap).sort((a, b) => b.totalCredit - a.totalCredit);

    return {
        summary: {
            totalCustomers: allCustomers,
            activeCustomers,
            totalOrders,
            totalSales: totalAmount,
            totalUnpaid,
            totalReturns,
            averageOrderValue,
            salesTrend
        },
        breakdowns: {
            customerPerformance: customerPerformance.map(c => ({
                customerId: c.customerId,
                customerName: c.customerName,
                totalOrders: c.totalOrders,
                totalSpent: c.totalSpent,
                averageOrderValue: c.totalOrders > 0 ? c.totalSpent / c.totalOrders : 0,
                lastPurchaseDate: c.lastPurchaseDate,
                customerSegment: c.totalSpent > 100000 ? 'VIP' : c.totalSpent > 50000 ? 'Premium' : c.totalSpent > 10000 ? 'Regular' : 'One-time'
            })),
            purchaseHistory: customerPurchaseHistory,
            returnsByCustomer: customerReturns.map(r => ({
                customerId: r.customerId,
                customerName: r.customerName,
                totalReturns: r.totalReturns,
                returnCount: r.returnCount
            })),
            paymentStatus: customerPaymentStatus.map(p => ({
                customerId: p.customerId,
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

    // Fetch all data using service functions
    const [expenses, expenseCount] = await Promise.all([
        findExpenseService(dateFilter),
        countExpenseService(dateFilter)
    ]);

    // Calculate total expenses
    const totalAmount = expenses.reduce((sum, expense) => sum + (expense.amount || 0), 0);
    const averageExpense = expenseCount > 0 ? totalAmount / expenseCount : 0;

    // Calculate expenses by category
    const expensesByCategoryMap = {};
    expenses.forEach(expense => {
        const category = expense.category || 'uncategorized';
        if (!expensesByCategoryMap[category]) {
            expensesByCategoryMap[category] = { total: 0, count: 0 };
        }
        expensesByCategoryMap[category].total += expense.amount || 0;
        expensesByCategoryMap[category].count += 1;
    });
    const expensesByCategory = Object.entries(expensesByCategoryMap).map(([category, data]) => ({
        _id: category,
        total: data.total,
        count: data.count
    })).sort((a, b) => b.total - a.total);

    // Calculate expenses by type
    const expensesByTypeMap = {};
    expenses.forEach(expense => {
        const type = expense.type || 'unknown';
        if (!expensesByTypeMap[type]) {
            expensesByTypeMap[type] = { total: 0, count: 0 };
        }
        expensesByTypeMap[type].total += expense.amount || 0;
        expensesByTypeMap[type].count += 1;
    });
    const expensesByType = Object.entries(expensesByTypeMap).map(([type, data]) => ({
        _id: type,
        total: data.total,
        count: data.count
    })).sort((a, b) => b.total - a.total);

    // Find highest and lowest expenses
    const sortedByAmount = [...expenses].sort((a, b) => (b.amount || 0) - (a.amount || 0));
    const highestExpense = sortedByAmount[0] || null;
    const lowestExpense = sortedByAmount[sortedByAmount.length - 1] || null;

    // Get expense list (limited to 100, sorted by createdAt desc)
    const expenseList = expenses
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 100)
        .map(expense => ({
            _id: expense._id,
            amount: expense.amount,
            type: expense.type,
            date: expense.date || expense.createdAt,
            notes: expense.notes,
            category: expense.category,
            createdAt: expense.createdAt
        }));

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
    } else if (period === "last3months" || period === "3month") {
        const now = new Date();
        const startOfLast3Months = new Date(now.getFullYear(), now.getMonth() - 2, 1);
        const endOfLast3Months = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        dateFilter = { createdAt: { $gte: startOfLast3Months, $lte: endOfLast3Months } };
    } else if (period === "year") {
        const now = new Date();
        const startOfYear = new Date(now.getFullYear(), 0, 1);
        const endOfYear = new Date(now.getFullYear(), 11, 31);
        dateFilter = { createdAt: { $gte: startOfYear, $lte: endOfYear } };
    } else {
        // Default to current month if period is unrecognized
        const { startOfMonth, endOfMonth } = getMonthRange();
        dateFilter = { createdAt: { $gte: startOfMonth, $lte: endOfMonth } };
    }

    // Calculate previous period date filter for comparison
    let previousDateFilter = {};
    if (period === "today") {
        const { startOfDay, endOfDay } = getYesterdayRange();
        previousDateFilter = { createdAt: { $gte: startOfDay, $lte: endOfDay } };
    } else if (period === "yesterday") {
        const now = new Date();
        const dayBeforeYesterday = new Date(now);
        dayBeforeYesterday.setDate(dayBeforeYesterday.getDate() - 2);
        const startOfDay = new Date(dayBeforeYesterday);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(dayBeforeYesterday);
        endOfDay.setHours(23, 59, 59, 999);
        previousDateFilter = { createdAt: { $gte: startOfDay, $lte: endOfDay } };
    } else if (period === "week") {
        const now = new Date();
        const startOfLastWeek = new Date(now);
        startOfLastWeek.setDate(startOfLastWeek.getDate() - 7 - startOfLastWeek.getDay());
        const endOfLastWeek = new Date(startOfLastWeek);
        endOfLastWeek.setDate(endOfLastWeek.getDate() + 6);
        previousDateFilter = { createdAt: { $gte: startOfLastWeek, $lte: endOfLastWeek } };
    } else if (period === "month") {
        const now = new Date();
        const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
        previousDateFilter = { createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth } };
    } else if (period === "last3months" || period === "3month") {
        const now = new Date();
        const startOfPrevious3Months = new Date(now.getFullYear(), now.getMonth() - 5, 1);
        const endOfPrevious3Months = new Date(now.getFullYear(), now.getMonth() - 3, 0);
        previousDateFilter = { createdAt: { $gte: startOfPrevious3Months, $lte: endOfPrevious3Months } };
    } else if (period === "year") {
        const now = new Date();
        const startOfLastYear = new Date(now.getFullYear() - 1, 0, 1);
        const endOfLastYear = new Date(now.getFullYear() - 1, 11, 31);
        previousDateFilter = { createdAt: { $gte: startOfLastYear, $lte: endOfLastYear } };
    } else if (period === "custom" && fromDate && toDate) {
        // For custom range, calculate same duration period before
        const start = new Date(fromDate);
        const end = new Date(toDate);
        const duration = end.getTime() - start.getTime();
        const previousStart = new Date(start.getTime() - duration);
        const previousEnd = new Date(end.getTime() - duration);
        previousDateFilter = { createdAt: { $gte: previousStart, $lte: previousEnd } };
    }

    // Fetch current period data using service functions
    const [orders, purchases, expenses, wastages, purchaseReturns, productReturns, salaryPayments, qarzaReceivable, qarzaPayable, staffList] = await Promise.all([
        findOrderService({ ...dateFilter, status: "completed" }),
        findPurchaseService(dateFilter),
        findExpenseService(dateFilter),
        findWastageService(dateFilter),
        findPurchaseReturnService(dateFilter),
        findProductReturnService(dateFilter),
        findStaffSalaryPaymentService({ ...dateFilter, status: 'paid' }),
        findQarzaAccountService({ ...dateFilter, type: "receivable" }),
        findQarzaAccountService({ ...dateFilter, type: "payable" }),
        findStaffService({})
    ]);

    // Fetch previous period data for comparison
    const [previousOrders, previousPurchases, previousExpenses, previousWastages, previousPurchaseReturns, previousProductReturns, previousSalaryPayments] = await Promise.all([
        findOrderService({ ...previousDateFilter, status: "completed" }),
        findPurchaseService(previousDateFilter),
        findExpenseService(previousDateFilter),
        findWastageService(previousDateFilter),
        findPurchaseReturnService(previousDateFilter),
        findProductReturnService(previousDateFilter),
        findStaffSalaryPaymentService({ ...previousDateFilter, status: 'paid' })
    ]);

    // Calculate current period totals
    const totalSales = orders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
    const totalDiscount = orders.reduce((sum, order) => sum + (order.discountAmount || 0), 0);
    const salesCount = orders.length;

    const totalPurchases = purchases.reduce((sum, purchase) => sum + (purchase.totalAmount || 0), 0);
    const purchaseCount = purchases.length;

    const totalExpenses = expenses.reduce((sum, expense) => sum + (expense.amount || 0), 0);
    const expenseCount = expenses.length;

    const totalWastage = wastages.reduce((sum, wastage) => sum + ((wastage.quantity || 0) * (wastage.costPrice || 0)), 0);
    const wastageCount = wastages.length;

    const totalPurchaseReturns = purchaseReturns.reduce((sum, ret) => sum + (ret.totalAmount || 0), 0);
    const purchaseReturnCount = purchaseReturns.length;

    const totalProductReturns = productReturns.reduce((sum, ret) => sum + (ret.refundAmount || 0), 0);
    const productReturnCount = productReturns.length;

    const totalSalaries = salaryPayments.reduce((sum, payment) => sum + (payment.amount || 0), 0);
    const salaryPaymentCount = salaryPayments.length;

    const totalReceivable = qarzaReceivable.reduce((sum, q) => sum + (q.balance || 0), 0);
    const qarzaReceivableCount = qarzaReceivable.length;

    const totalPayable = qarzaPayable.reduce((sum, q) => sum + (q.balance || 0), 0);
    const qarzaPayableCount = qarzaPayable.length;

    const grossProfit = totalSales - totalPurchases;
    const grossMarginPercentage = totalSales > 0 ? Number(((grossProfit / totalSales) * 100).toFixed(1)) : 0;
    const netProfit = totalSales - totalPurchases - totalExpenses - totalWastage - totalSalaries - totalProductReturns + totalPurchaseReturns;
    const netMarginPercentage = totalSales > 0 ? Number(((netProfit / totalSales) * 100).toFixed(1)) : 0;

    // Calculate previous period totals
    const previousTotalSales = previousOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
    const previousSalesCount = previousOrders.length;

    const previousTotalPurchases = previousPurchases.reduce((sum, purchase) => sum + (purchase.totalAmount || 0), 0);
    const previousPurchaseCount = previousPurchases.length;

    const previousTotalExpenses = previousExpenses.reduce((sum, expense) => sum + (expense.amount || 0), 0);
    const previousExpenseCount = previousExpenses.length;

    const previousTotalWastage = previousWastages.reduce((sum, wastage) => sum + ((wastage.quantity || 0) * (wastage.costPrice || 0)), 0);
    const previousWastageCount = previousWastages.length;

    const previousTotalPurchaseReturns = previousPurchaseReturns.reduce((sum, ret) => sum + (ret.totalAmount || 0), 0);
    const previousPurchaseReturnCount = previousPurchaseReturns.length;

    const previousTotalProductReturns = previousProductReturns.reduce((sum, ret) => sum + (ret.refundAmount || 0), 0);
    const previousProductReturnCount = previousProductReturns.length;

    const previousTotalSalaries = previousSalaryPayments.reduce((sum, payment) => sum + (payment.amount || 0), 0);
    const previousSalaryPaymentCount = previousSalaryPayments.length;

    const previousGrossProfit = previousTotalSales - previousTotalPurchases;
    const previousGrossMarginPercentage = previousTotalSales > 0 ? Number(((previousGrossProfit / previousTotalSales) * 100).toFixed(1)) : 0;
    const previousNetProfit = previousTotalSales - previousTotalPurchases - previousTotalExpenses - previousTotalWastage - previousTotalSalaries - previousTotalProductReturns + previousTotalPurchaseReturns;
    const previousNetMarginPercentage = previousTotalSales > 0 ? Number(((previousNetProfit / previousTotalSales) * 100).toFixed(1)) : 0;

    // Calculate percentage changes
    const calculateChange = (current, previous) => {
        if (previous === 0) return current > 0 ? 100 : 0;
        return Number(((current - previous) / previous * 100).toFixed(1));
    };

    const salesChange = calculateChange(totalSales, previousTotalSales);
    const salesCountChange = calculateChange(salesCount, previousSalesCount);
    const purchasesChange = calculateChange(totalPurchases, previousTotalPurchases);
    const purchaseCountChange = calculateChange(purchaseCount, previousPurchaseCount);
    const expensesChange = calculateChange(totalExpenses, previousTotalExpenses);
    const expenseCountChange = calculateChange(expenseCount, previousExpenseCount);
    const wastageChange = calculateChange(totalWastage, previousTotalWastage);
    const wastageCountChange = calculateChange(wastageCount, previousWastageCount);
    const purchaseReturnsChange = calculateChange(totalPurchaseReturns, previousTotalPurchaseReturns);
    const purchaseReturnCountChange = calculateChange(purchaseReturnCount, previousPurchaseReturnCount);
    const productReturnsChange = calculateChange(totalProductReturns, previousTotalProductReturns);
    const productReturnCountChange = calculateChange(productReturnCount, previousProductReturnCount);
    const salariesChange = calculateChange(totalSalaries, previousTotalSalaries);
    const salaryPaymentCountChange = calculateChange(salaryPaymentCount, previousSalaryPaymentCount);
    const grossProfitChange = calculateChange(grossProfit, previousGrossProfit);
    const grossMarginChange = calculateChange(grossMarginPercentage, previousGrossMarginPercentage);
    const netProfitChange = calculateChange(netProfit, previousNetProfit);
    const netMarginChange = calculateChange(netMarginPercentage, previousNetMarginPercentage);

    // Calculate sales by payment method
    const salesByPaymentMethodMap = {};
    orders.forEach(order => {
        const method = order.paymentMethod || 'unknown';
        if (!salesByPaymentMethodMap[method]) {
            salesByPaymentMethodMap[method] = { total: 0, count: 0 };
        }
        salesByPaymentMethodMap[method].total += order.totalAmount || 0;
        salesByPaymentMethodMap[method].count += 1;
    });
    const salesByPaymentMethod = Object.entries(salesByPaymentMethodMap).map(([method, data]) => ({
        _id: method,
        total: data.total,
        count: data.count
    }));

    // Calculate expenses by category
    const expensesByCategoryMap = {};
    expenses.forEach(expense => {
        const category = expense.category || 'uncategorized';
        if (!expensesByCategoryMap[category]) {
            expensesByCategoryMap[category] = { total: 0, count: 0 };
        }
        expensesByCategoryMap[category].total += expense.amount || 0;
        expensesByCategoryMap[category].count += 1;
    });
    const expensesByCategory = Object.entries(expensesByCategoryMap).map(([category, data]) => ({
        _id: category,
        total: data.total,
        count: data.count
    }));

    // Calculate product returns by reason
    const productReturnsByReasonMap = {};
    productReturns.forEach(ret => {
        const reason = ret.reason || 'unknown';
        if (!productReturnsByReasonMap[reason]) {
            productReturnsByReasonMap[reason] = { total: 0, count: 0 };
        }
        productReturnsByReasonMap[reason].total += ret.refundAmount || 0;
        productReturnsByReasonMap[reason].count += 1;
    });
    const productReturnsByReason = Object.entries(productReturnsByReasonMap).map(([reason, data]) => ({
        _id: reason,
        total: data.total,
        count: data.count
    }));

    // Calculate purchase returns by supplier
    const purchaseReturnsBySupplierMap = {};
    purchaseReturns.forEach(ret => {
        const supplierName = ret.supplierName || 'unknown';
        if (!purchaseReturnsBySupplierMap[supplierName]) {
            purchaseReturnsBySupplierMap[supplierName] = { total: 0, count: 0 };
        }
        purchaseReturnsBySupplierMap[supplierName].total += ret.totalAmount || 0;
        purchaseReturnsBySupplierMap[supplierName].count += 1;
    });
    const purchaseReturnsBySupplier = Object.entries(purchaseReturnsBySupplierMap).map(([supplierName, data]) => ({
        _id: supplierName,
        total: data.total,
        count: data.count
    }));

    // Calculate wastages by product
    const wastagesByProductMap = {};
    wastages.forEach(wastage => {
        const productName = wastage.productName || 'unknown';
        if (!wastagesByProductMap[productName]) {
            wastagesByProductMap[productName] = { total: 0, count: 0, totalQuantity: 0 };
        }
        wastagesByProductMap[productName].total += (wastage.quantity || 0) * (wastage.costPrice || 0);
        wastagesByProductMap[productName].count += 1;
        wastagesByProductMap[productName].totalQuantity += wastage.quantity || 0;
    });
    const wastagesByProduct = Object.entries(wastagesByProductMap).map(([productName, data]) => ({
        _id: productName,
        total: data.total,
        count: data.count,
        totalQuantity: data.totalQuantity
    }));

    // Calculate salaries by staff
    const salariesByStaffMap = {};
    salaryPayments.forEach(payment => {
        const staffId = payment.staffId?.toString();
        const staff = staffList.find(s => s._id?.toString() === staffId);
        const staffName = staff?.name || 'unknown';
        if (!salariesByStaffMap[staffName]) {
            salariesByStaffMap[staffName] = { total: 0, count: 0 };
        }
        salariesByStaffMap[staffName].total += payment.amount || 0;
        salariesByStaffMap[staffName].count += 1;
    });
    const salariesByStaff = Object.entries(salariesByStaffMap).map(([staffName, data]) => ({
        _id: staffName,
        total: data.total,
        count: data.count
    }));

    // Get transaction lists (limited to 100, sorted by createdAt desc)
    const salesList = orders
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 100)
        .map(order => ({
            _id: order._id,
            orderNumber: order.orderNumber,
            totalAmount: order.totalAmount,
            paymentMethod: order.paymentMethod,
            customerName: order.customerName,
            createdAt: order.createdAt
        }));

    const purchasesList = purchases
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 100)
        .map(purchase => ({
            _id: purchase._id,
            invoiceNumber: purchase.invoiceNumber,
            totalAmount: purchase.totalAmount,
            supplierName: purchase.supplierName,
            createdAt: purchase.createdAt
        }));

    const expensesList = expenses
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 100)
        .map(expense => ({
            _id: expense._id,
            title: expense.title,
            amount: expense.amount,
            category: expense.category,
            description: expense.description,
            createdAt: expense.createdAt
        }));

    const wastagesList = wastages
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 100)
        .map(wastage => ({
            _id: wastage._id,
            quantity: wastage.quantity,
            costPrice: wastage.costPrice,
            productName: wastage.productName,
            createdAt: wastage.createdAt
        }));

    const purchaseReturnsList = purchaseReturns
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 100)
        .map(ret => ({
            _id: ret._id,
            returnNumber: ret.returnNumber,
            totalAmount: ret.totalAmount,
            supplierName: ret.supplierName,
            createdAt: ret.createdAt
        }));

    const productReturnsList = productReturns
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 100)
        .map(ret => ({
            _id: ret._id,
            returnNumber: ret.returnNumber,
            refundAmount: ret.refundAmount,
            customerName: ret.customerName,
            createdAt: ret.createdAt
        }));

    const salaryPaymentsList = salaryPayments
        .sort((a, b) => new Date(b.paidAt) - new Date(a.paidAt))
        .slice(0, 100)
        .map(payment => {
            const staffId = payment.staffId?.toString();
            const staff = staffList.find(s => s._id?.toString() === staffId);
            return {
                _id: payment._id,
                amount: payment.amount,
                staffId: payment.staffId,
                staffName: staff?.name || 'Unknown',
                paidAt: payment.paidAt
            };
        });

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
            salesCount,
            purchaseCount,
            expenseCount,
            wastageCount,
            purchaseReturnCount,
            productReturnCount,
            salaryPaymentCount,
            qarzaReceivableCount,
            qarzaPayableCount,
        },
        comparison: {
            previous: {
                totalSales: previousTotalSales,
                salesCount: previousSalesCount,
                totalPurchases: previousTotalPurchases,
                purchaseCount: previousPurchaseCount,
                totalExpenses: previousTotalExpenses,
                expenseCount: previousExpenseCount,
                totalWastage: previousTotalWastage,
                wastageCount: previousWastageCount,
                totalPurchaseReturns: previousTotalPurchaseReturns,
                purchaseReturnCount: previousPurchaseReturnCount,
                totalProductReturns: previousTotalProductReturns,
                productReturnCount: previousProductReturnCount,
                totalSalaries: previousTotalSalaries,
                salaryPaymentCount: previousSalaryPaymentCount,
                grossProfit: previousGrossProfit,
                grossMarginPercentage: previousGrossMarginPercentage,
                netProfit: previousNetProfit,
                netMarginPercentage: previousNetMarginPercentage,
            },
            changes: {
                salesChange,
                salesCountChange,
                purchasesChange,
                purchaseCountChange,
                expensesChange,
                expenseCountChange,
                wastageChange,
                wastageCountChange,
                purchaseReturnsChange,
                purchaseReturnCountChange,
                productReturnsChange,
                productReturnCountChange,
                salariesChange,
                salaryPaymentCountChange,
                grossProfitChange,
                grossMarginChange,
                netProfitChange,
                netMarginChange,
            }
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
                staffName: payment.staffName,
                date: payment.paidAt
            }))
        }
    };
};

// Financial Report
export const getFinancialReport = async (filters = {}) => {
    const { fromDate, toDate, page = 1, limit = 20 } = filters;

    const dateFilter = buildDateFilter(fromDate, toDate);

    // Get sales, purchases, and expenses using service functions
    const [orders, purchaseData, expenseData] = await Promise.all([
        findOrderService({ ...dateFilter, status: "completed" }),
        findPurchaseService(dateFilter),
        findExpenseService(dateFilter)
    ]);

    // Group sales by date
    const salesByDateMap = {};
    orders.forEach(order => {
        const dateStr = new Date(order.createdAt).toISOString().split('T')[0];
        if (!salesByDateMap[dateStr]) {
            salesByDateMap[dateStr] = { totalSales: 0, totalDiscount: 0, count: 0 };
        }
        salesByDateMap[dateStr].totalSales += order.totalAmount || 0;
        salesByDateMap[dateStr].totalDiscount += order.discountAmount || 0;
        salesByDateMap[dateStr].count += 1;
    });
    const sales = Object.entries(salesByDateMap).map(([date, data]) => ({
        _id: date,
        totalSales: data.totalSales,
        totalDiscount: data.totalDiscount,
        count: data.count
    })).sort((a, b) => a._id.localeCompare(b._id));

    // Group purchases by date
    const purchasesByDateMap = {};
    purchaseData.forEach(purchase => {
        const dateStr = new Date(purchase.createdAt).toISOString().split('T')[0];
        if (!purchasesByDateMap[dateStr]) {
            purchasesByDateMap[dateStr] = { totalPurchases: 0, count: 0 };
        }
        purchasesByDateMap[dateStr].totalPurchases += purchase.totalAmount || 0;
        purchasesByDateMap[dateStr].count += 1;
    });
    const purchases = Object.entries(purchasesByDateMap).map(([date, data]) => ({
        _id: date,
        totalPurchases: data.totalPurchases,
        count: data.count
    })).sort((a, b) => a._id.localeCompare(b._id));

    // Group expenses by date
    const expensesByDateMap = {};
    expenseData.forEach(expense => {
        const dateStr = new Date(expense.createdAt).toISOString().split('T')[0];
        if (!expensesByDateMap[dateStr]) {
            expensesByDateMap[dateStr] = { totalExpenses: 0, count: 0 };
        }
        expensesByDateMap[dateStr].totalExpenses += expense.amount || 0;
        expensesByDateMap[dateStr].count += 1;
    });
    const expenses = Object.entries(expensesByDateMap).map(([date, data]) => ({
        _id: date,
        totalExpenses: data.totalExpenses,
        count: data.count
    })).sort((a, b) => a._id.localeCompare(b._id));

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
    const { type, search, page = 1, limit = 20 } = filters;

    const matchQuery = {};
    if (type) matchQuery.type = type;
    if (search) matchQuery.name = { $regex: search, $options: "i" };

    const skip = (page - 1) * limit;

    // Fetch data using service functions
    const [data, total] = await Promise.all([
        findQarzaAccountService(matchQuery).sort({ createdAt: -1 }).skip(skip).limit(limit),
        countQarzaAccountService(matchQuery)
    ]);

    // Get recent payments for each account using service function
    const accountsWithPayments = await Promise.all(
        data.map(async (account) => {
            const payments = await findQarzaPaymentService({ account: account._id })
                .sort({ createdAt: -1 })
                .limit(5);
            return { ...account.toObject(), recentPayments: payments };
        })
    );

    // Calculate totals manually
    const totalBalance = data.reduce((sum, account) => sum + (account.balance || 0), 0);
    const totalAccounts = data.length;

    return {
        data: accountsWithPayments,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        summary: {
            totalBalance,
            totalAccounts
        }
    };
};

// Purchase Return Report
export const getPurchaseReturnReport = async (filters = {}) => {
    const { fromDate, toDate, supplierId, page = 1, limit = 20 } = filters;

    const matchQuery = {};
    if (fromDate || toDate) {
        const dateFilter = buildDateFilter(fromDate, toDate);
        matchQuery.createdAt = dateFilter.createdAt;
    }
    if (supplierId) matchQuery.supplier = supplierId;

    const skip = (page - 1) * limit;

    // Fetch data using service functions
    const [data, total, supplierList] = await Promise.all([
        findPurchaseReturnService(matchQuery).sort({ createdAt: -1 }).skip(skip).limit(limit),
        countPurchaseReturnService(matchQuery),
        findSupplierService({})
    ]);

    // Calculate totals manually
    const totalAmount = data.reduce((sum, ret) => sum + (ret.totalAmount || 0), 0);
    const totalReturns = data.length;

    // Calculate returns by supplier manually
    const returnsBySupplierMap = {};
    data.forEach(ret => {
        const supplierId = ret.supplier?.toString();
        if (!supplierId) return;
        
        if (!returnsBySupplierMap[supplierId]) {
            const supplier = supplierList.find(s => s._id?.toString() === supplierId);
            returnsBySupplierMap[supplierId] = {
                supplierName: supplier?.name || 'Unknown',
                totalAmount: 0,
                count: 0
            };
        }
        
        returnsBySupplierMap[supplierId].totalAmount += ret.totalAmount || 0;
        returnsBySupplierMap[supplierId].count += 1;
    });
    
    const returnsBySupplier = Object.values(returnsBySupplierMap).map(item => ({
        supplierName: item.supplierName,
        totalAmount: item.totalAmount,
        count: item.count
    }));

    return {
        data,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        summary: {
            totalAmount,
            totalReturns,
        },
        returnsBySupplier,
    };
};

// Sale Return Report
export const getSaleReturnReport = async (filters = {}) => {
    const { fromDate, toDate, customerId, page = 1, limit = 20 } = filters;

    const matchQuery = {};
    if (fromDate || toDate) {
        const dateFilter = buildDateFilter(fromDate, toDate);
        matchQuery.createdAt = dateFilter.createdAt;
    }
    if (customerId) matchQuery.customer = customerId;

    const skip = (page - 1) * limit;

    // Fetch data using service functions
    const [data, total, customerList] = await Promise.all([
        findProductReturnService(matchQuery).sort({ createdAt: -1 }).skip(skip).limit(limit),
        countProductReturnService(matchQuery),
        findCustomerService({})
    ]);

    // Calculate totals manually
    const totalRefund = data.reduce((sum, ret) => sum + (ret.refundAmount || 0), 0);
    const totalReturns = data.length;

    // Calculate returns by customer manually
    const returnsByCustomerMap = {};
    data.forEach(ret => {
        const customerId = ret.customer?.toString();
        if (!customerId) return;
        
        if (!returnsByCustomerMap[customerId]) {
            const customer = customerList.find(c => c._id?.toString() === customerId);
            returnsByCustomerMap[customerId] = {
                customerName: customer?.name || 'Unknown',
                totalRefund: 0,
                count: 0
            };
        }
        
        returnsByCustomerMap[customerId].totalRefund += ret.refundAmount || 0;
        returnsByCustomerMap[customerId].count += 1;
    });
    
    const returnsByCustomer = Object.values(returnsByCustomerMap).map(item => ({
        customerName: item.customerName,
        totalRefund: item.totalRefund,
        count: item.count
    }));

    return {
        data,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        summary: {
            totalRefund,
            totalReturns,
        },
        returnsByCustomer,
    };
};

// Inventory Report
export const getInventoryReport = async (filters = {}) => {
    const { tag, category, search, sortBy = 'name', sortOrder = 'asc', page = 1, limit = 20 } = filters;

    const matchQuery = {};

    // Tag filter
    if (tag) {
        matchQuery.tags = tag;
    }

    // Category filter
    if (category) {
        matchQuery.category = category;
    }

    // Search filter
    if (search) {
        matchQuery.$or = [
            { name: { $regex: search, $options: "i" } },
            { sku: { $regex: search, $options: "i" } }
        ];
    }

    const skip = (page - 1) * limit;

    // Fetch data using service functions
    const [data, total] = await Promise.all([
        findProductService(matchQuery).sort({ createdAt: -1 }).skip(skip).limit(limit),
        countProductService(matchQuery)
    ]);

    // Get all batches to calculate stock levels
    const allBatches = await findBatchService({ isActive: true });

    // Get all orders to calculate sales
    const allOrders = await findOrderService({ status: "completed" });

    // Get all purchases to calculate purchases
    const allPurchases = await findPurchaseService({});

    // Get all returns to calculate returns
    const allReturns = await findProductReturnService({});

    // Calculate statistics for each product
    const productsWithStats = await Promise.all(
        data.map(async (product) => {
            const productId = product._id.toString();

            // Calculate total stock from batches
            const productBatches = allBatches.filter(b => b.product?.toString() === productId);
            const totalStock = productBatches.reduce((sum, b) => sum + (b.quantity || 0), 0);

            // Calculate total purchased
            const productPurchases = allPurchases.filter(p => 
                p.items?.some(i => i.product?.toString() === productId)
            );
            const totalPurchased = productPurchases.reduce((sum, p) => {
                const item = p.items?.find(i => i.product?.toString() === productId);
                return sum + (item ? item.quantity : 0);
            }, 0);

            // Calculate total sold
            const productOrders = allOrders.filter(o => 
                o.items?.some(i => i.product?.toString() === productId)
            );
            const totalSold = productOrders.reduce((sum, o) => {
                const item = o.items?.find(i => i.product?.toString() === productId);
                return sum + (item ? item.quantity : 0);
            }, 0);

            // Calculate total returned
            const productReturns = allReturns.filter(r => 
                r.items?.some(i => i.product?.toString() === productId)
            );
            const totalReturned = productReturns.reduce((sum, r) => {
                const item = r.items?.find(i => i.product?.toString() === productId);
                return sum + (item ? item.quantity : 0);
            }, 0);

            return {
                ...product.toObject(),
                totalStock,
                totalPurchased,
                totalSold,
                totalReturned
            };
        })
    );

    // Calculate tag counts
    const tagCounts = {};
    data.forEach(product => {
        if (product.tags && Array.isArray(product.tags)) {
            product.tags.forEach(tag => {
                tagCounts[tag] = (tagCounts[tag] || 0) + 1;
            });
        }
    });

    // Sort based on sortBy parameter
    const sortField = sortBy === 'stock' ? 'totalStock' : 
                      sortBy === 'sales' ? 'totalSold' : 
                      sortBy === 'returns' ? 'totalReturned' : 'name';
    const sortDirection = sortOrder === 'asc' ? 1 : -1;
    
    productsWithStats.sort((a, b) => {
        if (sortField === 'name') {
            return a.name.localeCompare(b.name) * sortDirection;
        }
        return (a[sortField] - b[sortField]) * sortDirection;
    });

    return {
        data: productsWithStats,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        summary: {
            totalProducts: total,
            tagCounts,
        }
    };
};

// Product Wastage Report
export const getProductWastageReport = async (filters = {}) => {
    const { fromDate, toDate, productId, page = 1, limit = 20 } = filters;

    const matchQuery = {};
    if (fromDate || toDate) {
        const dateFilter = buildDateFilter(fromDate, toDate);
        matchQuery.createdAt = dateFilter.createdAt;
    }
    if (productId) matchQuery.product = productId;

    const skip = (page - 1) * limit;

    // Fetch data using service functions
    const [data, total, productList] = await Promise.all([
        findWastageService(matchQuery).sort({ createdAt: -1 }).skip(skip).limit(limit),
        countWastageService(matchQuery),
        findProductService({})
    ]);

    // Calculate wastage by product manually
    const wastageByProductMap = {};
    data.forEach(wastage => {
        const productId = wastage.product?.toString();
        if (!productId) return;
        
        if (!wastageByProductMap[productId]) {
            const product = productList.find(p => p._id?.toString() === productId);
            wastageByProductMap[productId] = {
                productName: product?.name || 'Unknown',
                totalQuantity: 0,
                totalLoss: 0,
                count: 0
            };
        }
        
        wastageByProductMap[productId].totalQuantity += wastage.quantity || 0;
        wastageByProductMap[productId].totalLoss += (wastage.quantity || 0) * (wastage.costPrice || 0);
        wastageByProductMap[productId].count += 1;
    });
    
    const wastageByProduct = Object.values(wastageByProductMap);

    return {
        data,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        summary: {
            totalQuantity: data.reduce((sum, w) => sum + (w.quantity || 0), 0),
            totalLoss: data.reduce((sum, w) => sum + ((w.quantity || 0) * (w.costPrice || 0)), 0),
            totalRecords: data.length,
        },
        wastageByProduct
    };
};

// Customer Report
export const getCustomerReport = async (filters = {}) => {
    const { search, sortBy = 'name', sortOrder = 'asc', page = 1, limit = 20 } = filters;

    const matchQuery = {};
    if (search) {
        matchQuery.$or = [
            { name: { $regex: search, $options: "i" } },
            { phone: { $regex: search, $options: "i" } },
            { email: { $regex: search, $options: "i" } }
        ];
    }

    const skip = (page - 1) * limit;

    // Fetch data using service functions
    const [data, total] = await Promise.all([
        findCustomerService(matchQuery).sort({ createdAt: -1 }).skip(skip).limit(limit),
        countCustomerService(matchQuery)
    ]);

    // Get all orders to calculate customer statistics
    const allOrders = await findOrderService({ status: "completed" });

    // Calculate statistics for each customer
    const customersWithStats = data.map(customer => {
        const customerId = customer._id.toString();
        const customerOrders = allOrders.filter(o => o.customerId?.toString() === customerId);

        const totalOrders = customerOrders.length;
        const totalSpent = customerOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
        const lastOrderDate = customerOrders.length > 0 ? customerOrders[0].createdAt : null;

        return {
            ...customer.toObject(),
            totalOrders,
            totalSpent,
            lastOrderDate
        };
    });

    // Sort based on sortBy parameter
    const sortField = sortBy === 'orders' ? 'totalOrders' : 
                      sortBy === 'spent' ? 'totalSpent' : 
                      sortBy === 'lastOrder' ? 'lastOrderDate' : 'name';
    const sortDirection = sortOrder === 'asc' ? 1 : -1;
    
    customersWithStats.sort((a, b) => {
        if (sortField === 'name') {
            return a.name.localeCompare(b.name) * sortDirection;
        }
        if (sortField === 'lastOrderDate') {
            const aDate = a.lastOrderDate ? new Date(a.lastOrderDate).getTime() : 0;
            const bDate = b.lastOrderDate ? new Date(b.lastOrderDate).getTime() : 0;
            return (aDate - bDate) * sortDirection;
        }
        return (a[sortField] - b[sortField]) * sortDirection;
    });

    return {
        data: customersWithStats,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        summary: {
            totalCustomers: total,
            totalOrders: customersWithStats.reduce((sum, c) => sum + c.totalOrders, 0),
            totalSpent: customersWithStats.reduce((sum, c) => sum + c.totalSpent, 0)
        }
    };
};

// Supplier Report
export const getSupplierReport = async (filters = {}) => {
    const { search, sortBy = 'name', sortOrder = 'asc', page = 1, limit = 20 } = filters;

    const matchQuery = {};
    if (search) {
        matchQuery.$or = [
            { name: { $regex: search, $options: "i" } },
            { phone: { $regex: search, $options: "i" } }
        ];
    }

    const skip = (page - 1) * limit;

    // Fetch data using service functions
    const [data, total] = await Promise.all([
        findSupplierService(matchQuery).sort({ createdAt: -1 }).skip(skip).limit(limit),
        countSupplierService(matchQuery)
    ]);

    // Get all purchases to calculate supplier statistics
    const allPurchases = await findPurchaseService({});
    const allPurchaseReturns = await findPurchaseReturnService({});

    // Calculate statistics for each supplier
    const suppliersWithStats = data.map(supplier => {
        const supplierId = supplier._id.toString();
        const supplierPurchases = allPurchases.filter(p => p.supplier?.toString() === supplierId);
        const supplierReturns = allPurchaseReturns.filter(r => r.supplier?.toString() === supplierId);

        const totalPurchases = supplierPurchases.reduce((sum, p) => sum + (p.totalAmount || 0), 0);
        const totalPaid = supplierPurchases.reduce((sum, p) => {
            if (p.paymentStatus === "full") {
                return sum + (p.totalAmount || 0);
            }
            return sum + (p.paidAmount || 0);
        }, 0);
        const totalDue = supplierPurchases.reduce((sum, p) => {
            if (p.paymentStatus !== "full") {
                return sum + ((p.totalAmount || 0) - (p.paidAmount || 0));
            }
            return sum;
        }, 0);
        const totalReturns = supplierReturns.reduce((sum, r) => sum + (r.totalAmount || 0), 0);

        return {
            ...supplier.toObject(),
            totalPurchases,
            totalPaid,
            totalDue,
            totalReturns
        };
    });

    // Sort based on sortBy parameter
    const sortField = sortBy === 'purchases' ? 'totalPurchases' : 
                      sortBy === 'due' ? 'totalDue' : 'name';
    const sortDirection = sortOrder === 'asc' ? 1 : -1;
    
    suppliersWithStats.sort((a, b) => {
        if (sortField === 'name') {
            return a.name.localeCompare(b.name) * sortDirection;
        }
        return (a[sortField] - b[sortField]) * sortDirection;
    });

    return {
        data: suppliersWithStats,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        summary: {
            totalSuppliers: total,
            totalPurchases: suppliersWithStats.reduce((sum, s) => sum + s.totalPurchases, 0),
            totalDue: suppliersWithStats.reduce((sum, s) => sum + s.totalDue, 0)
        }
    };
};

// Staff Report
export const getStaffReport = async (filters = {}) => {
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

    // Fetch staff using service functions
    const [data, total] = await Promise.all([
        findStaffService(matchQuery).sort({ createdAt: -1 }).skip(skip).limit(limit),
        countStaffService(matchQuery)
    ]);

    const staffWithStats = await Promise.all(
        data.map(async (staff) => {
            // Get salary payments with date filter using service function
            const salaryPayments = await findStaffSalaryPaymentService({ 
                staffId: staff._id,
                ...(Object.keys(dateFilter).length > 0 ? dateFilter : {})
            });
            const totalPaid = salaryPayments.reduce((sum, payment) => sum + (payment.amount || 0), 0);
            
            // Get advance/deductions
            const advance = salaryPayments.reduce((sum, payment) => sum + (payment.advance || 0), 0);
            const deductions = salaryPayments.reduce((sum, payment) => sum + (payment.deduction || 0), 0);

            // Get orders handled by this staff using service function
            const orderFilter = {
                ...(Object.keys(dateFilter).length > 0 ? dateFilter : {}),
                ...orderTypeFilter,
                'staffId': staff._id
            };
            
            const orders = await findOrderService(orderFilter);
            const totalOrders = orders.length;
            
            // Calculate sales amounts
            const totalSales = orders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
            const retailSales = orders
                .filter(o => o.orderType === 'retail')
                .reduce((sum, order) => sum + (order.totalAmount || 0), 0);
            const wholesaleSales = orders
                .filter(o => o.orderType === 'wholesale')
                .reduce((sum, order) => sum + (order.totalAmount || 0), 0);

            // Get attendance data using service function
            const attendanceFilter = {
                ...(Object.keys(dateFilter).length > 0 ? dateFilter : {})
            };
            
            const attendanceRecords = await findStaffAttendanceService(attendanceFilter);
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

    // Fetch all data using service functions
    const [orders, purchases, expenses, wastages, salaryPayments, productReturns] = await Promise.all([
        findOrderService({ ...dateFilter, status: "completed" }),
        findPurchaseService(dateFilter),
        findExpenseService(dateFilter),
        findWastageService(dateFilter),
        findStaffSalaryPaymentService(dateFilter),
        findProductReturnService(dateFilter)
    ]);

    // Calculate totals manually
    const totalRevenue = orders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
    const totalDiscount = orders.reduce((sum, order) => sum + (order.discountAmount || 0), 0);
    const netRevenue = totalRevenue - totalDiscount;
    const totalCOGS = purchases.reduce((sum, purchase) => sum + (purchase.totalAmount || 0), 0);
    const totalExpenses = expenses.reduce((sum, expense) => sum + (expense.amount || 0), 0);
    const totalWastage = wastages.reduce((sum, wastage) => sum + ((wastage.quantity || 0) * (wastage.costPrice || 0)), 0);
    const totalSalaries = salaryPayments.reduce((sum, payment) => sum + (payment.amount || 0), 0);
    const totalRefunds = productReturns.reduce((sum, ret) => sum + (ret.refundAmount || 0), 0);

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

    // Fetch data using service functions
    const [data, total, categoryList] = await Promise.all([
        findExpenseService(matchQuery, { 
            populate: "category", 
            sort: { createdAt: -1 }, 
            skip, 
            limit 
        }),
        countExpenseService(matchQuery),
        findExpenseCategoryService({})
    ]);

    // Calculate totals by category manually
    const categoryTotalsMap = {};
    data.forEach(expense => {
        const categoryId = expense.category?.toString();
        if (!categoryId) return;
        
        if (!categoryTotalsMap[categoryId]) {
            const category = categoryList.find(c => c._id?.toString() === categoryId);
            categoryTotalsMap[categoryId] = {
                _id: categoryId,
                category: category ? [category] : [],
                total: 0,
                count: 0
            };
        }
        
        categoryTotalsMap[categoryId].total += expense.amount || 0;
        categoryTotalsMap[categoryId].count += 1;
    });
    
    const categoryTotals = Object.values(categoryTotalsMap);

    // Calculate overall total manually
    const overallTotal = data.reduce((sum, expense) => sum + (expense.amount || 0), 0);

    return {
        data,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        summary: {
            totalExpenses: overallTotal,
            categoryBreakdown: categoryTotals
        }
    };
};

// Wastage Report
export const getWastageReport = async (filters = {}) => {
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

    // Fetch data using service functions
    const [data, total] = await Promise.all([
        findWastageService(matchQuery).populate("product", "name").populate("batch", "batchNumber").sort({ createdAt: -1 }).skip(skip).limit(limit),
        countWastageService(matchQuery)
    ]);

    // Calculate totals manually
    const totalQuantity = data.reduce((sum, w) => sum + (w.quantity || 0), 0);
    const totalLoss = data.reduce((sum, w) => sum + ((w.quantity || 0) * (w.costPrice || 0)), 0);
    const totalRecords = data.length;

    return {
        data,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        summary: {
            totalQuantity,
            totalLoss,
            totalRecords,
        }
    };
};

// Activity Report
export const getActivityReport = async (filters = {}) => {
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

    // Fetch data using model directly (no service function available)
    const ActivityLogModel = getActivityLogModel();
    const [data, total] = await Promise.all([
        ActivityLogModel.find(matchQuery).populate("user", "name email").sort({ createdAt: -1 }).skip(skip).limit(limit),
        ActivityLogModel.countDocuments(matchQuery)
    ]);

    // Calculate activity by action type manually
    const actionStatsMap = {};
    data.forEach(log => {
        const actionType = log.action || 'unknown';
        if (!actionStatsMap[actionType]) {
            actionStatsMap[actionType] = { _id: actionType, count: 0 };
        }
        actionStatsMap[actionType].count += 1;
    });
    
    const actionStats = Object.values(actionStatsMap);

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
    const { fromDate, toDate, limit = 10 } = filters;
    const limitNum = parseInt(limit) || 10;

    const matchQuery = { status: "completed" };
    if (fromDate || toDate) {
        const dateFilter = buildDateFilter(fromDate, toDate);
        matchQuery.createdAt = dateFilter.createdAt;
    }

    // Fetch orders and products using service functions
    const [orders, productList] = await Promise.all([
        findOrderService(matchQuery),
        findProductService({})
    ]);

    // Calculate product sales manually
    const productSalesMap = {};
    orders.forEach(order => {
        if (order.items && Array.isArray(order.items)) {
            order.items.forEach(item => {
                const productId = item.product?.toString();
                if (!productId) return;
                
                if (!productSalesMap[productId]) {
                    productSalesMap[productId] = {
                        _id: productId,
                        totalQuantity: 0,
                        totalRevenue: 0,
                        orderCount: 0
                    };
                }
                
                productSalesMap[productId].totalQuantity += item.quantity || 0;
                productSalesMap[productId].totalRevenue += (item.quantity || 0) * (item.unitPrice || 0);
                productSalesMap[productId].orderCount += 1;
            });
        }
    });

    // Add product details and sort
    const topProducts = Object.values(productSalesMap)
        .map(sales => {
            const product = productList.find(p => p._id?.toString() === sales._id);
            return {
                ...sales,
                product: product ? [product] : []
            };
        })
        .sort((a, b) => b.totalRevenue - a.totalRevenue)
        .slice(0, limitNum);

    return topProducts;
};

// Top Customers
export const getTopCustomers = async (filters = {}) => {
    const { fromDate, toDate, limit = 10 } = filters;
    const limitNum = parseInt(limit) || 10;

    const matchQuery = { status: "completed" };
    if (fromDate || toDate) {
        const dateFilter = buildDateFilter(fromDate, toDate);
        matchQuery.createdAt = dateFilter.createdAt;
    }

    // Fetch orders using service function
    const orders = await findOrderService(matchQuery);

    // Calculate customer sales manually
    const customerSalesMap = {};
    orders.forEach(order => {
        const customerName = order.customerName;
        if (!customerName || customerName === "") return;
        
        if (!customerSalesMap[customerName]) {
            customerSalesMap[customerName] = {
                _id: customerName,
                totalSpent: 0,
                orderCount: 0,
                lastOrderDate: null
            };
        }
        
        customerSalesMap[customerName].totalSpent += order.totalAmount || 0;
        customerSalesMap[customerName].orderCount += 1;
        
        const orderDate = new Date(order.createdAt);
        if (!customerSalesMap[customerName].lastOrderDate || orderDate > new Date(customerSalesMap[customerName].lastOrderDate)) {
            customerSalesMap[customerName].lastOrderDate = order.createdAt;
        }
    });

    // Sort and limit
    const topCustomers = Object.values(customerSalesMap)
        .sort((a, b) => b.totalSpent - a.totalSpent)
        .slice(0, limitNum);

    return topCustomers;
};

// Low Stock Products
export const getLowStockProducts = async (filters = {}) => {
    const { limit = 10 } = filters;
    const limitNum = parseInt(limit) || 10;

    // Fetch low stock batches using service function
    const lowStockBatches = await findBatchService({
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
    const { limit = 10 } = filters;
    const limitNum = parseInt(limit) || 10;

    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    // Fetch near expiry batches using service function
    const nearExpiryBatches = await findBatchService({
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
    const { limit = 10 } = filters;

    // Fetch recent sales using service function
    const recentSales = await findOrderService({ status: "completed" })
        .populate("items.product", "name")
        .sort({ createdAt: -1 })
        .limit(limit);

    return recentSales;
};

// Recent Purchases
export const getRecentPurchases = async (filters = {}) => {
    const { limit = 10 } = filters;

    // Fetch recent purchases using service function
    const recentPurchases = await findPurchaseService()
        .populate("supplier", "name")
        .populate("items.product", "name")
        .sort({ createdAt: -1 })
        .limit(limit);

    return recentPurchases;
};
