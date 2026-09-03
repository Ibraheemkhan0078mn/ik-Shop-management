import { findDocs, countDocs } from "../../../common/services/db/mongodbCentralizedCrud.service.js";

// Service function imports
import {
    findOrderService,
    countOrderService,
    findByIdOrderService,
} from '../../pos/services/order.crud.js';
import { calculateOrderPaymentStatus } from '../../pos/services/orderPayment.service.js';
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
    findTransactionService,
    countTransactionService,
} from '../../transactions/services/transaction.service.js';
import {
    findExpenseCategoryService,
} from '../../expenses/services/expenseCategory.crud.js';
import {
    findPurchaseReturnService,
} from '../../purchaseReturn/services/purchaseReturn.crud.js';
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
import { getLocalPurchaseReturnModel } from '../../../configs/connect.db.js';

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
        findTransactionService({ sourceType: 'expense', isDeleted: false, transactionDate: { $gte: startOfDay, $lt: endOfDay } }),
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

// Reusable function to generate sales report data with detailed profit calculations
// This extracts the sales logic from prepareMainBusinessReport for reuse
export const generateSalesReportData = async (filters = {}) => {
    const { fromDate, toDate, period = "all", page = 1, limit = 100, orderId } = filters;

    let dateFilter = {};
    let orderFilter = { status: "completed" };

    // Apply orderId filter if provided - when orderId is provided, ignore all other filters
    if (orderId) {
        // Check if it's a valid MongoDB ObjectId (24-character hex string)
        if (/^[0-9a-fA-F]{24}$/.test(orderId)) {
            orderFilter = { _id: orderId }; // Search by MongoDB ObjectId
        } else {
            // Otherwise, treat it as an order number (human-readable)
            // Use $or to try multiple search strategies
            orderFilter = {
                $or: [
                    { orderNumber: orderId }, // Exact match
                    { orderNumber: { $regex: orderId, $options: 'i' } }, // Partial match (case-insensitive)
                    { orderNumber: { $regex: `^${orderId}$`, $options: 'i' } } // Exact match (case-insensitive)
                ]
            };
        }
        // Clear date filter and status filter when orderId is specified
        dateFilter = {};
        // Remove status filter to find the order regardless of status
        delete orderFilter.status;
    }
    
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
    } else if (period === "all") {
        dateFilter = {};
    }

    // Fetch orders
    const orders = await findOrderService({ ...dateFilter, ...orderFilter });

    // Returns are reported against the order date so a filtered sale remains auditable
    // even when its approved return was processed later.
    const orderIds = orders.map(order => order._id);
    const productReturns = orderIds.length > 0
        ? await findProductReturnService({
            referenceOrderId: { $in: orderIds },
            returnStatus: { $in: ['approved', 'completed'] },
            isDeleted: false
        })
        : [];
    const returnsByOrder = productReturns.reduce((map, productReturn) => {
        const key = String(productReturn.referenceOrderId);
        if (!map.has(key)) map.set(key, []);
        map.get(key).push(productReturn);
        return map;
    }, new Map());

    // If orderId was specified but no order found, return empty results
    if (orderId && orders.length === 0) {
        return {
            data: [],
            total: 0,
            page,
            limit,
            totalPages: 0,
            summary: {
                totalSales: 0,
                totalDiscount: 0,
                totalCostOfGoodsSold: 0,
                grossProfit: 0,
                grossMarginPercentage: 0,
                totalReturnRefunds: 0,
                returnedCOGS: 0,
                netSales: 0,
                netCOGS: 0,
                netProfit: 0,
                netMarginPercentage: 0,
                returnCount: 0,
                salesCount: 0,
                retailSales: 0,
                wholesaleSales: 0,
                avgOrderValue: 0,
                salesMargin: 0
            },
            breakdowns: {
                salesByPaymentMethod: []
            }
        };
    }

    // Calculate gross sales totals. Return-adjusted totals are calculated below.
    const totalSales = orders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
    const totalDiscount = orders.reduce((sum, order) => sum + (order.discountAmount || 0), 0);
    const salesCount = orders.length;

    // Calculate retail vs wholesale sales
    const retailSales = orders
        .filter(order => order.orderType === 'retail' || order.customerType === 'regular')
        .reduce((sum, order) => sum + (order.totalAmount || 0), 0);
    
    const wholesaleSales = orders
        .filter(order => order.orderType === 'wholesale' || order.customerType === 'wholesale')
        .reduce((sum, order) => sum + (order.totalAmount || 0), 0);

    // Calculate average order value
    const avgOrderValue = salesCount > 0 ? totalSales / salesCount : 0;

    // Calculate sales margin (revenue - cost of goods sold)
    let totalCostOfGoodsSold = 0;
    for (const order of orders) {
        if (order.items) {
            for (const item of order.items) {
                let effectiveCostPrice = 0;
                
                if (item.batchId) {
                    const batch = await findByIdBatchService(item.batchId);
                    if (batch && batch.purchasePrice) {
                        // Start with base purchase price
                        let baseCostPrice = batch.purchasePrice;
                        
                        // Apply batch-level discount if exists
                        if (batch.discount && batch.discount.amount > 0) {
                            if (batch.discount.type === 'percentage') {
                                baseCostPrice = baseCostPrice * (1 - (batch.discount.amount / 100));
                            } else {
                                baseCostPrice = baseCostPrice - (batch.discount.amount || 0);
                            }
                        }
                        
                        // Apply batch-level tax if exists
                        if (batch.gst && batch.gst > 0) {
                            baseCostPrice = baseCostPrice * (1 + (batch.gst / 100));
                        }
                        
                        effectiveCostPrice = baseCostPrice;
                    }
                }
                
                totalCostOfGoodsSold += effectiveCostPrice * (item.quantity || 0);
            }
        }
    }
    const totalReturnRefunds = productReturns.reduce((sum, productReturn) => sum + (productReturn.totalRefundAmount || 0), 0);
    const returnCount = productReturns.length;
    let returnedCOGS = 0;
    for (const productReturn of productReturns) {
        const order = orders.find(candidate => String(candidate._id) === String(productReturn.referenceOrderId));
        for (const returnedItem of productReturn.items || []) {
            const soldItem = order?.items?.find(item => String(item.batchId) === String(returnedItem.batchId) && String(item.product) === String(returnedItem.productId));
            let costPrice = 0;
            if (returnedItem.batchId) {
                const batch = await findByIdBatchService(returnedItem.batchId);
                if (batch) {
                    costPrice = Number(batch.purchasePrice) || 0;
                    if (batch.discount?.amount > 0) {
                        costPrice = batch.discount.type === 'percentage'
                            ? costPrice * (1 - batch.discount.amount / 100)
                            : costPrice - batch.discount.amount;
                    }
                    if (batch.gst > 0) costPrice *= 1 + batch.gst / 100;
                }
            } else if (soldItem) {
                costPrice = Number(soldItem.purchasePrice) || 0;
            }
            returnedCOGS += costPrice * (returnedItem.quantity || 0);
        }
    }
    const netSales = totalSales - totalReturnRefunds;
    const netCOGS = totalCostOfGoodsSold - returnedCOGS;
    const netProfit = netSales - netCOGS;
    const netMarginPercentage = netSales > 0 ? Number(((netProfit / netSales) * 100).toFixed(1)) : 0;
    const salesMargin = netProfit;

    const grossProfit = totalSales - totalCostOfGoodsSold;
    const grossMarginPercentage = totalSales > 0 ? Number(((grossProfit / totalSales) * 100).toFixed(1)) : 0;

    // Calculate sales by payment method
    const salesByPaymentMethodMap = {};
    orders.forEach(order => {
        const method = order.paymentMethod || 'Cash';
        if (!salesByPaymentMethodMap[method]) {
            salesByPaymentMethodMap[method] = { total: 0, count: 0 };
        }
        salesByPaymentMethodMap[method].total += order.totalAmount || 0;
        salesByPaymentMethodMap[method].count += 1;
    });
    const salesByPaymentMethod = Object.entries(salesByPaymentMethodMap).map(([method, data]) => ({
        method,
        total: data.total,
        count: data.count,
        percentage: totalSales > 0 ? ((data.total / totalSales) * 100).toFixed(1) : 0
    }));

    // Get transaction list with detailed batch information (same as main business report)
    const salesList = await Promise.all(
        orders
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .slice(0, 100)
            .map(async (order) => {
                // Fetch batch details for each item in the order
                const itemsWithBatchDetails = await Promise.all(
                    (order.items || []).map(async (item) => {
                        let costPrice = 0;
                        let batchSalePrice = 0;
                        let batchNumber = item.batchNumber || 'N/A';
                        let batchDiscount = 0;
                        let batchDiscountType = 'percentage';
                        
                        // Fetch batch details to get cost price
                        if (item.batchId) {
                            try {
                                const batch = await findByIdBatchService(item.batchId);
                                if (batch) {
                                    // Start with base purchase price
                                    let baseCostPrice = Number(batch.purchasePrice) || 0;
                                    
                                    // Calculate effective cost price including purchase tax and discount
                                    let effectiveCostPrice = baseCostPrice;
                                    let purchaseDiscount = 0;
                                    let purchaseTax = 0;
                                    
                                    // Apply batch-level discount if exists
                                    if (batch.discount && batch.discount.amount > 0) {
                                        if (batch.discount.type === 'percentage') {
                                            purchaseDiscount = baseCostPrice * (batch.discount.amount / 100);
                                            effectiveCostPrice = baseCostPrice - purchaseDiscount;
                                        } else {
                                            purchaseDiscount = batch.discount.amount || 0;
                                            effectiveCostPrice = baseCostPrice - purchaseDiscount;
                                        }
                                    }
                                    
                                    // Apply batch-level tax if exists
                                    if (batch.gst && batch.gst > 0) {
                                        purchaseTax = effectiveCostPrice * (batch.gst / 100);
                                        effectiveCostPrice = effectiveCostPrice + purchaseTax;
                                    }
                                    
                                    // Use effective cost price for calculations
                                    costPrice = effectiveCostPrice;
                                    batchSalePrice = Number(batch.sellingPrice) || 0;
                                    batchNumber = batch.batchNumber || batchNumber;
                                    batchDiscount = purchaseDiscount;
                                    batchDiscountType = batch.discount?.type || 'percentage';
                                    
                                    // Store additional purchase cost breakdown
                                    item.basePurchasePrice = baseCostPrice;
                                    item.purchaseDiscount = purchaseDiscount;
                                    item.purchaseTax = purchaseTax;
                                    item.effectiveCostPrice = effectiveCostPrice;
                                    
                                } else {
                                    console.warn(`Batch not found for batchId: ${item.batchId}, product: ${item.name}`);
                                }
                            } catch (error) {
                                console.error(`Error fetching batch ${item.batchId} for product ${item.name}:`, error.message);
                                // Continue with costPrice = 0 if batch lookup fails - don't fail the entire request
                            }
                        } else {
                            console.warn(`No batchId for item: ${item.name} in order, cannot fetch cost price`);
                        }
                        
                        // Calculate totals for this item
                        const itemCostTotal = costPrice * (item.quantity || 0);
                        const itemSaleTotal = (item.unitPrice || 0) * (item.quantity || 0);
                        const itemProfit = itemSaleTotal - itemCostTotal;
                        const itemMargin = itemSaleTotal > 0 ? ((itemProfit / itemSaleTotal) * 100).toFixed(2) : 0;
                        
                        return {
                            productName: item.name,
                            quantity: item.quantity || 0,
                            // Prices
                            costPrice: costPrice,
                            basePurchasePrice: item.basePurchasePrice || costPrice,
                            purchaseDiscount: item.purchaseDiscount || 0,
                            purchaseTax: item.purchaseTax || 0,
                            effectiveCostPrice: item.effectiveCostPrice || costPrice,
                            batchSalePrice: batchSalePrice,
                            unitPrice: item.unitPrice || 0,
                            originalPrice: item.originalPrice || 0,
                            // Totals
                            lineTotal: item.lineTotal || 0,
                            itemTotal: item.itemTotal || 0,
                            itemCostTotal: itemCostTotal,
                            itemSaleTotal: itemSaleTotal,
                            itemProfit: itemProfit,
                            itemMargin: itemMargin,
                            // Tax
                            taxAmount: item.taxAmount || 0,
                            taxPercent: item.taxPercent || 0,
                            taxType: item.taxType || 'percentage',
                            // Discount
                            discountAmount: item.discountAmount || 0,
                            discountPercent: item.discountPercent || 0,
                            discountType: item.discountType || 'percentage',
                            // Batch info
                            batchId: item.batchId,
                            batchNumber: batchNumber,
                            batchDiscount: batchDiscount,
                            batchDiscountType: batchDiscountType,
                            // Other
                            portionType: item.portionType || 'full',
                            customInput: item.customInput || false
                        };
                    })
                );
                
                // Calculate order-level totals by summing all items
                const totalCostPrice = itemsWithBatchDetails.reduce((sum, item) => sum + item.itemCostTotal, 0);
                const totalSalePrice = itemsWithBatchDetails.reduce((sum, item) => sum + item.itemSaleTotal, 0);
                const totalItemCosts = itemsWithBatchDetails.reduce((sum, item) => sum + item.itemCostTotal, 0);
                
                // Calculate margin and profit from summed values
                const orderProfit = totalSalePrice - totalCostPrice;
                const orderMargin = totalSalePrice > 0 ? ((orderProfit / totalSalePrice) * 100).toFixed(2) : 0;
                
                const orderReturns = returnsByOrder.get(String(order._id)) || [];
                const returns = orderReturns.map(productReturn => ({
                    id: productReturn._id,
                    returnNumber: productReturn.returnNumber,
                    returnDate: productReturn.returnDate,
                    returnStatus: productReturn.returnStatus,
                    refundStatus: productReturn.refundStatus,
                    totalRefundAmount: productReturn.totalRefundAmount || 0,
                    items: (productReturn.items || []).map(returnedItem => ({
                        productId: returnedItem.productId,
                        productName: returnedItem.productName,
                        batchId: returnedItem.batchId,
                        quantity: returnedItem.quantity || 0,
                        refundAmount: returnedItem.refundAmount || 0,
                        returnReason: returnedItem.returnReason
                    }))
                }));
                const returnRefunds = returns.reduce((sum, productReturn) => sum + productReturn.totalRefundAmount, 0);
                const returnedQuantity = returns.reduce((sum, productReturn) => sum + productReturn.items.reduce((itemSum, item) => itemSum + item.quantity, 0), 0);
                const orderReturnedCOGS = returns.reduce((sum, productReturn) => sum + productReturn.items.reduce((itemSum, returnedItem) => {
                    const soldItem = itemsWithBatchDetails.find(item => String(item.batchId) === String(returnedItem.batchId) && item.productName === returnedItem.productName);
                    return itemSum + (soldItem?.costPrice || 0) * returnedItem.quantity;
                }, 0), 0);
                const grossSales = order.totalAmount || 0;
                const orderNetSales = grossSales - returnRefunds;
                const orderNetCOGS = totalCostPrice - orderReturnedCOGS;
                const orderNetProfit = orderNetSales - orderNetCOGS;

                // Calculate total discounts and taxes from items
                const totalItemDiscounts = itemsWithBatchDetails.reduce((sum, item) => sum + item.discountAmount, 0);
                const totalItemTaxes = itemsWithBatchDetails.reduce((sum, item) => sum + item.taxAmount, 0);
                
                return {
                    id: order._id,
                    orderNumber: order.orderNumber,
                    // Order totals
                    amount: order.totalAmount || 0,
                    subtotal: order.subtotal || 0,
                    discountAmount: order.discountAmount || 0,
                    discountType: order.discountType || 'percentage',
                    totalTaxAmount: order.totalTaxAmount || 0,
                    // Calculated totals from items
                    totalCostPrice: totalCostPrice,
                    totalSalePrice: totalSalePrice,
                    totalItemCosts: totalItemCosts,
                    totalItemDiscounts: totalItemDiscounts,
                    totalItemTaxes: totalItemTaxes,
                    // Profit and margin calculations
                    orderProfit: orderProfit,
                    orderMargin: orderMargin,
                    profitMargin: order.totalAmount > 0 ? ((orderProfit / order.totalAmount) * 100).toFixed(2) : 0,
                    grossSales,
                    returns,
                    returnedQuantity,
                    returnRefunds,
                    returnedCOGS: orderReturnedCOGS,
                    netSales: orderNetSales,
                    netCOGS: orderNetCOGS,
                    netProfit: orderNetProfit,
                    netMargin: orderNetSales > 0 ? Number(((orderNetProfit / orderNetSales) * 100).toFixed(2)) : 0,
                    // Customer and order info
                    paymentMethod: order.paymentMethod,
                    customerName: order.customerName || 'Walk-in',
                    customerType: order.customerType,
                    customerId: order.customerId,
                    orderType: order.orderType || 'retail',
                    waiter: order.waiter || '',
                    staffId: order.staffId,
                    note: order.note || '',
                    isPosOrder: order.isPosOrder || false,
                    status: order.status || 'completed',
                    // Items with all details
                    items: itemsWithBatchDetails,
                    date: order.createdAt
                };
            })
    );

    // Pagination
    const skip = (page - 1) * limit;
    const paginatedSales = salesList.slice(skip, skip + limit);
    const total = salesList.length;

    return {
        data: paginatedSales,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        summary: {
            totalSales,
            totalDiscount,
            totalCostOfGoodsSold,
            grossProfit,
            grossMarginPercentage,
            totalReturnRefunds,
            returnedCOGS,
            netSales,
            netCOGS,
            netProfit,
            netMarginPercentage,
            returnCount,
            salesCount,
            retailSales,
            wholesaleSales,
            avgOrderValue,
            salesMargin
        },
        breakdowns: {
            salesByPaymentMethod
        }
    };
};

// Sales Report (updated to use the reusable function)
export const getSalesReport = async (filters = {}) => {
    return await generateSalesReportData(filters);
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
            populate: [
                { path: "supplier", select: "name" },
                { path: "items.product", select: "name productCode" },
                { path: "items.batch", select: "batchNumber" }
            ],
            sort: { createdAt: -1 },
            skip,
            limit
        }),
        countPurchaseService(matchQuery)
    ]);

    // Fetch purchase returns for each purchase
    const { findPurchaseReturnService } = await import("../../purchaseReturn/services/purchaseReturn.crud.js");
    const purchaseIds = data.map(p => p._id);
    const allReturns = await findPurchaseReturnService({ purchase: { $in: purchaseIds } }, {
        populate: [
            { path: "supplier", select: "name" },
            { path: "items.product", select: "name productCode" },
            { path: "items.batch", select: "batchNumber" }
        ]
    });

    // Create map of purchase returns by purchase ID
    const purchaseReturnsMap = new Map();
    if (allReturns && allReturns.length > 0) {
        allReturns.forEach(ret => {
            const purchaseId = ret.purchase?.toString();
            if (purchaseId) {
                if (!purchaseReturnsMap.has(purchaseId)) {
                    purchaseReturnsMap.set(purchaseId, []);
                }
                purchaseReturnsMap.get(purchaseId).push(ret);
            }
        });
    }

    // Attach purchase returns to data
    const enrichedData = data.map(purchase => {
        const plainPurchase = purchase.toObject ? purchase.toObject() : purchase;
        return {
            ...plainPurchase,
            purchaseReturns: purchaseReturnsMap.get(purchase._id.toString()) || []
        };
    });

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
                supplierName: purchase.supplier?.name || 'Unknown',
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
        data: enrichedData,
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
const preparedMainBusinessReports = new Map();
const MAIN_BUSINESS_CACHE_TTL_MS = 2000;

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
        findSupplierService({ isActive: true }, { select: "name type email phone address" }),
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
        dateFilter = { transactionDate: { $gte: startOfDay, $lte: endOfDay } };
    } else if (period === "week") {
        const now = new Date();
        const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
        const endOfWeek = new Date(now.setDate(now.getDate() - now.getDay() + 6));
        dateFilter = { transactionDate: { $gte: startOfWeek, $lte: endOfWeek } };
    } else if (period === "month") {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        dateFilter = { transactionDate: { $gte: startOfMonth, $lte: endOfMonth } };
    } else if (fromDate && toDate) {
        dateFilter = { transactionDate: { $gte: new Date(fromDate), $lte: new Date(toDate) } };
    }

    // Fetch all data using transaction service
    const [expenses, expenseCount] = await Promise.all([
        findTransactionService({ ...dateFilter, sourceType: 'expense', isDeleted: false }),
        countTransactionService({ ...dateFilter, sourceType: 'expense', isDeleted: false })
    ]);

    // Calculate total expenses
    const totalAmount = expenses.reduce((sum, expense) => sum + (expense.amount || 0), 0);
    const averageExpense = expenseCount > 0 ? totalAmount / expenseCount : 0;

    // Calculate expenses by category using expenseCategory from transaction
    const expensesByCategoryMap = {};
    expenses.forEach(expense => {
        const category = expense.expenseCategory || 'Uncategorized';
        if (!expensesByCategoryMap[category]) {
            expensesByCategoryMap[category] = { total: 0, count: 0 };
        }
        expensesByCategoryMap[category].total += expense.amount || 0;
        expensesByCategoryMap[category].count += 1;
    });
    const expensesByCategory = Object.entries(expensesByCategoryMap).map(([category, data]) => ({
        category,
        total: data.total,
        count: data.count
    })).sort((a, b) => b.total - a.total);

    // Calculate expenses by type using payment method instead of expenseType
    const expensesByTypeMap = {};
    expenses.forEach(expense => {
        const type = expense.paymentMethodName || 'Cash';
        if (!expensesByTypeMap[type]) {
            expensesByTypeMap[type] = { total: 0, count: 0 };
        }
        expensesByTypeMap[type].total += expense.amount || 0;
        expensesByTypeMap[type].count += 1;
    });
    const expensesByType = Object.entries(expensesByTypeMap).map(([type, data]) => ({
        type,
        total: data.total,
        count: data.count
    })).sort((a, b) => b.total - a.total);

    // Find highest and lowest expenses
    const sortedByAmount = [...expenses].sort((a, b) => (b.amount || 0) - (a.amount || 0));
    const highestExpense = sortedByAmount[0] || null;
    const lowestExpense = sortedByAmount[sortedByAmount.length - 1] || null;

    // Get expense list (limited to 100, sorted by transactionDate desc)
    const expenseList = expenses
        .sort((a, b) => new Date(b.transactionDate) - new Date(a.transactionDate))
        .slice(0, 100)
        .map(expense => ({
            _id: expense._id,
            amount: expense.amount,
            type: expense.paymentMethodName || 'Cash',
            date: expense.transactionDate,
            notes: expense.notes,
            category: expense.expenseCategory || 'Uncategorized',
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
                category: item.category || 'Uncategorized',
                total: item.total,
                count: item.count,
                percentage: totalAmount > 0 ? ((item.total / totalAmount) * 100).toFixed(1) : 0
            })),
            byType: expensesByType.map(item => ({
                type: item.type || 'other',
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
            date: expense.date,
        }))
    };
};

// Expense Category Breakdown Report
export const getExpenseCategoryBreakdown = async (filters = {}) => {
    const { fromDate, toDate, period } = filters;

    let dateFilter = {};
    if (period === "today") {
        const { startOfDay, endOfDay } = getTodayRange();
        dateFilter = { transactionDate: { $gte: startOfDay, $lte: endOfDay } };
    } else if (period === "week") {
        const now = new Date();
        const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
        const endOfWeek = new Date(now.setDate(now.getDate() - now.getDay() + 6));
        dateFilter = { transactionDate: { $gte: startOfWeek, $lte: endOfWeek } };
    } else if (period === "month") {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        dateFilter = { transactionDate: { $gte: startOfMonth, $lte: endOfMonth } };
    } else if (period === "3month") {
        const now = new Date();
        const startOfThreeMonths = new Date(now.getFullYear(), now.getMonth() - 3, 1);
        const endOfCurrentMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        dateFilter = { transactionDate: { $gte: startOfThreeMonths, $lte: endOfCurrentMonth } };
    } else if (period === "year") {
        const now = new Date();
        const startOfYear = new Date(now.getFullYear(), 0, 1);
        const endOfYear = new Date(now.getFullYear(), 11, 31);
        dateFilter = { transactionDate: { $gte: startOfYear, $lte: endOfYear } };
    } else if (fromDate && toDate) {
        dateFilter = { transactionDate: { $gte: new Date(fromDate), $lte: new Date(toDate) } };
    }

    // Fetch all expense transactions
    const expenses = await findTransactionService({ ...dateFilter, sourceType: 'expense', isDeleted: false });

    // Calculate total expenses
    const totalAmount = expenses.reduce((sum, expense) => sum + (expense.amount || 0), 0);

    // Calculate expenses by category using expenseCategory from transaction
    const expensesByCategoryMap = {};
    expenses.forEach(expense => {
        const category = expense.expenseCategory || 'Uncategorized';
        if (!expensesByCategoryMap[category]) {
            expensesByCategoryMap[category] = { total: 0, count: 0 };
        }
        expensesByCategoryMap[category].total += expense.amount || 0;
        expensesByCategoryMap[category].count += 1;
    });
    const expensesByCategory = Object.entries(expensesByCategoryMap).map(([category, data]) => ({
        category,
        total: data.total,
        count: data.count,
        percentage: totalAmount > 0 ? ((data.total / totalAmount) * 100).toFixed(1) : 0
    })).sort((a, b) => b.total - a.total);

    // Calculate expenses by type using payment method instead of expenseType
    const expensesByTypeMap = {};
    expenses.forEach(expense => {
        const type = expense.paymentMethodName || 'Cash';
        if (!expensesByTypeMap[type]) {
            expensesByTypeMap[type] = { total: 0, count: 0 };
        }
        expensesByTypeMap[type].total += expense.amount || 0;
        expensesByTypeMap[type].count += 1;
    });
    const expensesByType = Object.entries(expensesByTypeMap).map(([type, data]) => ({
        type,
        total: data.total,
        count: data.count,
        percentage: totalAmount > 0 ? ((data.total / totalAmount) * 100).toFixed(1) : 0
    })).sort((a, b) => b.total - a.total);

    return {
        summary: {
            totalExpenses: totalAmount,
            expenseCount: expenses.length,
            categoryCount: expensesByCategory.length,
            typeCount: expensesByType.length
        },
        breakdowns: {
            expensesByCategory,
            expensesByType
        }
    };
};

// Expense Transactions with Pagination
export const getExpenseTransactions = async (filters = {}) => {
    const { fromDate, toDate, period, page = 1, limit = 50, category } = filters;

    let dateFilter = {};
    if (period === "today") {
        const { startOfDay, endOfDay } = getTodayRange();
        dateFilter = { transactionDate: { $gte: startOfDay, $lte: endOfDay } };
    } else if (period === "week") {
        const now = new Date();
        const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
        const endOfWeek = new Date(now.setDate(now.getDate() - now.getDay() + 6));
        dateFilter = { transactionDate: { $gte: startOfWeek, $lte: endOfWeek } };
    } else if (period === "month") {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        dateFilter = { transactionDate: { $gte: startOfMonth, $lte: endOfMonth } };
    } else if (period === "3month") {
        const now = new Date();
        const startOfThreeMonths = new Date(now.getFullYear(), now.getMonth() - 3, 1);
        const endOfCurrentMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        dateFilter = { transactionDate: { $gte: startOfThreeMonths, $lte: endOfCurrentMonth } };
    } else if (period === "year") {
        const now = new Date();
        const startOfYear = new Date(now.getFullYear(), 0, 1);
        const endOfYear = new Date(now.getFullYear(), 11, 31);
        dateFilter = { transactionDate: { $gte: startOfYear, $lte: endOfYear } };
    } else if (fromDate && toDate) {
        dateFilter = { transactionDate: { $gte: new Date(fromDate), $lte: new Date(toDate) } };
    }

    const matchQuery = { ...dateFilter, sourceType: 'expense', isDeleted: false };
    
    // Filter by category if provided
    if (category && category !== 'all') {
        matchQuery.expenseCategory = category;
    }

    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
        findTransactionService(matchQuery, {
            sort: { transactionDate: -1 },
            skip,
            limit
        }),
        countTransactionService(matchQuery)
    ]);

    return {
        data,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
    };
};

const prepareMainBusinessReport = async (filters = {}) => {
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
    } else if (period === "all") {
        dateFilter = {};
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
    const [orders, purchases, expenses, wastages, purchaseReturns, productReturns, salaryPayments, staffList] = await Promise.all([
        findOrderService({ ...dateFilter, status: "completed" }),
        findPurchaseService(dateFilter, { populate: 'supplier' }),
        findTransactionService({ ...dateFilter, sourceType: 'expense', isDeleted: false }),
        findWastageService(dateFilter),
        findPurchaseReturnService(dateFilter),
        findProductReturnService(dateFilter),
        findStaffSalaryPaymentService({ ...dateFilter, status: 'paid' }),
        findStaffService({})
    ]);

    // Get credits/debits account data using the shared service
    const creditsDebitsData = await getCreditsDebitsAccountData({
        fromDate,
        toDate,
        period,
        accountTypes: ['customer', 'supplier', 'general'] // Get all types
    });

    // Fetch previous period data for comparison
    const [previousOrders, previousPurchases, previousExpenses, previousWastages, previousPurchaseReturns, previousProductReturns, previousSalaryPayments] = await Promise.all([
        findOrderService({ ...previousDateFilter, status: "completed" }),
        findPurchaseService(previousDateFilter),
        findTransactionService({ ...previousDateFilter, sourceType: 'expense', isDeleted: false }),
        findWastageService(previousDateFilter),
        findPurchaseReturnService(previousDateFilter),
        findProductReturnService(previousDateFilter),
        findStaffSalaryPaymentService({ ...previousDateFilter, status: 'paid' })
    ]);

    // Use the reusable generateSalesReportData function for sales calculations
    const salesReportData = await generateSalesReportData({ fromDate, toDate, period, page: 1, limit: 100 });
    
    // Extract sales data from the report
    const totalSales = salesReportData.summary.totalSales;
    const totalDiscount = salesReportData.summary.totalDiscount;
    const salesCount = salesReportData.summary.salesCount;
    const retailSales = salesReportData.summary.retailSales;
    const wholesaleSales = salesReportData.summary.wholesaleSales;
    const avgOrderValue = salesReportData.summary.avgOrderValue;
    const totalCostOfGoodsSold = salesReportData.summary.totalCostOfGoodsSold;
    const salesMargin = salesReportData.summary.salesMargin;
    const grossProfit = salesReportData.summary.grossProfit;
    const grossMarginPercentage = salesReportData.summary.grossMarginPercentage;
    const salesByPaymentMethod = salesReportData.breakdowns.salesByPaymentMethod;
    const salesList = salesReportData.data;

    const totalPurchases = purchases.reduce((sum, purchase) => sum + (purchase.totalAmount || 0), 0);
    const purchaseCount = purchases.length;

    // Calculate unique supplier count
    const uniqueSuppliers = new Set(purchases.map(p => p.supplier?.toString()).filter(Boolean));
    const supplierCount = uniqueSuppliers.size;

    // Calculate average purchase value
    const avgPurchaseValue = purchaseCount > 0 ? totalPurchases / purchaseCount : 0;

    const totalExpenses = expenses.reduce((sum, expense) => sum + (expense.amount || 0), 0);
    const expenseCount = expenses.length;

    // Calculate average expense value
    const avgExpenseValue = expenseCount > 0 ? totalExpenses / expenseCount : 0;

    const totalWastage = wastages.reduce((sum, wastage) => sum + ((wastage.quantity || 0) * (wastage.costPrice || 0)), 0);
    const wastageCount = wastages.length;

    // Calculate wastage as percentage of purchases
    const wastagePercentOfPurchases = totalPurchases > 0 ? ((totalWastage / totalPurchases) * 100).toFixed(1) : 0;

    const totalPurchaseReturns = purchaseReturns.reduce((sum, ret) => sum + (ret.totalAmount || 0), 0);
    const purchaseReturnCount = purchaseReturns.length;

    const totalProductReturns = productReturns.reduce((sum, ret) => sum + (ret.refundAmount || 0), 0);
    const productReturnCount = productReturns.length;

    const totalSalaries = salaryPayments.reduce((sum, payment) => sum + (payment.amount || 0), 0);
    const salaryPaymentCount = salaryPayments.length;

    // Calculate average salary per staff and staff count
    const uniqueStaffPaid = new Set(salaryPayments.map(p => p.staffId?.toString()).filter(Boolean));
    const staffCount = uniqueStaffPaid.size;
    const avgSalaryPerStaff = staffCount > 0 ? totalSalaries / staffCount : 0;

    // Use credits/debits data from the shared service
    const totalReceivable = creditsDebitsData.summary.totalToReceive;
    const totalPayable = creditsDebitsData.summary.totalToGive;
    const qarzaReceivableCount = creditsDebitsData.accountsByType.customer?.count || 0;
    const qarzaPayableCount = creditsDebitsData.accountsByType.supplier?.count || 0;
    const generalAccountsCount = creditsDebitsData.accountsByType.general?.count || 0;
    const totalCreditsDebitsBalance = creditsDebitsData.summary.totalBalance;
    const totalCreditsDebitsPayments = creditsDebitsData.summary.totalPaymentsInPeriod;

    // Net profit calculation: Sales - COGS - Expenses - Wastage - Salaries - Product Returns + Purchase Returns
    const netProfit = totalSales - totalCostOfGoodsSold - totalExpenses - totalWastage - totalSalaries - totalProductReturns + totalPurchaseReturns;
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

    // Sales by payment method is now provided by generateSalesReportData
    // No need to recalculate here

    // Calculate purchases by supplier
    const purchasesBySupplierMap = {};
    purchases.forEach(purchase => {
        const supplierName = purchase.supplier?.name || 'Unknown Supplier';
        if (!purchasesBySupplierMap[supplierName]) {
            purchasesBySupplierMap[supplierName] = { total: 0, count: 0 };
        }
        purchasesBySupplierMap[supplierName].total += purchase.totalAmount || 0;
        purchasesBySupplierMap[supplierName].count += 1;
    });
    const purchasesBySupplier = Object.entries(purchasesBySupplierMap).map(([supplierName, data]) => ({
        _id: supplierName,
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
    // Sales list is now provided by generateSalesReportData
    // No need to regenerate here

    const purchasesList = await Promise.all(
        purchases
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .slice(0, 100)
            .map(async (purchase) => {
                // Fetch product and batch details for each item in the purchase
                const itemsWithDetails = await Promise.all(
                    (purchase.items || []).map(async (item) => {
                        let productName = 'Unknown';
                        let batchNumber = 'N/A';
                        let productDetails = null;
                        
                        // Fetch product details
                        if (item.product) {
                            try {
                                const products = await findProductService({ _id: item.product });
                                if (products && products[0]) {
                                    productName = products[0].name;
                                    productDetails = {
                                        productCode: products[0].productCode,
                                        category: products[0].category?.name || 'Uncategorized'
                                    };
                                }
                            } catch (error) {
                                console.error(`Error fetching product ${item.product}:`, error);
                            }
                        }
                        
                        // Fetch batch details
                        if (item.batch) {
                            try {
                                const batch = await findByIdBatchService(item.batch);
                                if (batch) {
                                    batchNumber = batch.batchNumber || 'N/A';
                                }
                            } catch (error) {
                                console.error(`Error fetching batch ${item.batch}:`, error);
                            }
                        }
                        
                        // Calculate item totals
                        const itemSubtotal = (item.price || 0) * (item.quantity || 0);
                        const itemDiscountAmount = item.discountType === 'fixed' 
                            ? (item.discount || 0)
                            : (itemSubtotal * (item.discount || 0) / 100);
                        const itemTaxAmount = item.taxType === 'fixed'
                            ? (item.tax || 0)
                            : ((itemSubtotal - itemDiscountAmount) * (item.tax || 0) / 100);
                        const itemTotal = itemSubtotal - itemDiscountAmount + itemTaxAmount;
                        
                        return {
                            productName: productName,
                            productCode: productDetails?.productCode || 'N/A',
                            category: productDetails?.category || 'N/A',
                            batchNumber: batchNumber,
                            quantity: item.quantity || 0,
                            price: item.price || 0,
                            costPrice: item.costPrice || 0,
                            discount: item.discount || 0,
                            discountType: item.discountType || 'percentage',
                            discountAmount: itemDiscountAmount,
                            tax: item.tax || 0,
                            taxType: item.taxType || 'percentage',
                            taxAmount: itemTaxAmount,
                            mfgDate: item.mfgDate || null,
                            expiryDate: item.expiryDate || null,
                            itemSubtotal: itemSubtotal,
                            itemTotal: itemTotal,
                            productId: item.product,
                            batchId: item.batch
                        };
                    })
                );
                
                // Calculate purchase-level totals
                const totalItemsSubtotal = itemsWithDetails.reduce((sum, item) => sum + item.itemSubtotal, 0);
                const totalItemsDiscount = itemsWithDetails.reduce((sum, item) => sum + item.discountAmount, 0);
                const totalItemsTax = itemsWithDetails.reduce((sum, item) => sum + item.taxAmount, 0);
                
                return {
                    _id: purchase._id,
                    invoiceNumber: purchase.invoiceNumber || 'N/A',
                    supplierName: purchase.supplier?.name || 'Unknown Supplier',
                    supplierId: purchase.supplier?._id || purchase.supplier,
                    // Amounts
                    totalAmount: purchase.totalAmount || 0,
                    subtotal: purchase.subtotal || 0,
                    discount: purchase.discount || 0,
                    discountType: purchase.discountType || 'percentage',
                    gst: purchase.gst || 0,
                    gstType: purchase.gstType || 'percentage',
                    shippingCost: purchase.shippingCost || 0,
                    paidAmount: purchase.paidAmount || 0,
                    // Calculated totals
                    totalItemsSubtotal: totalItemsSubtotal,
                    totalItemsDiscount: totalItemsDiscount,
                    totalItemsTax: totalItemsTax,
                    // Status and dates
                    status: purchase.status || 'ordered',
                    paymentStatus: purchase.paymentStatus || 'pending',
                    date: purchase.date || purchase.createdAt,
                    notes: purchase.notes || '',
                    // Items with all details
                    items: itemsWithDetails,
                    createdAt: purchase.createdAt
                };
            })
    );

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
            totalCostOfGoodsSold,
            grossProfit,
            grossMarginPercentage,
            netProfit,
            netMarginPercentage,
            retailSales,
            wholesaleSales,
            salesMargin,
            // Credits/Debits summary data
            totalCreditsDebitsBalance,
            totalCreditsDebitsPayments,
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
            generalAccountsCount,
            avgOrderValue,
            supplierCount,
            avgPurchaseValue,
            avgExpenseValue,
            avgSalaryPerStaff,
            staffCount,
            wastagePercentOfPurchases,
            // Credits/Debits details
            totalCreditsDebitsAccounts: creditsDebitsData.summary.totalAccounts,
            activeCreditsDebitsAccounts: creditsDebitsData.summary.activeAccounts,
            accountsWithBalance: creditsDebitsData.summary.accountsWithBalance,
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
                method: item._id || 'Cash',
                total: item.total,
                count: item.count,
                percentage: totalSales > 0 ? ((item.total / totalSales) * 100).toFixed(1) : 0
            })),
            purchasesBySupplier: purchasesBySupplier.map(item => ({
                supplierName: item._id || 'Unknown Supplier',
                total: item.total,
                count: item.count,
                percentage: totalPurchases > 0 ? ((item.total / totalPurchases) * 100).toFixed(1) : 0
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
            })),
            // Credits/Debits breakdowns
            creditsDebitsByAccountType: Object.entries(creditsDebitsData.accountsByType).map(([type, data]) => ({
                accountType: type,
                accountsCount: data.count,
                totalBalance: data.totalBalance,
                totalCashIn: data.totalCashIn,
                totalCashOut: data.totalCashOut,
                totalToReceive: data.totalToReceive,
                totalToGive: data.totalToGive,
                percentage: creditsDebitsData.summary.totalAccounts > 0 ? ((data.count / creditsDebitsData.summary.totalAccounts) * 100).toFixed(1) : 0
            })),
            creditsDebitsPaymentsByType: Object.entries(creditsDebitsData.paymentsByType).map(([type, data]) => ({
                paymentType: type,
                total: data.total,
                count: data.count,
                percentage: creditsDebitsData.summary.totalPaymentsInPeriod > 0 ? ((data.total / creditsDebitsData.summary.totalPaymentsInPeriod) * 100).toFixed(1) : 0
            }))
        },
        transactions: {
            sales: salesList.map(sale => ({
                id: sale._id,
                orderNumber: sale.orderNumber,
                amount: sale.totalAmount,
                subtotal: sale.subtotal,
                discountAmount: sale.discountAmount,
                discountType: sale.discountType,
                totalTaxAmount: sale.totalTaxAmount,
                // Cost and profit calculations
                totalCostPrice: sale.totalCostPrice,
                totalSalePrice: sale.totalSalePrice,
                totalItemCosts: sale.totalItemCosts,
                totalItemDiscounts: sale.totalItemDiscounts,
                totalItemTaxes: sale.totalItemTaxes,
                orderProfit: sale.orderProfit,
                orderMargin: sale.orderMargin,
                profitMargin: sale.profitMargin,
                // Customer and order details
                paymentMethod: sale.paymentMethod,
                customerName: sale.customerName,
                customerType: sale.customerType,
                customerId: sale.customerId,
                orderType: sale.orderType,
                waiter: sale.waiter,
                staffId: sale.staffId,
                note: sale.note,
                isPosOrder: sale.isPosOrder,
                status: sale.status,
                // All items with full details
                items: sale.items,
                date: sale.createdAt
            })),
            purchases: purchasesList.map(purchase => ({
                id: purchase._id,
                invoiceNumber: purchase.invoiceNumber,
                amount: purchase.totalAmount,
                subtotal: purchase.subtotal,
                discount: purchase.discount,
                discountType: purchase.discountType,
                gst: purchase.gst,
                gstType: purchase.gstType,
                shippingCost: purchase.shippingCost,
                paidAmount: purchase.paidAmount,
                totalItemsSubtotal: purchase.totalItemsSubtotal,
                totalItemsDiscount: purchase.totalItemsDiscount,
                totalItemsTax: purchase.totalItemsTax,
                supplierName: purchase.supplierName,
                supplierId: purchase.supplierId,
                status: purchase.status,
                paymentStatus: purchase.paymentStatus,
                notes: purchase.notes,
                items: purchase.items,
                date: purchase.date || purchase.createdAt
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
            })),
            creditsDebitsTransactions: creditsDebitsData.rawPayments
                .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                .slice(0, 100)
                .map(payment => {
                    // Find account details
                    const account = creditsDebitsData.rawAccounts.find(acc => acc._id.toString() === payment.qarzaAccountId?.toString());
                    return {
                        id: payment._id,
                        amount: payment.amount || 0,
                        type: payment.type,
                        accountName: account?.name || 'Unknown Account',
                        accountType: account?.type || 'general',
                        paymentMethod: payment.paymentMethod,
                        source: payment.source || 'manual',
                        notes: payment.notes || '',
                        date: payment.createdAt
                    };
                })
        }
    };
};

const getPreparedMainBusinessReport = async (filters = {}) => {
    const cacheKey = JSON.stringify(filters);
    const cached = preparedMainBusinessReports.get(cacheKey);
    if (cached && Date.now() - cached.createdAt < MAIN_BUSINESS_CACHE_TTL_MS) {
        return cached.promise;
    }

    const promise = prepareMainBusinessReport(filters).catch((error) => {
        preparedMainBusinessReports.delete(cacheKey);
        throw error;
    });
    preparedMainBusinessReports.set(cacheKey, { createdAt: Date.now(), promise });
    return promise;
};

export const getMainBusinessReport = (filters = {}) => getPreparedMainBusinessReport(filters);

export const getMainBusinessReportKPI = async (filters = {}) => {
    const report = await getPreparedMainBusinessReport(filters);
    return {
        summary: report.summary,
        details: report.details,
        comparison: report.comparison,
    };
};

export const getMainBusinessReportData = async (filters = {}) => {
    const report = await getPreparedMainBusinessReport(filters);
    return {
        breakdowns: report.breakdowns,
        transactions: report.transactions,
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
        findTransactionService({ ...dateFilter, sourceType: 'expense', isDeleted: false })
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

// Shared service to get credit/debit account data for integration with other reports
export const getCreditsDebitsAccountData = async (filters = {}) => {
    const { fromDate, toDate, period, accountTypes = [] } = filters;

    // Build date filter for payments if provided
    let dateFilter = {};
    if (period === "custom" && fromDate && toDate) {
        dateFilter = buildDateFilter(fromDate, toDate);
    } else if (period === "today") {
        const { startOfDay, endOfDay } = getTodayRange();
        dateFilter = { createdAt: { $gte: startOfDay, $lte: endOfDay } };
    } else if (period === "week") {
        const { startOfWeek, endOfWeek } = getWeekRange();
        dateFilter = { createdAt: { $gte: startOfWeek, $lte: endOfWeek } };
    } else if (period === "month") {
        const { startOfMonth, endOfMonth } = getMonthRange();
        dateFilter = { createdAt: { $gte: startOfMonth, $lte: endOfMonth } };
    } else if (period === "year") {
        const now = new Date();
        const startOfYear = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
        const endOfYear = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
        dateFilter = { createdAt: { $gte: startOfYear, $lte: endOfYear } };
    }

    // Build account filter
    let accountFilter = {};
    if (accountTypes.length > 0) {
        accountFilter.type = { $in: accountTypes };
    }

    // Fetch accounts and payments
    const [allAccounts, paymentsInPeriod] = await Promise.all([
        findQarzaAccountService(accountFilter),
        findQarzaPaymentService(dateFilter)
    ]);

    // Process accounts by type
    const accountsByType = allAccounts.reduce((acc, account) => {
        const type = account.type || 'general';
        if (!acc[type]) {
            acc[type] = {
                accounts: [],
                count: 0,
                totalBalance: 0,
                totalCashIn: 0,
                totalCashOut: 0,
                totalToReceive: 0,
                totalToGive: 0
            };
        }

        const accountBalance = account.overall || 0;
        const cashIn = account.cashIn || 0;
        const cashOut = account.cashOut || 0;
        
        let accountStatus = 'balanced';
        if (accountBalance > 0) {
            accountStatus = 'toReceive';
        } else if (accountBalance < 0) {
            accountStatus = 'toGive';
        }

        const accountData = {
            id: account._id,
            name: account.name,
            type: account.type,
            balance: accountBalance,
            cashIn: cashIn,
            cashOut: cashOut,
            status: accountStatus,
            phoneNo: account.phoneNo,
            address: account.address,
            isActive: account.isActive
        };

        acc[type].accounts.push(accountData);
        acc[type].count += 1;
        acc[type].totalBalance += accountBalance;
        acc[type].totalCashIn += cashIn;
        acc[type].totalCashOut += cashOut;
        
        if (accountStatus === 'toReceive') {
            acc[type].totalToReceive += Math.abs(accountBalance);
        } else if (accountStatus === 'toGive') {
            acc[type].totalToGive += Math.abs(accountBalance);
        }

        return acc;
    }, {});

    // Process payments by type and source
    const paymentsByType = paymentsInPeriod.reduce((acc, payment) => {
        const paymentType = payment.type || 'manual';
        const source = payment.source || 'manual';
        
        if (!acc[paymentType]) {
            acc[paymentType] = {
                total: 0,
                count: 0,
                bySource: {}
            };
        }
        
        if (!acc[paymentType].bySource[source]) {
            acc[paymentType].bySource[source] = { total: 0, count: 0 };
        }

        const amount = payment.amount || 0;
        acc[paymentType].total += amount;
        acc[paymentType].count += 1;
        acc[paymentType].bySource[source].total += amount;
        acc[paymentType].bySource[source].count += 1;

        return acc;
    }, {});

    // Calculate overall totals
    const totalAccounts = allAccounts.length;
    const totalBalance = allAccounts.reduce((sum, account) => sum + (account.overall || 0), 0);
    const totalCashIn = allAccounts.reduce((sum, account) => sum + (account.cashIn || 0), 0);
    const totalCashOut = allAccounts.reduce((sum, account) => sum + (account.cashOut || 0), 0);
    const totalToReceive = allAccounts.filter(a => (a.overall || 0) > 0).reduce((sum, account) => sum + (account.overall || 0), 0);
    const totalToGive = allAccounts.filter(a => (a.overall || 0) < 0).reduce((sum, account) => sum + Math.abs(account.overall || 0), 0);
    const totalPaymentsInPeriod = paymentsInPeriod.reduce((sum, payment) => sum + (payment.amount || 0), 0);

    return {
        accountsByType,
        paymentsByType,
        summary: {
            totalAccounts,
            totalBalance,
            totalCashIn,
            totalCashOut,
            totalToReceive,
            totalToGive,
            netBalance: totalCashIn - totalCashOut,
            totalPaymentsInPeriod,
            paymentsCountInPeriod: paymentsInPeriod.length,
            activeAccounts: allAccounts.filter(a => a.isActive).length,
            accountsWithBalance: allAccounts.filter(a => Math.abs(a.overall || 0) > 0).length
        },
        // Raw data for further processing if needed
        rawAccounts: allAccounts,
        rawPayments: paymentsInPeriod
    };
};

// Credit/Debit Report (Qarza) - Enhanced version with better data aggregation
export const getCreditDebitReport = async (filters = {}) => {
    const { type, search, page = 1, limit = 20, fromDate, toDate, period } = filters;

    // Build date filter if provided
    let dateFilter = {};
    if (period === "custom" && fromDate && toDate) {
        dateFilter = buildDateFilter(fromDate, toDate);
    } else if (period === "today") {
        const { startOfDay, endOfDay } = getTodayRange();
        dateFilter = { createdAt: { $gte: startOfDay, $lte: endOfDay } };
    } else if (period === "week") {
        const { startOfWeek, endOfWeek } = getWeekRange();
        dateFilter = { createdAt: { $gte: startOfWeek, $lte: endOfWeek } };
    } else if (period === "month") {
        const { startOfMonth, endOfMonth } = getMonthRange();
        dateFilter = { createdAt: { $gte: startOfMonth, $lte: endOfMonth } };
    }

    const matchQuery = {};
    if (type && type !== 'all') matchQuery.type = type;
    if (search) matchQuery.name = { $regex: search, $options: "i" };

    const skip = (page - 1) * limit;

    // Fetch all accounts and payments data using service functions
    const [allAccounts, allPayments, data, total] = await Promise.all([
        findQarzaAccountService({}),
        findQarzaPaymentService(dateFilter),
        findQarzaAccountService(matchQuery, { 
            sort: { createdAt: -1 }, 
            skip, 
            limit 
        }),
        countQarzaAccountService(matchQuery)
    ]);

    // Get recent payments for each account using service function
    const accountsWithPayments = await Promise.all(
        data.map(async (account) => {
            const payments = await findQarzaPaymentService({ 
                qarzaAccountId: account._id,
                ...dateFilter 
            }, {
                sort: { createdAt: -1 },
                limit: 10
            });
            
            // Calculate account balance and status
            let totalCashIn = 0;
            let totalCashOut = 0;
            
            payments.forEach(payment => {
                if (payment.type === 'cashin' || payment.type === 'credit_received') {
                    totalCashIn += payment.amount || 0;
                } else if (payment.type === 'cashout' || payment.type === 'credit_given') {
                    totalCashOut += payment.amount || 0;
                }
            });
            
            const currentBalance = account.overall || (account.cashIn - account.cashOut) || 0;
            const remainingBalance = totalCashIn - totalCashOut;
            
            let accountStatus = 'cleared';
            if (currentBalance > 0) {
                accountStatus = account.type === 'customer' ? 'toReceive' : 'toGive';
            } else if (currentBalance < 0) {
                accountStatus = account.type === 'customer' ? 'toGive' : 'toReceive';
            }

            return { 
                ...account.toObject(), 
                recentPayments: payments,
                currentBalance: currentBalance,
                remainingBalance: remainingBalance,
                accountStatus: accountStatus,
                totalTransactions: payments.length
            };
        })
    );

    // Calculate enhanced summary with all account types
    const summaryByType = allAccounts.reduce((acc, account) => {
        const accountType = account.type || 'general';
        if (!acc[accountType]) {
            acc[accountType] = {
                count: 0,
                totalBalance: 0,
                totalCashIn: 0,
                totalCashOut: 0,
                toReceive: 0,
                toGive: 0
            };
        }
        
        acc[accountType].count += 1;
        acc[accountType].totalBalance += account.overall || 0;
        acc[accountType].totalCashIn += account.cashIn || 0;
        acc[accountType].totalCashOut += account.cashOut || 0;
        
        if (account.status === 'toReceive') {
            acc[accountType].toReceive += Math.abs(account.overall || 0);
        } else if (account.status === 'toGive') {
            acc[accountType].toGive += Math.abs(account.overall || 0);
        }
        
        return acc;
    }, {});

    // Calculate payment activity within date range
    const paymentsByType = allPayments.reduce((acc, payment) => {
        const paymentType = payment.type || 'other';
        if (!acc[paymentType]) {
            acc[paymentType] = { count: 0, total: 0 };
        }
        acc[paymentType].count += 1;
        acc[paymentType].total += payment.overall || 0;
        return acc;
    }, {});

    // Overall totals
    const totalBalance = allAccounts.reduce((sum, account) => sum + (account.overall || 0), 0);
    const totalCashIn = allAccounts.reduce((sum, account) => sum + (account.cashIn || 0), 0);
    const totalCashOut = allAccounts.reduce((sum, account) => sum + (account.cashOut || 0), 0);
    const totalToReceive = allAccounts.filter(a => a.status === 'toReceive').reduce((sum, account) => sum + Math.abs(account.overall || 0), 0);
    const totalToGive = allAccounts.filter(a => a.status === 'toGive').reduce((sum, account) => sum + Math.abs(account.overall || 0), 0);

    return {
        data: accountsWithPayments,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        summary: {
            totalAccounts: allAccounts.length,
            totalBalance,
            totalCashIn,
            totalCashOut,
            totalToReceive,
            totalToGive,
            netBalance: totalCashIn - totalCashOut,
            summaryByType,
            paymentsByType,
            totalTransactions: allPayments.length,
            // Additional KPIs
            avgAccountBalance: allAccounts.length > 0 ? totalBalance / allAccounts.length : 0,
            activeAccounts: allAccounts.filter(a => a.isActive).length,
            accountsWithBalance: allAccounts.filter(a => Math.abs(a.overall || 0) > 0).length
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
const getInventoryContext = async (filters = {}) => {
    const { fromDate, toDate, categoryId, category, productName, search, productCode, tag } = filters;
    const productFilter = {};
    const nameSearch = productName || search;

    if (categoryId || category) productFilter.categoryName = categoryId || category;
    if (nameSearch || productCode) {
        productFilter.$or = [
            ...(nameSearch ? [{ name: { $regex: nameSearch, $options: "i" } }] : []),
            ...(productCode ? [
                { productCode: { $regex: productCode, $options: "i" } },
                { hotKeySku: { $regex: productCode, $options: "i" } },
                { barcode: { $regex: productCode, $options: "i" } },
            ] : []),
        ];
    }
    if (tag) productFilter.tags = tag;

    const dateFilter = buildDateFilter(fromDate, toDate);
    const transactionDate = dateFilter.createdAt;
    const withActive = (filter) => ({ ...filter, isDeleted: { $ne: true } });
    const [products, batches, purchases, orders, purchaseReturns, orderReturns, wastages] = await Promise.all([
        findProductService(withActive(productFilter)),
        findBatchService({ isActive: true }),
        findPurchaseService(withActive(transactionDate ? { date: transactionDate } : {})),
        findOrderService(withActive({ ...(transactionDate ? { createdAt: transactionDate } : {}), status: "completed" })),
        findDocs({ model: getLocalPurchaseReturnModel(), filter: withActive(transactionDate ? { returnDate: transactionDate } : {}) }),
        findProductReturnService(withActive(transactionDate ? { returnDate: transactionDate } : {})),
        findWastageService(withActive(transactionDate ? { wastageDate: transactionDate } : {})),
    ]);
    return { products, batches, purchases, orders, purchaseReturns, orderReturns, wastages };
};

const sumMatchingItems = (documents, productId, getProductId, getQuantity, getRevenue) => documents.reduce((result, document) => {
    const items = (document.items || []).filter(item => getProductId(item)?.toString() === productId);
    if (!items.length) return result;
    result.quantity += items.reduce((sum, item) => sum + Number(getQuantity(item) || 0), 0);
    result.frequency += 1;
    if (getRevenue) result.revenue += items.reduce((sum, item) => sum + Number(getRevenue(item) || 0), 0);
    return result;
}, { quantity: 0, frequency: 0, revenue: 0 });

const getInventoryProductStats = (product, context) => {
    const productId = product._id.toString();
    const purchase = sumMatchingItems(context.purchases, productId, item => item.product, item => item.quantity);
    const purchaseReturn = sumMatchingItems(context.purchaseReturns, productId, item => item.product, item => item.quantity);
    const order = sumMatchingItems(context.orders, productId, item => item.product, item => item.quantity,
        item => item.itemTotal ?? item.lineTotal ?? (Number(item.quantity || 0) * Number(item.unitPrice || 0)));
    const orderReturn = sumMatchingItems(context.orderReturns, productId, item => item.productId, item => item.quantity);
    const wastage = context.wastages.reduce((result, document) => {
        const items = (document.items || []).filter(item => item.product?.toString() === productId);
        if (!items.length) return result;
        result.quantity += items.reduce((sum, item) => sum + Number(item.quantity || 0), 0);
        result.frequency += 1;
        return result;
    }, { quantity: 0, frequency: 0 });
    const currentStock = context.batches
        .filter(batch => batch.product?.toString() === productId)
        .reduce((sum, batch) => sum + Number(batch.quantity || 0), 0);

    return {
        ...product,
        currentStock,
        totalPurchased: purchase.quantity,
        purchaseFrequency: purchase.frequency,
        purchaseReturnQuantity: purchaseReturn.quantity,
        purchaseReturnFrequency: purchaseReturn.frequency,
        totalSold: order.quantity,
        orderQuantity: order.quantity,
        orderFrequency: order.frequency,
        orderReturnQuantity: orderReturn.quantity,
        orderReturnFrequency: orderReturn.frequency,
        totalWasted: wastage.quantity,
        wastageQuantity: wastage.quantity,
        wastageFrequency: wastage.frequency,
        totalRevenue: order.revenue,
    };
};

export const getInventoryReportData = async (filters = {}) => {
    const page = Math.max(1, Number(filters.page) || 1);
    const limit = Math.max(1, Number(filters.limit) || 20);
    const context = await getInventoryContext(filters);
    const stats = context.products.map(product => getInventoryProductStats(product, context));
    const sortBy = filters.sortBy || "name";
    const sortField = { highest_sales: "totalRevenue", lowest_sales: "totalRevenue", most_returned: "orderReturnQuantity", stock_level: "currentStock" }[sortBy];
    stats.sort((a, b) => sortField
        ? (Number(a[sortField] || 0) - Number(b[sortField] || 0)) * (sortBy === "lowest_sales" ? 1 : -1)
        : String(a.name || "").localeCompare(String(b.name || "")));
    const start = (page - 1) * limit;
    return { data: stats.slice(start, start + limit), total: stats.length, page, limit, totalPages: Math.max(1, Math.ceil(stats.length / limit)) };
};

export const getInventoryKPIReport = async (filters = {}) => {
    const context = await getInventoryContext(filters);
    const stats = context.products.map(product => getInventoryProductStats(product, context));
    return {
        totalProducts: stats.length,
        currentStock: stats.reduce((sum, item) => sum + item.currentStock, 0),
        purchasedQuantity: stats.reduce((sum, item) => sum + item.totalPurchased, 0),
        purchaseFrequency: stats.reduce((sum, item) => sum + item.purchaseFrequency, 0),
        purchaseReturnQuantity: stats.reduce((sum, item) => sum + item.purchaseReturnQuantity, 0),
        purchaseReturnFrequency: stats.reduce((sum, item) => sum + item.purchaseReturnFrequency, 0),
        orderQuantity: stats.reduce((sum, item) => sum + item.orderQuantity, 0),
        orderFrequency: stats.reduce((sum, item) => sum + item.orderFrequency, 0),
        orderReturnQuantity: stats.reduce((sum, item) => sum + item.orderReturnQuantity, 0),
        orderReturnFrequency: stats.reduce((sum, item) => sum + item.orderReturnFrequency, 0),
        wastageQuantity: stats.reduce((sum, item) => sum + item.wastageQuantity, 0),
        wastageFrequency: stats.reduce((sum, item) => sum + item.wastageFrequency, 0),
        totalRevenue: stats.reduce((sum, item) => sum + item.totalRevenue, 0),
    };
};

export const getInventoryReport = async (filters = {}) => ({
    ...(await getInventoryReportData(filters)),
    summary: await getInventoryKPIReport(filters),
});

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
    const { search, sortBy = 'name', sortOrder = 'asc', page = 1, limit = 20, customerType } = filters;

    const matchQuery = {};
    if (search) {
        matchQuery.$or = [
            { name: { $regex: search, $options: "i" } },
            { phone: { $regex: search, $options: "i" } },
            { email: { $regex: search, $options: "i" } }
        ];
    }

    if (customerType && customerType !== 'all') {
        // Use frontend values directly (walkin, regular) as database now uses same values
        // Handle missing customerType field - treat as walkin for backward compatibility
        if (customerType === 'walkin') {
            const typeCondition = [
                { customerType: 'walkin' },
                { customerType: { $exists: false } }
            ];
            if (matchQuery.$or) {
                // Combine with existing $or (search)
                matchQuery.$and = [
                    { $or: matchQuery.$or },
                    { $or: typeCondition }
                ];
                delete matchQuery.$or;
            } else {
                matchQuery.$or = typeCondition;
            }
        } else {
            matchQuery.customerType = customerType;
        }
    }

    const skip = (page - 1) * limit;

    // Fetch data using service functions
    const [data, total] = await Promise.all([
        findCustomerService(matchQuery, { sort: { createdAt: -1 }, skip, limit }),
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
            ...customer,
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

// Customer Report KPI (for Customer Report page - full data without pagination)
export const getCustomerReportKPI = async (filters = {}) => {
    const { search, customerType, fromDate, toDate } = filters;

    const matchQuery = {};
    if (search) {
        matchQuery.$or = [
            { name: { $regex: search, $options: "i" } },
            { phone: { $regex: search, $options: "i" } },
            { email: { $regex: search, $options: "i" } }
        ];
    }

    if (customerType && customerType !== 'all') {
        // Use frontend values directly (walkin, regular) as database now uses same values
        // Handle missing customerType field - treat as walkin for backward compatibility
        if (customerType === 'walkin') {
            const typeCondition = [
                { customerType: 'walkin' },
                { customerType: { $exists: false } }
            ];
            if (matchQuery.$or) {
                // Combine with existing $or (search)
                matchQuery.$and = [
                    { $or: matchQuery.$or },
                    { $or: typeCondition }
                ];
                delete matchQuery.$or;
            } else {
                matchQuery.$or = typeCondition;
            }
        } else {
            matchQuery.customerType = customerType;
        }
    }

    // Build date filter for orders and new customers
    let dateFilter = {};
    if (fromDate && toDate) {
        const startDate = new Date(fromDate);
        startDate.setHours(0, 0, 0, 0);
        const endDate = new Date(toDate);
        endDate.setHours(23, 59, 59, 999);
        dateFilter = { createdAt: { $gte: startDate, $lte: endDate } };
    }

    // Fetch ALL customers for KPI calculations
    const allCustomers = await findCustomerService(matchQuery);
    const total = allCustomers.length;

    // Get all orders to calculate customer statistics
    const allOrders = await findOrderService({ status: "completed" });

    // Filter orders by date range if provided
    const filteredOrders = Object.keys(dateFilter).length > 0 
        ? allOrders.filter(o => {
            const orderDate = new Date(o.createdAt);
            return orderDate >= dateFilter.createdAt.$gte && orderDate <= dateFilter.createdAt.$lte;
        })
        : allOrders;

    // Calculate statistics for ALL customers
    const allCustomersWithStats = allCustomers.map(customer => {
        const customerId = customer._id.toString();
        const customerOrders = filteredOrders.filter(o => o.customerId?.toString() === customerId);

        const totalOrders = customerOrders.length;
        const totalSpent = customerOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
        const dueAmount = customerOrders.filter(o => o.paymentMethod === 'credit').reduce((sum, o) => sum + (o.totalAmount || 0), 0);
        const lastOrderDate = customerOrders.length > 0 ? customerOrders[0].createdAt : null;

        return {
            ...customer,
            totalOrders,
            totalSpent,
            dueAmount,
            lastOrderDate
        };
    });

    // Calculate KPI summary from ALL customers
    const totalCustomers = total;
    const totalOrders = allCustomersWithStats.reduce((sum, c) => sum + c.totalOrders, 0);
    const totalSales = allCustomersWithStats.reduce((sum, c) => sum + c.totalSpent, 0);
    const totalDue = allCustomersWithStats.reduce((sum, c) => sum + c.dueAmount, 0);
    const avgOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0;

    // Find top customer (highest sales)
    const topCustomerIndex = allCustomersWithStats.length > 0 
        ? allCustomersWithStats.reduce((maxIdx, c, idx, arr) => c.totalSpent > arr[maxIdx].totalSpent ? idx : maxIdx, 0)
        : -1;
    const topCustomer = topCustomerIndex >= 0 ? allCustomersWithStats[topCustomerIndex] : null;

    // Count new customers (created in the date range)
    const newCustomers = Object.keys(dateFilter).length > 0
        ? allCustomers.filter(c => {
            const createdDate = new Date(c.createdAt);
            return createdDate >= dateFilter.createdAt.$gte && createdDate <= dateFilter.createdAt.$lte;
        }).length
        : 0;

    return {
        data: {
            details: {
                totalCustomers
            },
            summary: {
                totalCustomers,
                totalSales,
                totalOrders,
                avgOrderValue,
                totalDue,
                topCustomer: topCustomer ? (topCustomer.name || 'N/A') : 'N/A',
                topCustomerAmount: topCustomer?.totalSpent || 0,
                newCustomers
            }
        }
    };
};

// Supplier Report
export const getSupplierReport = async (filters = {}) => {
    const { search, page = 1, limit = 20, fromDate, toDate, supplierName, paymentStatus } = filters;

    const matchQuery = {};
    
    // Combine search and supplierName for filtering
    const searchTerm = supplierName || search;
    if (searchTerm) {
        matchQuery.$or = [
            { name: { $regex: searchTerm, $options: "i" } },
            { phone: { $regex: searchTerm, $options: "i" } }
        ];
    }

    const skip = (page - 1) * limit;

    // Build date filter for purchases
    const purchaseFilter = {};
    if (fromDate || toDate) {
        const dateFilter = buildDateFilter(fromDate, toDate);
        purchaseFilter.createdAt = dateFilter.createdAt;
    }

    // Apply payment status filter
    if (paymentStatus && paymentStatus !== "all") {
        if (paymentStatus === "paid") {
            purchaseFilter.paymentStatus = "full";
        } else if (paymentStatus === "unpaid") {
            purchaseFilter.paymentStatus = { $in: ["partial", "unpaid"] };
            purchaseFilter.paidAmount = { $eq: 0 };
        } else if (paymentStatus === "partial") {
            purchaseFilter.paymentStatus = "partial";
        }
    }

    // Fetch data using service functions
    const [data, initialTotal] = await Promise.all([
        findSupplierService(matchQuery, { sort: { createdAt: -1 }, skip, limit }),
        countSupplierService(matchQuery)
    ]);
    
    let total = initialTotal;

    // Fetch ALL suppliers for KPI calculations (without pagination)
    const allSuppliers = await findSupplierService(matchQuery);

    // Get all purchases, returns, and qarza data to calculate supplier statistics
    const [allPurchases, allPurchaseReturns, allQarzaAccounts, allQarzaPayments] = await Promise.all([
        findPurchaseService(purchaseFilter),
        findPurchaseReturnService(purchaseFilter),
        findQarzaAccountService({ type: 'supplier' }),
        findQarzaPaymentService({})
    ]);

    // Calculate statistics for each supplier (paginated data for table)
    const suppliersWithStats = data.map(supplier => {
        const supplierId = supplier._id.toString();
        const supplierPurchases = allPurchases.filter(p => p.supplier?.toString() === supplierId);
        const supplierReturns = allPurchaseReturns.filter(r => r.supplier?.toString() === supplierId);
        
        // Find associated qarza account
        const qarzaAccount = allQarzaAccounts.find(qa => qa._id.toString() === supplier.qarzaAccountId?.toString());
        const qarzaPayments = qarzaAccount 
            ? allQarzaPayments.filter(qp => qp.qarzaAccountId?.toString() === qarzaAccount._id.toString())
            : [];

        // Financial KPIs
        const totalPurchases = supplierPurchases.reduce((sum, p) => sum + (p.totalAmount || 0), 0);
        const totalPaid = supplierPurchases.reduce((sum, p) => sum + (p.paidAmount || 0), 0);
        const totalDue = supplierPurchases.reduce((sum, p) => sum + ((p.totalAmount || 0) - (p.paidAmount || 0)), 0);
        const totalReturns = supplierReturns.reduce((sum, r) => sum + (r.totalRefundAmount || 0), 0);
        const netPurchaseValue = totalPurchases - totalReturns;
        const paymentCompletionRate = totalPurchases > 0 ? ((totalPaid / totalPurchases) * 100).toFixed(2) : 0;
        const averageOrderValue = supplierPurchases.length > 0 ? (totalPurchases / supplierPurchases.length).toFixed(2) : 0;

        // Operational KPIs
        const totalOrders = supplierPurchases.length;
        const totalReturnsCount = supplierReturns.length;
        const returnRate = totalOrders > 0 ? ((totalReturnsCount / totalOrders) * 100).toFixed(2) : 0;
        
        const orderStatusDistribution = {
            ordered: supplierPurchases.filter(p => p.status === 'ordered').length,
            delivered: supplierPurchases.filter(p => p.status === 'delivered').length,
            rejected: supplierPurchases.filter(p => p.status === 'rejected').length
        };
        
        const paymentStatusDistribution = {
            pending: supplierPurchases.filter(p => p.paymentStatus === 'pending').length,
            partial: supplierPurchases.filter(p => p.paymentStatus === 'partial').length,
            full: supplierPurchases.filter(p => p.paymentStatus === 'full').length
        };

        // Credit/Debit KPIs
        const creditPayments = qarzaPayments.filter(qp => qp.type === 'credit' || qp.type === 'cashin');
        const debitPayments = qarzaPayments.filter(qp => qp.type === 'debit' || qp.type === 'cashout');
        
        const totalCreditAmount = creditPayments.reduce((sum, qp) => sum + (qp.amount || 0), 0);
        const totalDebitAmount = debitPayments.reduce((sum, qp) => sum + (qp.amount || 0), 0);
        const netBalance = totalDebitAmount - totalCreditAmount;
        const totalCreditTransactions = creditPayments.length;
        const totalDebitTransactions = debitPayments.length;

        return {
            ...supplier,
            // Financial KPIs
            totalPurchases,
            totalPaid,
            totalDue,
            totalReturns,
            netPurchaseValue,
            paymentCompletionRate,
            averageOrderValue,
            // Operational KPIs
            totalOrders,
            totalReturnsCount,
            returnRate,
            orderStatusDistribution,
            paymentStatusDistribution,
            // Credit/Debit KPIs
            totalCreditAmount,
            totalDebitAmount,
            netBalance,
            totalCreditTransactions,
            totalDebitTransactions,
            hasQarzaAccount: !!qarzaAccount,
            // Purchase history for detail modal
            purchases: supplierPurchases.map(p => ({
                _id: p._id,
                createdAt: p.createdAt,
                invoiceNumber: p.invoiceNumber,
                totalAmount: p.totalAmount,
                paidAmount: p.paidAmount,
                status: p.status
            }))
        };
    });

    // Add lastPurchase date for display
    suppliersWithStats.forEach(supplier => {
        const supplierPurchases = allPurchases.filter(p => p.supplier?.toString() === supplier._id.toString());
        if (supplierPurchases.length > 0) {
            supplier.lastPurchase = new Date(Math.max(...supplierPurchases.map(p => new Date(p.createdAt))));
        } else {
            supplier.lastPurchase = null;
        }
    });

    // Sort by totalPurchases descending by default
    suppliersWithStats.sort((a, b) => (b.totalPurchases || 0) - (a.totalPurchases || 0));

    // Filter out suppliers with no purchases when payment status filter is applied
    // When paymentStatus is "all", show all suppliers including those with no purchases
    if (paymentStatus && paymentStatus !== "all") {
        const filteredSuppliers = suppliersWithStats.filter(s => s.totalOrders > 0);
        // Update total count based on filtered results
        total = filteredSuppliers.length;
        suppliersWithStats.length = 0;
        suppliersWithStats.push(...filteredSuppliers);
    } else {
        // When "all" is selected, ensure total reflects the initial count
        total = initialTotal;
    }

    // Add rank to each supplier
    suppliersWithStats.forEach((supplier, index) => {
        supplier.rank = skip + index + 1;
    });

    // Calculate statistics for ALL suppliers (for KPI summary)
    const allSuppliersWithStats = allSuppliers.map(supplier => {
        const supplierId = supplier._id.toString();
        const supplierPurchases = allPurchases.filter(p => p.supplier?.toString() === supplierId);
        const supplierReturns = allPurchaseReturns.filter(r => r.supplier?.toString() === supplierId);
        
        const qarzaAccount = allQarzaAccounts.find(qa => qa._id.toString() === supplier.qarzaAccountId?.toString());
        const qarzaPayments = qarzaAccount 
            ? allQarzaPayments.filter(qp => qp.qarzaAccountId?.toString() === qarzaAccount._id.toString())
            : [];

        const totalPurchases = supplierPurchases.reduce((sum, p) => sum + (p.totalAmount || 0), 0);
        const totalPaid = supplierPurchases.reduce((sum, p) => sum + (p.paidAmount || 0), 0);
        const totalDue = totalPurchases - totalPaid;
        const totalReturns = supplierReturns.reduce((sum, r) => sum + (r.totalAmount || 0), 0);
        const totalOrders = supplierPurchases.length;
        const totalReturnsCount = supplierReturns.length;
        const returnRate = totalOrders > 0 ? ((totalReturnsCount / totalOrders) * 100).toFixed(2) : 0;
        
        const totalCreditAmount = qarzaPayments.reduce((sum, qp) => sum + (qp.creditAmount || 0), 0);
        const totalDebitAmount = qarzaPayments.reduce((sum, qp) => sum + (qp.debitAmount || 0), 0);
        const netBalance = totalCreditAmount - totalDebitAmount;

        return {
            totalPurchases,
            totalPaid,
            totalDue,
            totalReturns,
            totalOrders,
            totalReturnsCount,
            returnRate,
            totalCreditAmount,
            totalDebitAmount,
            netBalance,
            hasQarzaAccount: !!qarzaAccount
        };
    });

    // Calculate summary statistics from ALL suppliers
    const topSupplierIndex = allSuppliersWithStats.length > 0 
        ? allSuppliersWithStats.reduce((maxIdx, s, idx, arr) => s.totalPurchases > arr[maxIdx].totalPurchases ? idx : maxIdx, 0)
        : -1;

    const summary = {
        totalSuppliers: total,
        totalPurchases: allSuppliersWithStats.reduce((sum, s) => sum + s.totalPurchases, 0),
        totalPaid: allSuppliersWithStats.reduce((sum, s) => sum + s.totalPaid, 0),
        totalDue: allSuppliersWithStats.reduce((sum, s) => sum + s.totalDue, 0),
        totalReturns: allSuppliersWithStats.reduce((sum, s) => sum + s.totalReturns, 0),
        totalOrders: allSuppliersWithStats.reduce((sum, s) => sum + s.totalOrders, 0),
        totalReturnsCount: allSuppliersWithStats.reduce((sum, s) => sum + s.totalReturnsCount, 0),
        averageReturnRate: total > 0 ? (allSuppliersWithStats.reduce((sum, s) => sum + parseFloat(s.returnRate || 0), 0) / total).toFixed(2) : 0,
        totalCreditAmount: allSuppliersWithStats.reduce((sum, s) => sum + s.totalCreditAmount, 0),
        totalDebitAmount: allSuppliersWithStats.reduce((sum, s) => sum + s.totalDebitAmount, 0),
        netBalance: allSuppliersWithStats.reduce((sum, s) => sum + s.netBalance, 0),
        suppliersWithQarzaAccount: allSuppliersWithStats.filter(s => s.hasQarzaAccount).length,
        topSupplier: topSupplierIndex >= 0 ? { name: allSuppliers[topSupplierIndex]?.name || 'N/A', amount: allSuppliersWithStats[topSupplierIndex].totalPurchases } : null
    };

    return {
        data: suppliersWithStats,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        summary
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
        findStaffService(matchQuery, { sort: { createdAt: -1 }, skip, limit }),
        countStaffService(matchQuery)
    ]);

    // Fetch ALL staff for KPI calculations (without pagination)
    const allStaff = await findStaffService(matchQuery);

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

            // Calculate expected salary based on salary type
            let expectedSalary = 0;
            if (staff.salaryType === 'fixed') {
                expectedSalary = staff.monthlySalary || 0;
            } else if (staff.salaryType === 'daily') {
                // For daily wage, calculate based on present days
                let presentDays = 0;
                attendanceRecords.forEach(record => {
                    const staffAttendance = record.attendance.find(a => a.staff.toString() === staff._id.toString());
                    if (staffAttendance && (staffAttendance.status === 'present' || staffAttendance.status === 'late')) {
                        presentDays++;
                    }
                });
                expectedSalary = (staff.dailyRate || 0) * presentDays;
            }

            // Calculate remaining salary
            const remainingSalary = expectedSalary - totalPaid;

            // Calculate net payable
            const monthlySalary = staff.salaryType === 'fixed' ? (staff.monthlySalary || 0) : 0;
            const netPayable = monthlySalary - totalPaid - deductions + advance;

            return {
                ...staff,
                totalOrders,
                totalSales,
                retailSales,
                wholesaleSales,
                totalPresentDays,
                totalAbsentDays,
                totalWorkingHours,
                expectedSalary,
                salaryPaid: totalPaid,
                remainingSalary,
                advance,
                deductions,
                netPayable,
                paymentCount: salaryPayments.length,
            };
        })
    );

    // Calculate statistics for ALL staff (for KPI summary)
    const allStaffWithStats = await Promise.all(
        allStaff.map(async (staff) => {
            const salaryPayments = await findStaffSalaryPaymentService({ 
                staffId: staff._id,
                ...(Object.keys(dateFilter).length > 0 ? dateFilter : {})
            });
            const totalPaid = salaryPayments.reduce((sum, payment) => sum + (payment.amount || 0), 0);
            const advance = salaryPayments.reduce((sum, payment) => sum + (payment.advance || 0), 0);
            const deductions = salaryPayments.reduce((sum, payment) => sum + (payment.deduction || 0), 0);

            const orderFilter = {
                ...(Object.keys(dateFilter).length > 0 ? dateFilter : {}),
                ...orderTypeFilter,
                'staffId': staff._id
            };
            
            const orders = await findOrderService(orderFilter);
            const totalOrders = orders.length;
            const totalSales = orders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);

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
                    if (staffAttendance.status === 'present' || staffAttendance.status === 'late') {
                        totalWorkingHours += 8 - (staffAttendance.lateHours || 0);
                    }
                }
            });

            return {
                totalSales,
                totalOrders,
                totalPaid,
                advance,
                totalPresentDays,
                totalAbsentDays,
                totalWorkingHours
            };
        })
    );

    // Calculate summary totals from ALL staff
    const grandTotalSales = allStaffWithStats.reduce((sum, staff) => sum + staff.totalSales, 0);
    const grandTotalOrders = allStaffWithStats.reduce((sum, staff) => sum + staff.totalOrders, 0);
    const grandTotalSalaryPaid = allStaffWithStats.reduce((sum, staff) => sum + staff.totalPaid, 0);
    const totalAdvances = allStaffWithStats.reduce((sum, staff) => sum + staff.advance, 0);
    const totalWorkingHours = allStaffWithStats.reduce((sum, staff) => sum + staff.totalWorkingHours, 0);
    const totalPresentDays = allStaffWithStats.reduce((sum, staff) => sum + staff.totalPresentDays, 0);
    const totalAbsentDays = allStaffWithStats.reduce((sum, staff) => sum + staff.totalAbsentDays, 0);
    
    // Calculate average salary
    const averageSalary = total > 0 ? grandTotalSalaryPaid / total : 0;
    
    // Calculate average attendance percentage
    const totalDaysPossible = totalPresentDays + totalAbsentDays;
    const avgAttendancePercent = totalDaysPossible > 0 ? (totalPresentDays / totalDaysPossible) * 100 : 0;
    
    // Calculate average working hours per staff
    const avgWorkingHours = total > 0 ? totalWorkingHours / total : 0;
    
    // Find top performer (highest sales) from ALL staff
    const topPerformerIndex = allStaffWithStats.length > 0 
        ? allStaffWithStats.reduce((maxIdx, s, idx, arr) => s.totalSales > arr[maxIdx].totalSales ? idx : maxIdx, 0)
        : -1;
    const topPerformer = topPerformerIndex >= 0 ? allStaff[topPerformerIndex] : null;
    
    // Find highest attendance from ALL staff
    const highestAttendance = allStaffWithStats.length > 0 
        ? Math.max(...allStaffWithStats.map(s => {
            const days = s.totalPresentDays + s.totalAbsentDays;
            return days > 0 ? (s.totalPresentDays / days) * 100 : 0;
        }))
        : 0;

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
        data: {
            staffMetrics: finalData,
            details: {
                totalStaff: total
            },
            summary: {
                totalSalariesPaid: grandTotalSalaryPaid,
                averageSalary,
                totalAdvances,
                totalWorkingHours,
                avgAttendancePercent,
                totalPresentDays,
                totalAbsentDays,
                topPerformer: topPerformer ? (topPerformer.name || topPerformer.fullName || 'N/A') : 'N/A',
                avgWorkingHours,
                highestAttendance
            }
        },
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
    };
};

// Staff KPI Report (for summary cards only - no pagination)
export const getStaffKPIReport = async (filters = {}) => {
    const { 
        role, 
        status, 
        fromDate,
        toDate,
        staffId,
        orderType 
    } = filters;

    const matchQuery = {};
    if (role) matchQuery.role = role;
    if (status) matchQuery.status = status;
    if (staffId) matchQuery._id = staffId;

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

    // Fetch ALL staff for KPI calculations
    const allStaff = await findStaffService(matchQuery);
    const total = allStaff.length;

    // Calculate statistics for ALL staff
    const allStaffWithStats = await Promise.all(
        allStaff.map(async (staff) => {
            const salaryPayments = await findStaffSalaryPaymentService({ 
                staffId: staff._id,
                ...(Object.keys(dateFilter).length > 0 ? dateFilter : {})
            });
            const totalPaid = salaryPayments.reduce((sum, payment) => sum + (payment.amount || 0), 0);
            const advance = salaryPayments.reduce((sum, payment) => sum + (payment.advance || 0), 0);
            const deductions = salaryPayments.reduce((sum, payment) => sum + (payment.deduction || 0), 0);

            // Calculate expected salary based on salary type
            let expectedSalary = 0;
            if (staff.salaryType === 'fixed') {
                expectedSalary = staff.monthlySalary || 0;
            } else if (staff.salaryType === 'daily') {
                // For daily wage, calculate based on present days
                const attendanceFilter = {
                    ...(Object.keys(dateFilter).length > 0 ? dateFilter : {})
                };
                const attendanceRecords = await findStaffAttendanceService(attendanceFilter);
                let presentDays = 0;
                attendanceRecords.forEach(record => {
                    const staffAttendance = record.attendance.find(a => a.staff.toString() === staff._id.toString());
                    if (staffAttendance && (staffAttendance.status === 'present' || staffAttendance.status === 'late')) {
                        presentDays++;
                    }
                });
                expectedSalary = (staff.dailyRate || 0) * presentDays;
            }

            const orderFilter = {
                ...(Object.keys(dateFilter).length > 0 ? dateFilter : {}),
                ...orderTypeFilter,
                'staffId': staff._id
            };
            
            const orders = await findOrderService(orderFilter);
            const totalOrders = orders.length;
            const totalSales = orders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);

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
                    if (staffAttendance.status === 'present' || staffAttendance.status === 'late') {
                        totalWorkingHours += 8 - (staffAttendance.lateHours || 0);
                    }
                }
            });

            return {
                totalSales,
                totalOrders,
                totalPaid,
                advance,
                expectedSalary,
                totalPresentDays,
                totalAbsentDays,
                totalWorkingHours
            };
        })
    );

    // Calculate summary totals from ALL staff
    const grandTotalSales = allStaffWithStats.reduce((sum, staff) => sum + staff.totalSales, 0);
    const grandTotalOrders = allStaffWithStats.reduce((sum, staff) => sum + staff.totalOrders, 0);
    const grandTotalSalaryPaid = allStaffWithStats.reduce((sum, staff) => sum + staff.totalPaid, 0);
    const totalExpectedSalary = allStaffWithStats.reduce((sum, staff) => sum + staff.expectedSalary, 0);
    const totalAdvances = allStaffWithStats.reduce((sum, staff) => sum + staff.advance, 0);
    const totalWorkingHours = allStaffWithStats.reduce((sum, staff) => sum + staff.totalWorkingHours, 0);
    const totalPresentDays = allStaffWithStats.reduce((sum, staff) => sum + staff.totalPresentDays, 0);
    const totalAbsentDays = allStaffWithStats.reduce((sum, staff) => sum + staff.totalAbsentDays, 0);
    
    // Calculate remaining salary
    const remainingSalary = totalExpectedSalary - grandTotalSalaryPaid;
    
    // Calculate average salary
    const averageSalary = total > 0 ? grandTotalSalaryPaid / total : 0;
    
    // Calculate average attendance percentage
    const totalDaysPossible = totalPresentDays + totalAbsentDays;
    const avgAttendancePercent = totalDaysPossible > 0 ? (totalPresentDays / totalDaysPossible) * 100 : 0;
    
    // Calculate average working hours per staff
    const avgWorkingHours = total > 0 ? totalWorkingHours / total : 0;
    
    // Find top performer (highest sales) from ALL staff
    const topPerformerIndex = allStaffWithStats.length > 0 
        ? allStaffWithStats.reduce((maxIdx, s, idx, arr) => s.totalSales > arr[maxIdx].totalSales ? idx : maxIdx, 0)
        : -1;
    const topPerformer = topPerformerIndex >= 0 ? allStaff[topPerformerIndex] : null;
    
    // Find highest attendance from ALL staff
    const highestAttendance = allStaffWithStats.length > 0 
        ? Math.max(...allStaffWithStats.map(s => {
            const days = s.totalPresentDays + s.totalAbsentDays;
            return days > 0 ? (s.totalPresentDays / days) * 100 : 0;
        }))
        : 0;

    return {
        data: {
            details: {
                totalStaff: total
            },
            summary: {
                totalStaff: total,
                totalExpectedSalary,
                totalSalariesPaid: grandTotalSalaryPaid,
                remainingSalary,
                totalAdvances,
                topPerformer: topPerformer ? (topPerformer.name || topPerformer.fullName || 'N/A') : 'N/A',
                averageSalary,
                totalWorkingHours,
                avgAttendancePercent,
                totalPresentDays,
                totalAbsentDays,
                avgWorkingHours,
                highestAttendance
            }
        }
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
        findTransactionService({ ...dateFilter, sourceType: 'expense', isDeleted: false }),
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
    const { fromDate, toDate, categoryId, search, period = "month", page = 1, limit = 20 } = filters;

    const matchQuery = {};

    let dateFilter = {};
    if (period === "custom" && fromDate && toDate) {
        dateFilter = buildDateFilter(fromDate, toDate);
    } else if (period === "today") {
        const now = new Date();
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
        dateFilter = { createdAt: { $gte: startOfDay, $lte: endOfDay } };
    } else if (period === "month") {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
        dateFilter = { createdAt: { $gte: startOfMonth, $lte: endOfMonth } };
    } else if (period === "3month") {
        const now = new Date();
        const startOfThreeMonths = new Date(now.getFullYear(), now.getMonth() - 3, 1);
        const endOfCurrentMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
        dateFilter = { createdAt: { $gte: startOfThreeMonths, $lte: endOfCurrentMonth } };
    } else if (period === "year") {
        const now = new Date();
        const startOfYear = new Date(now.getFullYear(), 0, 1);
        const endOfYear = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
        dateFilter = { createdAt: { $gte: startOfYear, $lte: endOfYear } };
    }
    
    if (Object.keys(dateFilter).length > 0) {
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
        findTransactionService({ ...matchQuery, sourceType: 'expense', isDeleted: false }, { 
            sort: { transactionDate: -1 }, 
            skip, 
            limit 
        }),
        countTransactionService({ ...matchQuery, sourceType: 'expense', isDeleted: false }),
        findExpenseCategoryService({})
    ]);

    // Calculate totals by category manually using expenseCategory from transaction
    const categoryTotalsMap = {};
    data.forEach(expense => {
        const categoryName = expense.expenseCategory || 'Uncategorized';
        
        if (!categoryTotalsMap[categoryName]) {
            categoryTotalsMap[categoryName] = {
                category: categoryName,
                total: 0,
                count: 0
            };
        }
        
        categoryTotalsMap[categoryName].total += expense.amount || 0;
        categoryTotalsMap[categoryName].count += 1;
    });
    
    const categoryTotals = Object.values(categoryTotalsMap);

    // Calculate overall total manually
    const overallTotal = data.reduce((sum, expense) => sum + (expense.amount || 0), 0);
    const averageExpense = data.length > 0 ? overallTotal / data.length : 0;
    const highestExpense = data.length > 0 ? Math.max(...data.map(e => e.amount || 0)) : 0;
    const lowestExpense = data.length > 0 ? Math.min(...data.map(e => e.amount || 0)) : 0;
    
    // Calculate category breakdown with proper structure
    const expensesByCategory = categoryTotals.map(item => ({
        category: item.category,
        total: item.total,
        count: item.count,
        percentage: overallTotal > 0 ? ((item.total / overallTotal) * 100).toFixed(1) : 0
    }));
    
    // Calculate type breakdown using payment method instead of expenseType
    const typeTotalsMap = {};
    data.forEach(expense => {
        const type = expense.paymentMethodName || 'Cash';
        if (!typeTotalsMap[type]) {
            typeTotalsMap[type] = { total: 0, count: 0 };
        }
        typeTotalsMap[type].total += expense.amount || 0;
        typeTotalsMap[type].count += 1;
    });
    
    const expensesByType = Object.keys(typeTotalsMap).map(type => ({
        type,
        total: typeTotalsMap[type].total,
        count: typeTotalsMap[type].count,
        percentage: overallTotal > 0 ? ((typeTotalsMap[type].total / overallTotal) * 100).toFixed(1) : 0
    }));

    return {
        data: {
            summary: {
                totalExpenses: overallTotal,
                averageExpense,
                highestExpense,
                lowestExpense,
                dailyAverage: overallTotal, // Simplified for now
                weeklyAverage: overallTotal, // Simplified for now
                monthlyProjection: overallTotal, // Simplified for now
                topCategory: expensesByCategory.length > 0 ? expensesByCategory[0].category : null,
                topCategoryPercentage: expensesByCategory.length > 0 ? expensesByCategory[0].percentage : 0,
                trend: 0 // Simplified for now
            },
            details: {
                expenseCount: data.length,
                categoryCount: categoryTotals.length,
                typeCount: Object.keys(typeTotalsMap).length
            },
            breakdowns: {
                expensesByCategory,
                expensesByType
            },
            transactions: {
                expenses: data
            }
        },
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
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

    // Fetch data using service functions with options
    const [data, total] = await Promise.all([
        findWastageService(matchQuery, {
            populate: ["product", "batch"],
            sort: { createdAt: -1 },
            skip,
            limit
        }),
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

    // Fetch data using main DB service function
    const ActivityLogModel = getActivityLogModel();
    const [data, total] = await Promise.all([
        findDocs({
            model: ActivityLogModel,
            filter: matchQuery,
            options: {
                populate: "user",
                select: "name email",
                sort: { createdAt: -1 },
                skip,
                limit
            }
        }),
        countDocs({
            model: ActivityLogModel,
            filter: matchQuery
        })
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

    // Fetch low stock batches using service function with options
    const lowStockBatches = await findBatchService({
        quantity: { $gt: 0, $lte: 10 },
        isActive: true
    }, {
        populate: { path: "product", select: "name defaultSalePrice" },
        sort: { quantity: 1 },
        limit: limitNum
    });

    return lowStockBatches;
};

// Near Expiry Products
export const getNearExpiryProducts = async (filters = {}) => {
    const { limit = 10 } = filters;
    const limitNum = parseInt(limit) || 10;

    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    // Fetch near expiry batches using service function with options
    const nearExpiryBatches = await findBatchService({
        expiryDate: { $lte: thirtyDaysFromNow, $gte: new Date() },
        quantity: { $gt: 0 },
        isActive: true
    }, {
        populate: { path: "product", select: "name defaultSalePrice" },
        sort: { expiryDate: 1 },
        limit: limitNum
    });

    return nearExpiryBatches;
};

// Recent Sales
export const getRecentSales = async (filters = {}) => {
    const { limit = 10 } = filters;

    // Fetch recent sales using service function with options
    const recentSales = await findOrderService({ status: "completed" }, {
        populate: { path: "items.product", select: "name" },
        sort: { createdAt: -1 },
        limit
    });

    return recentSales;
};

// Recent Purchases
export const getRecentPurchases = async (filters = {}) => {
    const { limit = 10 } = filters;

    // Fetch recent purchases using service function with options
    const recentPurchases = await findPurchaseService({}, {
        populate: [{ path: "supplier", select: "name" }, { path: "items.product", select: "name" }],
        sort: { createdAt: -1 },
        limit
    });

    return recentPurchases;
};
