import asyncHandler from "express-async-handler";
import ErrorResponse from "../../../common/utils/ErrorResponse.js";
import { createPurchaseReturnSchema, updatePurchaseReturnSchema } from "../schemas/purchaseReturn.schema.js";
import { getLocalPurchaseReturnModel, getLocalPurchaseModel, getLocalBatchModel, getLocalProductModel, getLocalSupplierModel } from "../../../configs/connect.db.js";
import { handleProductStockQuantity } from "../../productPurchases/services/ChangeProductStockQuantity.js";

// ─── GET ALL (simple, no pagination) ────────────────────────────────────────
export const getPurchaseReturns = asyncHandler(async (req, res, next) => {
    const PurchaseReturnModel = getLocalPurchaseReturnModel();

    const { status, supplier, startDate, endDate } = req.query;

    let query = {};
    if (status) query.status = status;
    if (supplier) query.supplier = supplier;
    if (startDate || endDate) {
        query.returnDate = {};
        if (startDate) query.returnDate.$gte = new Date(startDate);
        if (endDate) query.returnDate.$lte = new Date(endDate);
    }

    const purchaseReturns = await PurchaseReturnModel.find(query)
        .populate("purchase", "invoiceNumber")
        .populate("supplier", "name")
        .populate("items.product", "name")
        .populate("items.batch", "batchNumber")
        .sort({ createdAt: -1 });

    res.status(200).json({
        success: true,
        message: "Purchase returns retrieved successfully",
        data: purchaseReturns,
    });
});

// ─── GET PAGINATED ───────────────────────────────────────────────────────────
export const getPaginatedPurchaseReturns = asyncHandler(async (req, res, next) => {
    const PurchaseReturnModel = getLocalPurchaseReturnModel();
    const { page = 1, limit = 20, status, supplier } = req.query;

    let query = {};
    if (status) query.status = status;
    if (supplier) query.supplier = supplier;

    const purchaseReturns = await PurchaseReturnModel.find(query)
        .populate("purchase", "invoiceNumber")
        .populate("supplier", "name")
        .populate("items.product", "name")
        .populate("items.batch", "batchNumber")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(parseInt(limit));

    const total = await PurchaseReturnModel.countDocuments(query);

    res.status(200).json({
        success: true,
        message: "Purchase returns retrieved successfully",
        data: purchaseReturns,
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit),
    });
});

// ─── GET BY ID ───────────────────────────────────────────────────────────────
export const getPurchaseReturnById = asyncHandler(async (req, res, next) => {
    const PurchaseReturnModel = getLocalPurchaseReturnModel();
    const { id } = req.params;

    const purchaseReturn = await PurchaseReturnModel.findById(id)
        .populate("purchase")
        .populate("supplier")
        .populate("items.product")
        .populate("items.batch");

    if (!purchaseReturn) {
        return next(new ErrorResponse("Purchase return not found", 404));
    }

    res.status(200).json({
        success: true,
        message: "Purchase return retrieved successfully",
        data: purchaseReturn,
    });
});

// ─── CREATE ─────────────────────────────────────────────────────────────────
export const createPurchaseReturn = asyncHandler(async (req, res, next) => {
    const PurchaseReturnModel = getLocalPurchaseReturnModel();
    const PurchaseModel = getLocalPurchaseModel();
    const BatchModel = getLocalBatchModel();

    const validatedData = await createPurchaseReturnSchema.validate(req.body, {
        abortEarly: false,
        stripUnknown: true,
    });

    // Generate purchase return number
    const startOfDay = new Date(new Date().setHours(0, 0, 0, 0));
    const endOfDay = new Date(new Date().setHours(23, 59, 59, 999));
    const dateRange = { createdAt: { $gte: startOfDay, $lt: endOfDay } };

    const count = await PurchaseReturnModel.countDocuments(dateRange);
    const dateStr = startOfDay.toISOString().slice(0, 10).replace(/-/g, "");
    const purchaseReturnNumber = `PR-${dateStr}-${String(count + 1).padStart(4, "0")}`;

    // Validate that purchase exists
    const purchase = await PurchaseModel.findById(validatedData.purchase);
    if (!purchase) {
        return next(new ErrorResponse("Purchase not found", 404));
    }

    // Validate batches and quantities
    for (const item of validatedData.items) {
        const batch = await BatchModel.findById(item.batch);
        if (!batch) {
            return next(new ErrorResponse(`Batch not found: ${item.batchNumber}`, 404));
        }
        if (batch.quantity < item.quantity) {
            return next(new ErrorResponse(`Insufficient quantity in batch ${item.batchNumber}. Available: ${batch.quantity}, Required: ${item.quantity}`, 400));
        }
    }

    const purchaseReturn = await PurchaseReturnModel.create({
        ...validatedData,
        purchaseReturnNumber,
        createdBy: req.user._id,
    });

    res.status(201).json({
        success: true,
        message: "Purchase return created successfully",
        data: purchaseReturn,
    });
});

// ─── UPDATE ─────────────────────────────────────────────────────────────────
export const updatePurchaseReturn = asyncHandler(async (req, res, next) => {
    const PurchaseReturnModel = getLocalPurchaseReturnModel();
    const BatchModel = getLocalBatchModel();
    const { id } = req.params;

    const existing = await PurchaseReturnModel.findById(id);
    if (!existing) {
        return next(new ErrorResponse("Purchase return not found", 404));
    }

    if (existing.status !== "draft") {
        return next(new ErrorResponse("Only draft purchase returns can be updated", 400));
    }

    const validatedData = await updatePurchaseReturnSchema.validate(req.body, {
        abortEarly: false,
        stripUnknown: true,
    });

    // Validate batches and quantities if items are being updated
    if (validatedData.items) {
        for (const item of validatedData.items) {
            const batch = await BatchModel.findById(item.batch);
            if (!batch) {
                return next(new ErrorResponse(`Batch not found: ${item.batchNumber}`, 404));
            }
            if (batch.quantity < item.quantity) {
                return next(new ErrorResponse(`Insufficient quantity in batch ${item.batchNumber}. Available: ${batch.quantity}, Required: ${item.quantity}`, 400));
            }
        }
    }

    const updated = await PurchaseReturnModel.findByIdAndUpdate(
        id,
        { ...validatedData, updatedAt: new Date() },
        { new: true, runValidators: true }
    );

    res.status(200).json({
        success: true,
        message: "Purchase return updated successfully",
        data: updated,
    });
});

// ─── DELETE ─────────────────────────────────────────────────────────────────
export const deletePurchaseReturn = asyncHandler(async (req, res, next) => {
    const PurchaseReturnModel = getLocalPurchaseReturnModel();
    const { id } = req.params;

    const purchaseReturn = await PurchaseReturnModel.findById(id);
    if (!purchaseReturn) {
        return next(new ErrorResponse("Purchase return not found", 404));
    }

    if (purchaseReturn.status !== "draft") {
        return next(new ErrorResponse("Only draft purchase returns can be deleted", 400));
    }

    await purchaseReturn.deleteOne();

    res.status(200).json({
        success: true,
        message: "Purchase return deleted successfully",
        data: {},
    });
});

// ─── SUBMIT FOR APPROVAL (draft → pending) ───────────────────────────────────
export const submitPurchaseReturn = asyncHandler(async (req, res, next) => {
    const PurchaseReturnModel = getLocalPurchaseReturnModel();
    const { id } = req.params;

    const purchaseReturn = await PurchaseReturnModel.findById(id);
    if (!purchaseReturn) {
        return next(new ErrorResponse("Purchase return not found", 404));
    }

    if (purchaseReturn.status !== "draft") {
        return next(new ErrorResponse("Only draft purchase returns can be submitted for approval", 400));
    }

    const submitted = await PurchaseReturnModel.findByIdAndUpdate(
        id,
        { status: "pending" },
        { new: true }
    );

    res.status(200).json({
        success: true,
        message: "Purchase return submitted for approval",
        data: submitted,
    });
});

// ─── APPROVE ─────────────────────────────────────────────────────────────────
export const approvePurchaseReturn = asyncHandler(async (req, res, next) => {
    const PurchaseReturnModel = getLocalPurchaseReturnModel();
    const BatchModel = getLocalBatchModel();
    const { id } = req.params;

    const purchaseReturn = await PurchaseReturnModel.findById(id);
    if (!purchaseReturn) {
        return next(new ErrorResponse("Purchase return not found", 404));
    }

    if (purchaseReturn.status !== "pending") {
        return next(new ErrorResponse(`Only pending purchase returns can be approved. Current status: ${purchaseReturn.status}`, 400));
    }

    // Deduct inventory: batch stock first, then product stock
    for (const item of purchaseReturn.items) {
        const batch = await BatchModel.findById(item.batch);
        if (batch) {
            // Deduct from batch stock first
            batch.quantity -= item.quantity;
            if (batch.quantity <= 0) {
                batch.isActive = false;
            }
            await batch.save();
        }

        // Then deduct from product stock
        await handleProductStockQuantity(item.product, "delete", item.quantity);
    }

    const approved = await PurchaseReturnModel.findByIdAndUpdate(
        id,
        {
            status: "approved",
            approvedBy: req.user._id,
            approvedAt: new Date(),
        },
        { new: true }
    );

    res.status(200).json({
        success: true,
        message: "Purchase return approved and stock deducted successfully",
        data: approved,
    });
});

// ─── REJECT ─────────────────────────────────────────────────────────────────
export const rejectPurchaseReturn = asyncHandler(async (req, res, next) => {
    const PurchaseReturnModel = getLocalPurchaseReturnModel();
    const { id } = req.params;

    const purchaseReturn = await PurchaseReturnModel.findById(id);
    if (!purchaseReturn) {
        return next(new ErrorResponse("Purchase return not found", 404));
    }

    if (purchaseReturn.status !== "pending") {
        return next(new ErrorResponse(`Only pending purchase returns can be rejected. Current status: ${purchaseReturn.status}`, 400));
    }

    const { rejectionReason } = req.body;
    if (!rejectionReason) {
        return next(new ErrorResponse("Rejection reason is required", 400));
    }

    const rejected = await PurchaseReturnModel.findByIdAndUpdate(
        id,
        { status: "rejected", rejectionReason },
        { new: true }
    );

    res.status(200).json({
        success: true,
        message: "Purchase return rejected successfully",
        data: rejected,
    });
});

// ─── GENERATE NUMBER ─────────────────────────────────────────────────────────
export const generatePurchaseReturnNumber = asyncHandler(async (req, res) => {
    const PurchaseReturnModel = getLocalPurchaseReturnModel();

    const startOfDay = new Date(new Date().setHours(0, 0, 0, 0));
    const endOfDay = new Date(new Date().setHours(23, 59, 59, 999));
    const dateRange = { createdAt: { $gte: startOfDay, $lt: endOfDay } };

    const count = await PurchaseReturnModel.countDocuments(dateRange);
    const dateStr = startOfDay.toISOString().slice(0, 10).replace(/-/g, "");
    const purchaseReturnNumber = `PR-${dateStr}-${String(count + 1).padStart(4, "0")}`;

    res.status(200).json({ success: true, purchaseReturnNumber });
});
