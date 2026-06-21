import asyncHandler   from "express-async-handler";
import ErrorResponse  from "../../../common/utils/ErrorResponse.js";
import { createOrderSchema } from "../schemas/order.schema.js";
import { getLocalOrderModel, getLocalHoldOrderModel, getLocalBatchModel, getLocalProductModel } from "../../../configs/connect.db.js";
import { handleProductStockQuantity } from "../../productPurchases/services/ChangeProductStockQuantity.js";
import {
    orderCreate as orderCreateService,
    getAllOrders as getAllOrdersService,
    findOrderByNumber as findOrderByNumberService,
    orderDelete as orderDeleteService,
    countOrders as countOrdersService,
} from "../services/order.service.js";
import {
    countHoldOrderService,
} from "../services/holdOrder.crud.js";

// ─────────────────────────────────────────────────────────────────────────────
//  GET /orders/generate-number
//  Returns a unique order number for today — e.g. ORD-20250613-0001
// ─────────────────────────────────────────────────────────────────────────────
export const generateOrderNumber = asyncHandler(async (req, res) => {
    const startOfDay = new Date(new Date().setHours(0, 0, 0, 0));
    const endOfDay   = new Date(new Date().setHours(23, 59, 59, 999));
    const dateRange  = { createdAt: { $gte: startOfDay, $lt: endOfDay } };

    // Count from BOTH collections so hold numbers and order numbers never clash
    const [orderCount, holdCount] = await Promise.all([
        countOrdersService(dateRange),
        countHoldOrderService(dateRange),
    ]);

    const dateStr     = startOfDay.toISOString().slice(0, 10).replace(/-/g, "");
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
//  POST /orders
//  Creates a new completed order.
//  Accepts both qty/quantity and price/unitPrice field names from the frontend.
// ─────────────────────────────────────────────────────────────────────────────
export const addOrder = asyncHandler(async (req, res, next) => {
    const BatchModel = getLocalBatchModel();
    const ProductModel = getLocalProductModel();

    // Normalize items — safe coercion with ?? so 0 values are preserved (not treated as falsy)
    const normalizedItems = req.body.items.map((item) => {
        const qty       = Number(item.quantity  ?? item.qty      ?? 1);
        const price     = Number(item.unitPrice  ?? item.price    ?? 0);
        const origPrice = Number(item.originalPrice ?? item.unitPrice ?? item.price ?? 0);
        const total     = item.lineTotal != null ? Number(item.lineTotal) : price * qty;

        return {
            product:       item.product || item._id,
            name:          item.name,
            quantity:      qty,
            unitPrice:     price,
            originalPrice: origPrice,
            lineTotal:     total,
            portionType:   item.portionType || "full",
            batchId:       item.batchId     ?? null,
            batchNumber:   item.batchNumber ?? null,
        };
    });

    // Validate with yup schema
    const validatedData = await createOrderSchema.validate(
        { ...req.body, items: normalizedItems },
        { abortEarly: false, stripUnknown: true },
    );

    // Prevent duplicate order numbers
    const duplicate = await findOrderByNumberService(validatedData.orderNumber);
    if (duplicate) return next(new ErrorResponse("Order number already exists", 400));

    // Deduct inventory: batch stock first, then product stock
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

        // Deduct from batch stock first
        batch.quantity -= item.quantity;
        await batch.save();

        // Then deduct from product stock
        await handleProductStockQuantity(item.product, "delete", item.quantity);
    }

    const order = await orderCreateService(validatedData);

    res.status(201).json({ success: true, message: "Order created successfully", order });
});

// ─────────────────────────────────────────────────────────────────────────────
//  DELETE /orders/:id
//  Permanently deletes a completed/cancelled order.
// ─────────────────────────────────────────────────────────────────────────────
export const deleteOrder = asyncHandler(async (req, res, next) => {
    const BatchModel = getLocalBatchModel();
    const order = await getOrderById(req.params.id);

    if (!order) return next(new ErrorResponse("Order not found", 404));

    // Restore inventory: add back to batch stock first, then product stock
    for (const item of order.items) {
        if (!item.batchId) continue;

        const batch = await BatchModel.findById(item.batchId);
        if (batch) {
            // Add back to batch stock first
            batch.quantity += item.quantity;
            await batch.save();

            // Then add back to product stock
            await handleProductStockQuantity(item.product, "create", item.quantity);
        }
    }

    await orderDeleteService(req.params.id);

    res.status(200).json({ success: true, message: "Order deleted successfully", data: {} });
});
