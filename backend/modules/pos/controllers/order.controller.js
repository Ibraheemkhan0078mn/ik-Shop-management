import asyncHandler from "express-async-handler";
import ErrorResponse from "../../../common/utils/ErrorResponse.js";
import { getLocalOrderModel, getLocalHoldOrderModel, getLocalBatchModel, getLocalProductModel, getLocalQarzaAccountModel, getLocalQarzaPaymentModel } from "../../../configs/connect.db.js";
import { adjustStock } from "../../../common/services/stockManager.js";
import {
    orderCreate as orderCreateService,
    getAllOrders as getAllOrdersService,
    findOrderByNumber as findOrderByNumberService,
    orderDelete as orderDeleteService,
    countOrders as countOrdersService,
    getOrderById as getOrderByIdService,
} from "../services/order.service.js";
import {
    countHoldOrderService,
} from "../services/holdOrder.crud.js";
import { createStaffSaleBillFromPOS } from "../../staff/services/staff.service.js";

// ─────────────────────────────────────────────────────────────────────────────
//  GET /orders/generate-number
//  Returns a unique order number for today — e.g. ORD-20250613-0001
// ─────────────────────────────────────────────────────────────────────────────
export const generateOrderNumber = asyncHandler(async (req, res) => {
    const startOfDay = new Date(new Date().setHours(0, 0, 0, 0));
    const endOfDay = new Date(new Date().setHours(23, 59, 59, 999));
    const dateRange = { createdAt: { $gte: startOfDay, $lt: endOfDay } };

    // Count from BOTH collections so hold numbers and order numbers never clash
    const [orderCount, holdCount] = await Promise.all([
        countOrdersService(dateRange),
        countHoldOrderService(dateRange),
    ]);

    const dateStr = startOfDay.toISOString().slice(0, 10).replace(/-/g, "");
    const orderNumber = `ORD-${dateStr}-${String(orderCount + holdCount + 1).padStart(4, "0")}`;

    res.status(200).json({ success: true, orderNumber });
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
    const skip = (page - 1) * limit;

    const OrderModel = getLocalOrderModel();

    const orders = await OrderModel.find()
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip(skip);

    const total = await OrderModel.countDocuments();

    res.status(200).json({
        success: true,
        message: "Orders fetched successfully",
        data: orders,
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
    });
});

// ─────────────────────────────────────────────────────────────────────────────
//  GET /orders/by-customer
//  Returns orders for a specific customer with date filtering
// ─────────────────────────────────────────────────────────────────────────────
export const getOrdersByCustomer = asyncHandler(async (req, res) => {
    const { customerId, startDate, endDate } = req.query;
    const OrderModel = getLocalOrderModel();

    const filter = { customerId };
    
    if (startDate || endDate) {
        filter.createdAt = {};
        if (startDate) {
            filter.createdAt.$gte = new Date(startDate);
        }
        if (endDate) {
            const endDateTime = new Date(endDate);
            endDateTime.setHours(23, 59, 59, 999);
            filter.createdAt.$lte = endDateTime;
        }
    }

    const orders = await OrderModel.find(filter)
        .sort({ createdAt: -1 });

    res.status(200).json({
        success: true,
        message: "Customer orders fetched successfully",
        data: orders
    });
});

// ─────────────────────────────────────────────────────────────────────────────
//  POST /orders
//  Creates a new completed order.
//  Accepts both qty/quantity and price/unitPrice field names from the frontend.
// ─────────────────────────────────────────────────────────────────────────────
export const addOrder = asyncHandler(async (req, res, next) => {
    const BatchModel = getLocalBatchModel(); 
    const ProductModel = getLocalProductModel();
    const QarzaAccountModel = getLocalQarzaAccountModel();
    const QarzaPaymentModel = getLocalQarzaPaymentModel();

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

        const batch = await BatchModel.findById(item.batchId);
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

    // Deduct stock for all items
    for (const item of validatedData.items) {
        await adjustStock(item.product, item.batchId, 'decr', item.quantity);
    }

    // Create qarza payment for credit/hybrid payments
    const paymentMethod = validatedData.paymentMethod;
    if (paymentMethod === 'credit' && validatedData.qarzaAccount) {
        const creditAccount = await QarzaAccountModel.findById(validatedData.qarzaAccount);
        if (creditAccount) {
            await QarzaPaymentModel.create({
                qarzaAccountId: validatedData.qarzaAccount,
                amount: validatedData.totalAmount,
                type: 'debit', // They owe us, so it's debit
                date: new Date(),
                notes: `POS Order: ${validatedData.orderNumber}`,
                source: 'pos',
                orderId: order._id,
                orderNumber: validatedData.orderNumber
            });
            // Update credit account balance
            creditAccount.balance += validatedData.totalAmount;
            await creditAccount.save();
        }
    } else if (paymentMethod === 'hybrid' && validatedData.hybridQarzaAccount && validatedData.hybridQarza > 0) {
        const creditAccount = await QarzaAccountModel.findById(validatedData.hybridQarzaAccount);
        if (creditAccount) {
            await QarzaPaymentModel.create({
                qarzaAccountId: validatedData.hybridQarzaAccount,
                amount: validatedData.hybridQarza,
                type: 'debit', // They owe us, so it's debit
                date: new Date(),
                notes: `POS Order (Hybrid): ${validatedData.orderNumber}`,
                source: 'pos',
                orderId: order._id,
                orderNumber: validatedData.orderNumber
            });
            // Update credit account balance
            creditAccount.balance += validatedData.hybridQarza;
            await creditAccount.save();
        }
    }

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

    await orderDeleteService(req.params.id);

    res.status(200).json({ success: true, message: "Order deleted successfully", data: {} });
});
