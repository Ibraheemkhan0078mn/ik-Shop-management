import asyncHandler from "express-async-handler";
import ErrorResponse from "../../../common/utils/ErrorResponse.js";
import { getLocalHoldOrderModel } from "../../../configs/connect.db.js";
import {
    holdOrderCreate as holdOrderCreateService,
    getAllHoldOrders as getAllHoldOrdersService,
    getHoldOrderById as getHoldOrderByIdService,
    holdOrderUpdate as holdOrderUpdateService,
    holdOrderDelete as holdOrderDeleteService,
} from "../services/holdOrder.service.js";

// ─────────────────────────────────────────────────────────────────────────────
//  GET /hold-orders
//  Returns all currently held (paused) orders, newest first.
// ─────────────────────────────────────────────────────────────────────────────
export const getHoldOrders = asyncHandler(async (req, res) => {
    const holdOrders = await getAllHoldOrdersService();

    res.status(200).json({ success: true, message: "Held orders fetched successfully", data: holdOrders });
});

// ─────────────────────────────────────────────────────────────────────────────
//  POST /hold-orders
//  Saves the current cart as a held order so the cashier can resume it later.
//  Accepts both qty/quantity and price/unitPrice field names from the frontend.
// ─────────────────────────────────────────────────────────────────────────────
export const createHoldOrder = asyncHandler(async (req, res) => {
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

    const toNum = (v) => { const n = Number(v); return isNaN(n) ? 0 : n; };

    const holdOrderData = {
        orderNumber,
        items:          normalizedItems,
        subtotal:       toNum(subtotal),
        discountAmount: toNum(discountAmount),
        totalAmount:    toNum(totalAmount),
        customerName:   customerName ?? "",
        waiter:         waiter       ?? "",
        note:           note         ?? "",
    };

    const holdOrder = await holdOrderCreateService(holdOrderData);

    res.status(201).json({ success: true, message: "Order held successfully", data: holdOrder });
});

// ─────────────────────────────────────────────────────────────────────────────
//  PUT /hold-orders/:id
//  Replaces items / totals / metadata on an existing held order.
//  Called when a cashier resumes a hold, edits the cart, then holds again.
// ─────────────────────────────────────────────────────────────────────────────
export const updateHoldOrder = asyncHandler(async (req, res, next) => {
    const holdOrder = await getHoldOrderByIdService(req.params.id);

    if (!holdOrder) return next(new ErrorResponse("Held order not found", 404));

    const { items, subtotal, discountAmount, totalAmount, customerName, waiter, note } = req.body;

    if (!items?.length) {
        return res.status(400).json({ success: false, message: "items are required" });
    }

    // Normalize items — same logic as createHoldOrder
    const normalizedItems = items.map((item) => {
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

    const toNum = (v) => { const n = Number(v); return isNaN(n) ? 0 : n; };

    const updateData = {
        items:          normalizedItems,
        subtotal:       toNum(subtotal),
        discountAmount: toNum(discountAmount),
        totalAmount:    toNum(totalAmount),
    };
    if (customerName !== undefined) updateData.customerName = customerName;
    if (waiter       !== undefined) updateData.waiter       = waiter;
    if (note         !== undefined) updateData.note         = note;

    const updatedHoldOrder = await holdOrderUpdateService(req.params.id, updateData);

    res.status(200).json({ success: true, message: "Held order updated successfully", data: updatedHoldOrder });
});

// ─────────────────────────────────────────────────────────────────────────────
//  DELETE /hold-orders/:id
//  Removes a held order.
//  Called in two cases:
//    1. Cashier manually deletes it from the Held Orders panel.
//    2. Frontend calls it automatically after the order is successfully checked out.
// ─────────────────────────────────────────────────────────────────────────────
export const deleteHoldOrder = asyncHandler(async (req, res, next) => {
    const holdOrder = await getHoldOrderByIdService(req.params.id);

    if (!holdOrder) return next(new ErrorResponse("Held order not found", 404));

    await holdOrderDeleteService(req.params.id);

    res.status(200).json({ success: true, message: "Held order deleted successfully", data: {} });
});
