import asyncHandler from "express-async-handler";
import ErrorResponse from "../../../common/utils/ErrorResponse.js";
import { getLocalOrderModel, getLocalHoldOrderModel, getLocalBatchModel, getLocalProductModel, getLocalStaffModel } from "../../../configs/connect.db.js";
import { adjustStock } from "../../../common/services/stockManager.js";
import { findDocs, findOneDoc, updateDocs } from "../../../common/services/db/mongodbCentralizedCrud.service.js";
import {
    orderCreate as orderCreateService,
    getAllOrders as getAllOrdersService,
    findOrderByNumber as findOrderByNumberService,
    orderDelete as orderDeleteService,
    countOrders as countOrdersService,
    getOrderById as getOrderByIdService,
    getPaginatedOrders as getPaginatedOrdersService,
    getOrdersByCustomer as getOrdersByCustomerService,
} from "../services/order.service.js";
import {
    countHoldOrderService,
} from "../services/holdOrder.crud.js";
import { findByIdBatchService } from "../../productPurchases/services/batch.crud.js";
import { createStaffSaleBillFromPOS } from "../../staff/services/staff.service.js";
import { createOrderPayment, getOrderPayments, calculateOrderPaymentStatus, recalculateOrderPaidAmount } from "../services/orderPayment.service.js";
import { getTransactions, deleteTransaction } from "../../transactions/services/transaction.service.js";

// ─────────────────────────────────────────────────────────────────────────────
//  GET /orders/generate-number
//  Returns a unique short order number — e.g. O-0001
//  Uses 4-digit format with leading zeros and duplicate detection
// ─────────────────────────────────────────────────────────────────────────────
export const generateOrderNumber = asyncHandler(async (req, res) => {
    const OrderModel = getLocalOrderModel();
    const HoldOrderModel = getLocalHoldOrderModel();
    
    // Find the highest existing order number to maintain sequence
    const existingOrders = await findDocs({
        model: OrderModel
    }, {
        select: "orderNumber",
        sort: { createdAt: -1 },
        limit: 100
    });
    const existingHoldOrders = await findDocs({
        model: HoldOrderModel
    }, {
        select: "orderNumber",
        sort: { createdAt: -1 },
        limit: 100
    });
    
    // Extract numeric parts from existing order numbers (format: O-0001 or O-1234)
    const extractNumber = (orderNumber) => {
        if (!orderNumber || !orderNumber.startsWith('O-')) return 0;
        const numStr = orderNumber.slice(2);
        return parseInt(numStr) || 0;
    };
    
    const allNumbers = [
        ...existingOrders.map(o => extractNumber(o.orderNumber)),
        ...existingHoldOrders.map(o => extractNumber(o.orderNumber))
    ];
    
    const maxNumber = Math.max(...allNumbers, 0);
    
    // Start from maxNumber + 1, or 1 if no orders exist
    let candidateNumber = maxNumber + 1;
    let finalNumber;
    
    // Generate unique 4-digit number with leading zeros
    while (true) {
        // Format as 4-digit with leading zeros (e.g., 1 -> 0001, 123 -> 0123)
        const paddedNumber = String(candidateNumber).padStart(4, '0');
        const orderNumber = `O-${paddedNumber}`;
        
        // Check for duplicates in both collections
        const [orderExists, holdExists] = await Promise.all([
            findOneDoc({
                model: OrderModel,
                filter: { orderNumber }
            }),
            findOneDoc({
                model: HoldOrderModel,
                filter: { orderNumber }
            })
        ]);
        
        if (!orderExists && !holdExists) {
            finalNumber = orderNumber;
            break;
        }
        
        candidateNumber++;
    }
    
    res.status(200).json({ success: true, orderNumber: finalNumber });
});

// ─────────────────────────────────────────────────────────────────────────────
//  GET /orders
//  Returns all completed/cancelled orders, newest first.
// ─────────────────────────────────────────────────────────────────────────────
export const getOrders = asyncHandler(async (req, res) => {
    const orders = await getAllOrdersService();

    res.status(200).json({ success: true, message: "Orders fetched successfully", data: orders });
});

// ─────────────────────────────────────────────────────────────────────────────
//  GET /orders/paginated
//  Returns paginated orders for POS history
// ─────────────────────────────────────────────────────────────────────────────
export const getPaginatedOrders = asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;

    const result = await getPaginatedOrdersService({ page, limit });

    res.status(200).json({
        success: true,
        message: "Orders fetched successfully",
        data: result.data,
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages
    });
});

// ─────────────────────────────────────────────────────────────────────────────
//  GET /orders/by-customer
//  Returns orders for a specific customer with date filtering
// ─────────────────────────────────────────────────────────────────────────────
export const getOrdersByCustomer = asyncHandler(async (req, res) => {
    const { customerId, startDate, endDate } = req.query;

    const orders = await getOrdersByCustomerService({ customerId, startDate, endDate });

    res.status(200).json({
        success: true,
        message: "Customer orders fetched successfully",
        data: orders
    });
});

// ─────────────────────────────────────────────────────────────────────────────
//  GET /orders/:id
//  Returns a single order by ID
// ─────────────────────────────────────────────────────────────────────────────
export const getOrderById = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const order = await getOrderByIdService(id);

    if (!order) {
        return res.status(404).json({
            success: false,
            message: "Order not found"
        });
    }

    res.status(200).json({
        success: true,
        message: "Order fetched successfully",
        data: order
    });
});

// ─────────────────────────────────────────────────────────────────────────────
//  POST /orders
//  Creates a new completed order.
//  Accepts both qty/quantity and price/unitPrice field names from the frontend.
// ─────────────────────────────────────────────────────────────────────────────
export const addOrder = asyncHandler(async (req, res, next) => {
    const ProductModel = getLocalProductModel();

    // Normalize items — safe coercion with ?? so 0 values are preserved (not treated as falsy)
    const normalizedItems = req.body.items.map((item) => {
        const qty = Number(item.quantity ?? item.qty ?? 1);
        const price = Number(item.unitPrice ?? item.price ?? 0);
        const origPrice = Number(item.originalPrice ?? item.unitPrice ?? item.price ?? 0);
        const total = item.lineTotal != null ? Number(item.lineTotal) : price * qty;

        return {
            product: item.product || item._id,
            name: item.name,
            quantity: qty,
            unitPrice: price,
            originalPrice: origPrice,
            lineTotal: total,
            portionType: item.portionType || "full",
            batchId: item.batchId ?? null,
            batchNumber: item.batchNumber ?? null,
            taxPercent: item.taxPercent || 0,
            taxType: item.taxType || "percentage",
            taxAmount: item.taxAmount || 0,
            discountPercent: item.discountPercent || 0,
            discountAmount: item.discountAmount || 0,
            discountType: item.discountType || "percentage",
            maxDiscountPercent: item.maxDiscountPercent || 0,
            discountLimitType: item.discountLimitType || "percentage",
            itemTotal: item.itemTotal || total,
        };
    });

    const validatedData = { ...req.body, items: normalizedItems };

    // Prevent duplicate order numbers
    const duplicate = await findOrderByNumberService(validatedData.orderNumber);
    if (duplicate) return next(new ErrorResponse("Order number already exists", 400));

    // Validate batch availability
    for (const item of validatedData.items) {
        if (!item.batchId) {
            return next(new ErrorResponse(`Batch is required for product: ${item.name}`, 400));
        }

        const batch = await findByIdBatchService(item.batchId);
        if (!batch) {
            return next(new ErrorResponse(`Batch not found for product: ${item.name}`, 400));
        }

        // Check if batch has enough quantity
        if (batch.quantity < item.quantity) {
            return next(new ErrorResponse(`Insufficient stock in batch ${batch.batchNumber}. Available: ${batch.quantity}, Required: ${item.quantity}`, 400));
        }

        // Check if batch is expired
        if (batch.expiryDate && new Date(batch.expiryDate) < new Date()) {
            return next(new ErrorResponse(`Batch ${batch.batchNumber} has expired`, 400));
        }
    }

    const order = await orderCreateService(validatedData);

    // Calculate staff commission if staff has percentage-based salary
    if (validatedData.staffId) {
        const StaffModel = getLocalStaffModel();
        const staff = await findOneDoc({
            model: StaffModel,
            filter: { _id: validatedData.staffId }
        });
        
        if (staff && staff.salaryType === 'percentage' && staff.percentage > 0) {
            const commissionAmount = (validatedData.totalAmount * staff.percentage) / 100;
            
            // Update order with commission
            await updateDocs({
                model: getLocalOrderModel(),
                filter: { _id: order._id },
                data: { staffCommission: commissionAmount }
            });
        }
    }

    // Deduct stock for all items
    for (const item of validatedData.items) {
        await adjustStock(item.product, item.batchId, 'decr', item.quantity);
    }

    // Create payment transaction using the new transaction system
    const paymentMethod = validatedData.paymentMethod;
    let paymentData = {
        order: order._id,
        paymentMethod: paymentMethod,
        amount: validatedData.totalAmount,
        paymentDate: new Date(),
        notes: `POS Order: ${validatedData.orderNumber}`,
        createdBy: req.user?._id,
    };

    if (paymentMethod === 'cash') {
        // Cash payment: auto-select cash, full amount in cash
        paymentData.cashAmount = validatedData.totalAmount;
        paymentData.creditAmount = 0;
        paymentData.paymentMethodId = validatedData.paymentMethodId;
        paymentData.paymentMethodName = validatedData.paymentMethodName;
    } else if (paymentMethod === 'credit') {
        // Credit payment: select account, full amount in credit
        if (!validatedData.creditAccount) {
            return next(new ErrorResponse("Credit account is required for credit payment", 400));
        }
        paymentData.cashAmount = 0;
        paymentData.creditAmount = validatedData.totalAmount;
        paymentData.creditAccount = validatedData.creditAccount;
    } else if (paymentMethod === 'hybrid') {
        // Hybrid payment: part cash, part credit with cash limit
        if (!validatedData.creditAccount) {
            return next(new ErrorResponse("Credit account is required for hybrid payment", 400));
        }
        if (!validatedData.cashAmount || validatedData.cashAmount <= 0) {
            return next(new ErrorResponse("Cash amount is required for hybrid payment", 400));
        }
        if (validatedData.cashAmount >= validatedData.totalAmount) {
            return next(new ErrorResponse("Cash amount must be less than total amount for hybrid payment", 400));
        }
        paymentData.cashAmount = validatedData.cashAmount;
        paymentData.creditAmount = validatedData.totalAmount - validatedData.cashAmount;
        paymentData.creditAccount = validatedData.creditAccount;
        paymentData.paymentMethodId = validatedData.paymentMethodId;
        paymentData.paymentMethodName = validatedData.paymentMethodName;
    }

    // Create the payment transaction
    await createOrderPayment(paymentData);

    // No longer creating separate staff sale bills - POS orders will be rendered in staff section
    // if (validatedData.staffId) {
    //     try {
    //         await createStaffSaleBillFromPOS(validatedData.staffId, order);
    //     } catch (error) {
    //         console.error('Failed to create staff sale bill:', error.message);
    //     }
    // }

    res.status(201).json({ success: true, message: "Order created successfully", order });
});

// ─────────────────────────────────────────────────────────────────────────────
//  DELETE /orders/:id
//  Permanently deletes a completed/cancelled order.
// ─────────────────────────────────────────────────────────────────────────────
export const deleteOrder = asyncHandler(async (req, res, next) => {
    const order = await getOrderByIdService(req.params.id);

    if (!order) return next(new ErrorResponse("Order not found", 404));

    // Restore stock for all items before deletion
    for (const item of order.items) {
        await adjustStock(item.product, item.batchId, 'inc', item.quantity);
    }

    // Delete all related transactions for this order and reverse credit account balances
    const transactions = await getTransactions({ sourceType: 'sale', sourceId: req.params.id });
    for (const transaction of transactions) {
        // Reverse credit account balance if this was a credit/hybrid payment
        if (transaction.creditAccount && (transaction.method === 'credit' || transaction.method === 'hybrid')) {
            const { findByIdQarzaAccountService, updateQarzaAccountService } = await import("../../qarza/services/qarzaAccount.crud.js");
            const creditAccount = await findByIdQarzaAccountService(transaction.creditAccount);
            if (creditAccount) {
                const creditAmount = transaction.creditAmount || transaction.amount;
                // Reverse the balance change (decrease since we're reversing a debit)
                await updateQarzaAccountService(creditAccount._id, {
                    balance: creditAccount.balance - creditAmount
                });
            }
        }
        await deleteTransaction(transaction._id);
    }

    await orderDeleteService(req.params.id);

    res.status(200).json({ success: true, message: "Order deleted successfully", data: {} });
});

// ─────────────────────────────────────────────────────────────────────────────
//  GET /orders/:id/payments
//  Returns all transactions/payments for a specific order
// ─────────────────────────────────────────────────────────────────────────────
export const getOrderPaymentsData = asyncHandler(async (req, res) => {
    try {
        console.log("The getorder payment data api si running. ")
        const payments = await getTransactions({ sourceType: 'sale', sourceId: req.params.id });
        res.status(200).json({
            success: true,
            message: "Order payments retrieved successfully",
            data: payments,
        });
    } catch (error) {
        return res.status(400).json({ success: false, message: error.message });
    }
});

// ─────────────────────────────────────────────────────────────────────────────
//  GET /orders/:id/payment-status
//  Returns payment status for a specific order
// ─────────────────────────────────────────────────────────────────────────────
export const getOrderPaymentStatusData = asyncHandler(async (req, res) => {
    try {
        const order = await getOrderByIdService(req.params.id);
        if (!order) {
            return res.status(404).json({ success: false, message: "Order not found" });
        }

        const paymentStatus = await calculateOrderPaymentStatus(order._id, order.totalAmount);
        res.status(200).json({
            success: true,
            message: "Order payment status retrieved successfully",
            data: paymentStatus,
        });
    } catch (error) {
        return res.status(400).json({ success: false, message: error.message });
    }
});

// ─────────────────────────────────────────────────────────────────────────────
//  POST /orders/:id/recalculate-payment
//  Recalculates the paid amount for an order based on transactions
// ─────────────────────────────────────────────────────────────────────────────
export const recalculateOrderPaidAmountData = asyncHandler(async (req, res) => {
    try {
        const { id } = req.params;
        const paymentStatus = await recalculateOrderPaidAmount(id);
        res.status(200).json({
            success: true,
            message: "Order paid amount recalculated successfully",
            data: paymentStatus,
        });
    } catch (error) {
        return res.status(400).json({ success: false, message: error.message });
    }
});
