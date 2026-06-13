import asyncHandler   from "express-async-handler";
import ErrorResponse  from "../../../common/utils/ErrorResponse.js";
import { createOrderSchema } from "../schemas/order.schema.js";
import { getLocalOrderModel, getLocalHoldOrderModel } from "../../../configs/connect.db.js";

// ─────────────────────────────────────────────────────────────────────────────
//  GET /orders/generate-number
//  Returns a unique order number for today — e.g. ORD-20250613-0001
// ─────────────────────────────────────────────────────────────────────────────
export const generateOrderNumber = asyncHandler(async (req, res) => {
    const Order     = getLocalOrderModel();
    const HoldOrder = getLocalHoldOrderModel();

    const startOfDay = new Date(new Date().setHours(0, 0, 0, 0));
    const endOfDay   = new Date(new Date().setHours(23, 59, 59, 999));
    const dateRange  = { createdAt: { $gte: startOfDay, $lt: endOfDay } };

    // Count from BOTH collections so hold numbers and order numbers never clash
    const [orderCount, holdCount] = await Promise.all([
        Order.countDocuments(dateRange),
        HoldOrder.countDocuments(dateRange),
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
    const Order  = getLocalOrderModel();
    const orders = await Order.find().sort({ createdAt: -1 });

    res.status(200).json({ success: true, message: "Orders fetched successfully", data: orders });
});

// ─────────────────────────────────────────────────────────────────────────────
//  POST /orders
//  Creates a new completed order.
//  Accepts both qty/quantity and price/unitPrice field names from the frontend.
// ─────────────────────────────────────────────────────────────────────────────
export const addOrder = asyncHandler(async (req, res, next) => {
    const Order = getLocalOrderModel();

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
    const duplicate = await Order.findOne({ orderNumber: validatedData.orderNumber });
    if (duplicate) return next(new ErrorResponse("Order number already exists", 400));

    const order = await Order.create(validatedData);

    res.status(201).json({ success: true, message: "Order created successfully", order });
});

// ─────────────────────────────────────────────────────────────────────────────
//  DELETE /orders/:id
//  Permanently deletes a completed/cancelled order.
// ─────────────────────────────────────────────────────────────────────────────
export const deleteOrder = asyncHandler(async (req, res, next) => {
    const Order = getLocalOrderModel();
    const order = await Order.findById(req.params.id);

    if (!order) return next(new ErrorResponse("Order not found", 404));

    await order.deleteOne();

    res.status(200).json({ success: true, message: "Order deleted successfully", data: {} });
});
