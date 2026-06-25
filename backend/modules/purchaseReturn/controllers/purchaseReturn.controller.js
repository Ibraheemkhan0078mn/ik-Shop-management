import asyncHandler from "express-async-handler";
import { getPurchaseById as getPurchaseDetails } from "../../productPurchases/services/purchase.service.js";
import { ApiResponse, ApiError } from "../../../common/services/apiResponses.js";
import { getLocalPurchaseModel, getLocalBatchModel } from "../../../configs/connect.db.js";
import { adjustStock, calculateStockDiff } from "../../../common/services/stockManager.js";
import {
    createPurchaseReturnService,
    findPurchaseReturnService,
    findByIdPurchaseReturnService,
    updatePurchaseReturnService,
    deleteOnePurchaseReturnService,
    countPurchaseReturnService,
} from "../services/purchaseReturn.crud.js";

const normalizePurchaseReturnItems = async (items = [], BatchModel) => {
    if (!Array.isArray(items)) return [];

    const normalizedItems = [];

    for (const item of items) {
        const batch = item.batch ? await BatchModel.findById(item.batch) : null;
        normalizedItems.push({
            ...item,
            batchNumber: item.batchNumber?.trim() || batch?.batchNumber || "",
        });
    }

    return normalizedItems;
};

export const getPurchaseReturnsData = asyncHandler(async (req, res) => {
    const { status, supplier, startDate, endDate } = req.query;
    let query = {};
    if (status) query.status = status;
    if (supplier) query.supplier = supplier;
    if (startDate || endDate) {
        query.returnDate = {};
        if (startDate) query.returnDate.$gte = new Date(startDate);
        if (endDate) query.returnDate.$lte = new Date(endDate);
    }

    const purchaseReturns = await findPurchaseReturnService(query)
        .populate("purchase", "invoiceNumber")
        .populate("supplier", "name")
        .populate("items.product", "name")
        .populate("items.batch", "batchNumber")
        .sort({ createdAt: -1 });

    return ApiResponse(res, 200, "Purchase returns retrieved successfully", purchaseReturns);
});

export const getPaginatedPurchaseReturnsData = asyncHandler(async (req, res) => {
    const { page = 1, limit = 20, status, supplier } = req.query;
    let query = {};
    if (status) query.status = status;
    if (supplier) query.supplier = supplier;

    const purchaseReturns = await findPurchaseReturnService(query)
        .populate("purchase", "invoiceNumber")
        .populate("supplier", "name")
        .populate("items.product", "name")
        .populate("items.batch", "batchNumber")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(parseInt(limit));

    const total = await countPurchaseReturnService(query);

    return ApiResponse(res, 200, "Purchase returns retrieved successfully", purchaseReturns, {
        pagination: {
            total,
            page: parseInt(page),
            limit: parseInt(limit),
            totalPages: Math.ceil(total / limit),
        },
    });
});

export const getPurchaseReturnDataById = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const purchaseReturn = await findByIdPurchaseReturnService(id)
        .populate("purchase")
        .populate("supplier")
        .populate("items.product")
        .populate("items.batch");
    if (!purchaseReturn) {
        throw new Error("Purchase return not found");
    }
    return ApiResponse(res, 200, "Purchase return retrieved successfully", purchaseReturn);
});

export const createPurchaseReturnData = asyncHandler(async (req, res) => {
    const userId = req.user?._id || req.user?.id || null;
    const PurchaseModel = getLocalPurchaseModel();
    const BatchModel = getLocalBatchModel();

    const data = req.body;

    const startOfDay = new Date(new Date().setHours(0, 0, 0, 0));
    const endOfDay = new Date(new Date().setHours(23, 59, 59, 999));
    const dateRange = { createdAt: { $gte: startOfDay, $lt: endOfDay } };

    const countValue = await countPurchaseReturnService(dateRange);
    const dateStr = startOfDay.toISOString().slice(0, 10).replace(/-/g, "");
    const purchaseReturnNumber = `PR-${dateStr}-${String(countValue + 1).padStart(4, "0")}`;

    const purchase = await PurchaseModel.findById(data.purchase);
    if (!purchase) {
        throw new Error("Purchase not found");
    }

    const normalizedItems = await normalizePurchaseReturnItems(data.items, BatchModel);

    for (const item of normalizedItems) {
        const batch = await BatchModel.findById(item.batch);
        if (!batch) {
            throw new Error(`Batch not found: ${item.batchNumber}`);
        }
        if (batch.quantity < item.quantity) {
            throw new Error(`Insufficient quantity in batch ${item.batchNumber}. Available: ${batch.quantity}, Required: ${item.quantity}`);
        }
    }

    const purchaseReturn = await createPurchaseReturnService({
        ...data,
        items: normalizedItems,
        purchaseReturnNumber,
        createdBy: userId,
    });

    // If status is approved, deduct stock immediately
    if (data.status === 'approved') {
        for (const item of normalizedItems) {
            await adjustStock(item.product, item.batch, 'decr', item.quantity);
        }
    }

    return ApiResponse(res, 201, "Purchase return created successfully", purchaseReturn);
});

export const updatePurchaseReturnData = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const BatchModel = getLocalBatchModel();

    const existing = await findByIdPurchaseReturnService(id);
    if (!existing) throw new Error("Purchase return not found");

    let incomingItems = req.body.items;

    if (incomingItems) {
        // Step 1: Normalize items (resolves batchNumber, batch ref, etc.)
        incomingItems = await normalizePurchaseReturnItems(incomingItems, BatchModel);
 
        // Step 2: Make sure every batch exists and has enough stock
        for (const item of incomingItems) {
            const batch = await BatchModel.findById(item.batch);
            if (!batch) throw new Error(`Batch "${item.batchNumber}" not found`);
            if (batch.quantity < item.quantity)
                throw new Error(`Not enough stock in batch "${item.batchNumber}". Available: ${batch.quantity}, Requested: ${item.quantity}`);
        }

        // Step 3: Compare old vs new quantities and adjust stock for each item
        const oldItemsByBatch = Object.fromEntries(
            existing.items.map(item => [String(item.batch), item.quantity])
        );

        for (const item of incomingItems) {
            const oldQty = oldItemsByBatch[String(item.batch)] ?? 0;
            const diff = Number(item.quantity) - oldQty;
            console.log((item.quantity), oldQty, diff);

            if (diff === 0) continue;                                        // no change, skip
            if (diff > 0) await adjustStock(item.product, item.batch, 'decr', diff);   // returning more → reduce stock
            if (diff < 0) await adjustStock(item.product, item.batch, 'inc', Math.abs(diff)); // returning less → restore stock
        }
    }

    const updated = await updatePurchaseReturnService(id, {
        ...req.body,
        items: incomingItems,
        updatedAt: new Date(),
    });

    return ApiResponse(res, 200, "Purchase return updated successfully", updated);
});

export const deletePurchaseReturnData = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const existing = await findByIdPurchaseReturnService(id);
    if (!existing) {
        throw new Error("Purchase return not found");
    }

    // if (existing.status !== "pending") {
    //     throw new Error("Only pending purchase returns can be deleted");
    // }

    // If approved, restore stock before deletion
    if (existing.status === "approved") {
        for (const item of existing.items) {
            await adjustStock(item.product, item.batch, 'inc', item.quantity);
        }
    }

    await deleteOnePurchaseReturnService(id);
    return ApiResponse(res, 200, "Purchase return deleted successfully", {});
});

export const submitPurchaseReturnData = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const existing = await findByIdPurchaseReturnService(id);
    if (!existing) {
        throw new Error("Purchase return not found");
    }

    if (existing.status !== "draft") {
        throw new Error("Only draft purchase returns can be submitted for approval");
    }

    const submitted = await updatePurchaseReturnService(id, { status: "pending" });
    return ApiResponse(res, 200, "Purchase return submitted for approval", submitted);
});

export const approvePurchaseReturnData = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = req.user?._id || req.user?.id || null;

    const existing = await findByIdPurchaseReturnService(id);
    if (!existing) {
        throw new Error("Purchase return not found");
    }

    if (existing.status !== "pending") {
        throw new Error(`Only pending purchase returns can be approved. Current status: ${existing.status}`);
    }

    for (const item of existing.items) {
        await adjustStock(item.product, item.batch, 'decr', item.quantity);
    }

    const approved = await updatePurchaseReturnService(id, {
        status: "approved",
        approvedBy: userId,
        approvedAt: new Date(),
    });

    return ApiResponse(res, 200, "Purchase return approved and stock deducted successfully", approved);
});

export const rejectPurchaseReturnData = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { rejectionReason } = req.body;
    if (!rejectionReason) {
        throw new Error("Rejection reason is required");
    }

    const existing = await findByIdPurchaseReturnService(id);
    if (!existing) {
        throw new Error("Purchase return not found");
    }

    if (existing.status !== "pending") {
        throw new Error(`Only pending purchase returns can be rejected. Current status: ${existing.status}`);
    }

    const rejected = await updatePurchaseReturnService(id, { status: "rejected", rejectionReason });
    return ApiResponse(res, 200, "Purchase return rejected successfully", rejected);
});

export const getPurchaseDetailsForReturn = asyncHandler(async (req, res) => {
    const { purchaseId } = req.params;
    const purchase = await getPurchaseDetails(purchaseId);
    return ApiResponse(res, 200, "Purchase details retrieved successfully", purchase);
});

export const generatePurchaseReturnNumberData = asyncHandler(async (req, res) => {
    const startOfDay = new Date(new Date().setHours(0, 0, 0, 0));
    const endOfDay = new Date(new Date().setHours(23, 59, 59, 999));
    const dateRange = { createdAt: { $gte: startOfDay, $lt: endOfDay } };

    const countValue = await countPurchaseReturnService(dateRange);
    const dateStr = startOfDay.toISOString().slice(0, 10).replace(/-/g, "");
    const purchaseReturnNumber = `PR-${dateStr}-${String(countValue + 1).padStart(4, "0")}`;

    return ApiResponse(res, 200, "Purchase return number generated", { purchaseReturnNumber });
});
