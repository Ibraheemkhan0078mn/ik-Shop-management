import asyncHandler from "express-async-handler";
import ErrorResponse from "../../../common/utils/ErrorResponse.js";
import {
    getLocalWastageModel,
    getLocalProductModel,
    getLocalBatchModel,
} from "../../../configs/connect.db.js";
import { handleProductStockQuantity } from "../../productPurchases/services/ChangeProductStockQuantity.js";
import {
    wastageCreate as wastageCreateService,
    getAllWastages as getAllWastagesService,
    getWastageById as getWastageByIdService,
    wastageUpdate as wastageUpdateService,
    wastageDelete as wastageDeleteService,
    countWastages as countWastagesService,
} from "../services/wastage.service.js";

// ─── GET ALL (simple, no pagination) ────────────────────────────────────────
export const getWastages = asyncHandler(async (req, res, next) => {
    const { status, reason, startDate, endDate } = req.query;

    let query = {};
    if (status) query.status = status;
    if (reason) query.reason = reason;
    if (startDate || endDate) {
        query.wastageDate = {};
        if (startDate) query.wastageDate.$gte = new Date(startDate);
        if (endDate)   query.wastageDate.$lte = new Date(endDate);
    }

    const wastages = await getAllWastagesService(query);

    res.status(200).json({
        success: true,
        message: "Wastages retrieved successfully",
        data: wastages,
    });
});

// ─── GET PAGINATED ───────────────────────────────────────────────────────────
export const getPaginatedWastages = asyncHandler(async (req, res, next) => {
    const { status, reason, startDate, endDate } = req.query;
    const page  = Math.max(1, parseInt(req.query.page)  || 1);
    const limit = Math.max(1, parseInt(req.query.limit) || 10);
    const skip  = (page - 1) * limit;

    let query = {};
    if (status) query.status = status;
    if (reason) query.reason = reason;
    if (startDate || endDate) {
        query.wastageDate = {};
        if (startDate) query.wastageDate.$gte = new Date(startDate);
        if (endDate)   query.wastageDate.$lte = new Date(endDate);
    }

    const [wastages, total] = await Promise.all([
        getAllWastagesService(query).skip(skip).limit(limit),
        countWastagesService(query),
    ]);

    res.status(200).json({
        success: true,
        message: "Wastages retrieved successfully",
        data:       wastages,
        total:      total,
        page:       page,
        limit:      limit,
        totalPages: Math.ceil(total / limit),
    });
});

// ─── GET SINGLE ──────────────────────────────────────────────────────────────
export const getWastage = asyncHandler(async (req, res, next) => {
    const { id } = req.params;

    const wastage = await getWastageByIdService(id);

    if (!wastage) {
        return next(new ErrorResponse("Wastage record not found", 404));
    }

    res.status(200).json({
        success: true,
        message: "Wastage retrieved successfully",
        data: wastage,
    });
});

// ─── CREATE ──────────────────────────────────────────────────────────────────
export const createWastage = asyncHandler(async (req, res, next) => {
    const validatedData = req.body || {};

    // Auto-calculate item-level totalLoss and document-level totals
    let totalQuantity   = 0;
    let totalLossAmount = 0;

    validatedData.items = validatedData.items.map((item) => {
        const totalLoss  = (item.quantity || 0) * (item.costPrice || 0);
        totalQuantity   += item.quantity || 0;
        totalLossAmount += totalLoss;
        return { ...item, totalLoss };
    });

    validatedData.totalItems      = validatedData.items.length;
    validatedData.totalQuantity   = totalQuantity;
    validatedData.totalLossAmount = totalLossAmount;

    // Auto-generate wastage number  e.g. WST-00042
    const count          = await countWastagesService();
    validatedData.wastageNumber = `WST-${String(count + 1).padStart(5, "0")}`;

    const wastage = await wastageCreateService(validatedData);

    res.status(201).json({
        success: true,
        message: "Wastage record created successfully",
        data: wastage,
    });
});

// ─── UPDATE ──────────────────────────────────────────────────────────────────
export const updateWastage = asyncHandler(async (req, res, next) => {
    const { id } = req.params;

    let wastage = await getWastageByIdService(id);
    if (!wastage) {
        return next(new ErrorResponse("Wastage record not found", 404));
    }

    // Only allow edits on draft wastages
    if (wastage.status !== "draft") {
        return next(new ErrorResponse(`Cannot edit a wastage that is already ${wastage.status}`, 400));
    }

    const validatedData = req.body || {};

    // Recalculate totals if items were updated
    if (validatedData.items && validatedData.items.length > 0) {
        let totalQuantity   = 0;
        let totalLossAmount = 0;

        validatedData.items = validatedData.items.map((item) => {
            const totalLoss  = (item.quantity || 0) * (item.costPrice || 0);
            totalQuantity   += item.quantity || 0;
            totalLossAmount += totalLoss;
            return { ...item, totalLoss };
        });

        validatedData.totalItems      = validatedData.items.length;
        validatedData.totalQuantity   = totalQuantity;
        validatedData.totalLossAmount = totalLossAmount;
    }

    validatedData.updatedBy = req.user._id;

    wastage = await wastageUpdateService(id, validatedData);

    res.status(200).json({
        success: true,
        message: "Wastage updated successfully",
        data: wastage,
    });
});

// ─── APPROVE ─────────────────────────────────────────────────────────────────
export const approveWastage = asyncHandler(async (req, res, next) => {
    const ProductModel   = getLocalProductModel();
    const BatchModel     = getLocalBatchModel();
    const { id }         = req.params;

    const wastage = await getWastageByIdService(id);
    if (!wastage) {
        return next(new ErrorResponse("Wastage record not found", 404));
    }

    if (wastage.status !== "pending") {
        return next(new ErrorResponse(`Only pending wastages can be approved. Current status: ${wastage.status}`, 400));
    }

    // Deduct stock for each item: batch stock first, then product stock
    for (const item of wastage.items) {
        // Find batch by batchNumber and product
        const batch = await BatchModel.findOne({
            batchNumber: item.batchNumber,
            product: item.product
        });

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

    const approved = await wastageUpdateService(id, {
        status:     "approved",
        approvedBy: req.user._id,
        approvedAt: new Date(),
    });

    res.status(200).json({
        success: true,
        message: "Wastage approved and stock deducted successfully",
        data: approved,
    });
});

// ─── REJECT ──────────────────────────────────────────────────────────────────
export const rejectWastage = asyncHandler(async (req, res, next) => {
    const { id }       = req.params;

    const wastage = await getWastageByIdService(id);
    if (!wastage) {
        return next(new ErrorResponse("Wastage record not found", 404));
    }

    if (wastage.status !== "pending") {
        return next(new ErrorResponse(`Only pending wastages can be rejected. Current status: ${wastage.status}`, 400));
    }

    const { rejectionReason } = req.body;
    if (!rejectionReason) {
        return next(new ErrorResponse("Rejection reason is required", 400));
    }

    const rejected = await wastageUpdateService(id, { status: "rejected", rejectionReason });

    res.status(200).json({
        success: true,
        message: "Wastage rejected successfully",
        data: rejected,
    });
});

// ─── SUBMIT FOR APPROVAL (draft → pending) ───────────────────────────────────
export const submitWastage = asyncHandler(async (req, res, next) => {
    const { id }       = req.params;

    const wastage = await getWastageByIdService(id);
    if (!wastage) {
        return next(new ErrorResponse("Wastage record not found", 404));
    }

    if (wastage.status !== "draft") {
        return next(new ErrorResponse("Only draft wastages can be submitted for approval", 400));
    }

    const submitted = await wastageUpdateService(id, { status: "pending" });

    res.status(200).json({
        success: true,
        message: "Wastage submitted for approval",
        data: submitted,
    });
});

// ─── DELETE ──────────────────────────────────────────────────────────────────
export const deleteWastage = asyncHandler(async (req, res, next) => {
    const { id }       = req.params;

    const wastage = await getWastageByIdService(id);
    if (!wastage) {
        return next(new ErrorResponse("Wastage record not found", 404));
    }

    // Only drafts can be deleted
    if (wastage.status !== "draft") {
        return next(new ErrorResponse(`Cannot delete a wastage with status: ${wastage.status}. Only drafts can be deleted.`, 400));
    }

    await wastageDeleteService(id);

    res.status(200).json({
        success: true,
        message: "Wastage deleted successfully",
        data: {},
    });
});