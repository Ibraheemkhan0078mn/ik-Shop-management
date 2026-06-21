import asyncHandler from "express-async-handler";
import ErrorResponse from "../../../common/utils/ErrorResponse.js";
import { createPurchaseReturnSchema, updatePurchaseReturnSchema } from "../schemas/purchaseReturn.schema.js";
import {
    getPurchaseReturns,
    getPaginatedPurchaseReturns,
    getPurchaseReturnById,
    createPurchaseReturn,
    updatePurchaseReturn,
    deletePurchaseReturn,
    submitPurchaseReturn,
    approvePurchaseReturn,
    rejectPurchaseReturn,
    generatePurchaseReturnNumber,
} from "../services/purchaseReturn.service.js";

// ─── GET ALL (simple, no pagination) ────────────────────────────────────────
export const getPurchaseReturns = asyncHandler(async (req, res, next) => {
    const purchaseReturns = await getPurchaseReturns(req.query);
    res.status(200).json({
        success: true,
        message: "Purchase returns retrieved successfully",
        data: purchaseReturns,
    });
});

// ─── GET PAGINATED ───────────────────────────────────────────────────────────
export const getPaginatedPurchaseReturns = asyncHandler(async (req, res, next) => {
    const result = await getPaginatedPurchaseReturns(req.query);
    res.status(200).json({
        success: true,
        message: "Purchase returns retrieved successfully",
        ...result,
    });
});

// ─── GET BY ID ───────────────────────────────────────────────────────────────
export const getPurchaseReturnById = asyncHandler(async (req, res, next) => {
    const { id } = req.params;
    try {
        const purchaseReturn = await getPurchaseReturnById(id);
        res.status(200).json({
            success: true,
            message: "Purchase return retrieved successfully",
            data: purchaseReturn,
        });
    } catch (error) {
        return next(new ErrorResponse("Purchase return not found", 404));
    }
});

// ─── CREATE ─────────────────────────────────────────────────────────────────
export const createPurchaseReturn = asyncHandler(async (req, res, next) => {
    const validatedData = await createPurchaseReturnSchema.validate(req.body, {
        abortEarly: false,
        stripUnknown: true,
    });

    try {
        const purchaseReturn = await createPurchaseReturn(validatedData, req.user._id);
        res.status(201).json({
            success: true,
            message: "Purchase return created successfully",
            data: purchaseReturn,
        });
    } catch (error) {
        return next(new ErrorResponse(error.message, 400));
    }
});

// ─── UPDATE ─────────────────────────────────────────────────────────────────
export const updatePurchaseReturn = asyncHandler(async (req, res, next) => {
    const { id } = req.params;
    const validatedData = await updatePurchaseReturnSchema.validate(req.body, {
        abortEarly: false,
        stripUnknown: true,
    });

    try {
        const updated = await updatePurchaseReturn(id, validatedData);
        res.status(200).json({
            success: true,
            message: "Purchase return updated successfully",
            data: updated,
        });
    } catch (error) {
        return next(new ErrorResponse(error.message, 400));
    }
});

// ─── DELETE ─────────────────────────────────────────────────────────────────
export const deletePurchaseReturn = asyncHandler(async (req, res, next) => {
    const { id } = req.params;
    try {
        await deletePurchaseReturn(id);
        res.status(200).json({
            success: true,
            message: "Purchase return deleted successfully",
            data: {},
        });
    } catch (error) {
        return next(new ErrorResponse(error.message, 400));
    }
});

// ─── SUBMIT FOR APPROVAL (draft → pending) ───────────────────────────────────
export const submitPurchaseReturn = asyncHandler(async (req, res, next) => {
    const { id } = req.params;
    try {
        const submitted = await submitPurchaseReturn(id);
        res.status(200).json({
            success: true,
            message: "Purchase return submitted for approval",
            data: submitted,
        });
    } catch (error) {
        return next(new ErrorResponse(error.message, 400));
    }
});

// ─── APPROVE ─────────────────────────────────────────────────────────────────
export const approvePurchaseReturn = asyncHandler(async (req, res, next) => {
    const { id } = req.params;
    try {
        const approved = await approvePurchaseReturn(id, req.user._id);
        res.status(200).json({
            success: true,
            message: "Purchase return approved and stock deducted successfully",
            data: approved,
        });
    } catch (error) {
        return next(new ErrorResponse(error.message, 400));
    }
});

// ─── REJECT ─────────────────────────────────────────────────────────────────
export const rejectPurchaseReturn = asyncHandler(async (req, res, next) => {
    const { id } = req.params;
    const { rejectionReason } = req.body;
    if (!rejectionReason) {
        return next(new ErrorResponse("Rejection reason is required", 400));
    }
    try {
        const rejected = await rejectPurchaseReturn(id, rejectionReason);
        res.status(200).json({
            success: true,
            message: "Purchase return rejected successfully",
            data: rejected,
        });
    } catch (error) {
        return next(new ErrorResponse(error.message, 400));
    }
});

// ─── GENERATE NUMBER ─────────────────────────────────────────────────────────
export const generatePurchaseReturnNumber = asyncHandler(async (req, res) => {
    const purchaseReturnNumber = await generatePurchaseReturnNumber();
    res.status(200).json({ success: true, purchaseReturnNumber });
});
