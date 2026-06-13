import asyncHandler from "express-async-handler";
import ErrorResponse from "../../../common/utils/ErrorResponse.js";
import { getLocalHoldOrderModel } from "../../../configs/connect.db.js";

// ─────────────────────────────────────────────────────────────────────────────
//  GET /hold-orders
//  Returns all currently held (paused) orders, newest first.
// ─────────────────────────────────────────────────────────────────────────────
export const getHoldOrders = asyncHandler(async (req, res) => {
    const HoldOrder = getLocalHoldOrderModel();
    const holdOrders = await HoldOrder.find().sort({ createdAt: -1 });

    res.status(200).json({ success: true, message: "Held orders fetched successfully", data: holdOrders });
});

// ─────────────────────────────────────────────────────────────────────────────
//  POST /hold-orders
//  Saves the current cart as a held order so the cashier can resume it later.
//  Accepts both qty/quantity and price/unitPrice field names from the frontend.
// ─────────────────────────────────────────────────────────────────────────────
export const createHoldOrder = asyncHandler(async (req, res) => {
    const HoldOrder = getLocalHoldOrderModel();
    const { orderNumber, items, subtotal, discountAmount, totalAmount, customerName, waiter, note } = req.body;

    if (!orderNumber || !items?.length) {
        return res.status(400).json({ success: false, message: "orderNumber and items are required" });
    }

    // Normalize items — safe coercion with ?? so 0 values are preserved (not treated as falsy)
    const normalizedItems = items.map((item) => {
        const qty      = Number(item.quantity  ?? item.qty      ?? 1);
        const price    = Number(item.unitPrice  ?? item.price    ?? 0);
        const origPrice = Number(item.originalPrice ?? item.unitPrice ?? item.price ?? 0);
        const total    = item.lineTotal != null ? Number(item.lineTotal) : price * qty;

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

    const holdOrder = await HoldOrder.create({
        orderNumber,
        items:          normalizedItems,
        subtotal:       Number(subtotal)       ?? 0,
        discountAmount: Number(discountAmount) ?? 0,
        totalAmount:    Number(totalAmount)    ?? 0,
        customerName:   customerName ?? "",
        waiter:         waiter       ?? "",
        note:           note         ?? "",
    });

    res.status(201).json({ success: true, message: "Order held successfully", data: holdOrder });
});

// ─────────────────────────────────────────────────────────────────────────────
//  DELETE /hold-orders/:id
//  Removes a held order.
//  Called in two cases:
//    1. Cashier manually deletes it from the Held Orders panel.
//    2. Frontend calls it automatically after the order is successfully checked out.
// ─────────────────────────────────────────────────────────────────────────────
export const deleteHoldOrder = asyncHandler(async (req, res, next) => {
    const HoldOrder = getLocalHoldOrderModel();
    const holdOrder = await HoldOrder.findById(req.params.id);

    if (!holdOrder) return next(new ErrorResponse("Held order not found", 404));

    await holdOrder.deleteOne();

    res.status(200).json({ success: true, message: "Held order deleted successfully", data: {} });
});
