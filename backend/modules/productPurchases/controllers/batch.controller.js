import asyncHandler from "express-async-handler";
import ErrorResponse from "../../../common/utils/ErrorResponse.js";
import {
    getLocalProductModel,
} from "../../../configs/connect.db.js";
import {
    getBatches,
    createBatch,
    updateBatch,
    deleteBatch,
} from "../services/batch.service.js";

export const getBatchesData = asyncHandler(async (req, res, next) => {
    const { productId } = req.params;
    const batches = await getBatches(productId);
    res.status(200).json({
        success: true,
        message: "Batches retrieved successfully",
        data: batches,
    });
});

export const createBatchData = asyncHandler(async (req, res, next) => {
    const ProductModel = getLocalProductModel();

    const validatedData = req.body || {};

    try {
        const batch = await createBatch(validatedData, ProductModel);
        res.status(201).json({
            success: true,
            message: "Batch created successfully",
            data: batch,
        });
    } catch (error) {
        return next(new ErrorResponse(error.message, 400));
    }
});

export const updateBatchData = asyncHandler(async (req, res, next) => {
    const ProductModel = getLocalProductModel();
    const { id } = req.params;

    const validatedData = req.body || {};

    try {
        const batch = await updateBatch(id, validatedData, ProductModel);
        res.status(200).json({
            success: true,
            message: "Batch updated successfully",
            data: batch,
        });
    } catch (error) {
        return next(new ErrorResponse(error.message, 400));
    }
});

export const deleteBatchData = asyncHandler(async (req, res, next) => {
    const ProductModel = getLocalProductModel();
    const { id } = req.params;

    try {
        await deleteBatch(id, ProductModel);
        res.status(200).json({
            success: true,
            message: "Batch deleted successfully",
            data: {},
        });
    } catch (error) {
        return next(new ErrorResponse(error.message, 404));
    }
});
