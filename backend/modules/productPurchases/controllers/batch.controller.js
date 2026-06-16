import asyncHandler from "express-async-handler";
import ErrorResponse from "../../../common/utils/ErrorResponse.js";
import {
    createBatchSchema,
    updateBatchSchema,
} from "../schemas/batch.schema.js";
import {
    getLocalBatchModel,
    getLocalProductModel,
} from "../../../configs/connect.db.js";
import { handleProductStockQuantity } from "../services/ChangeProductStockQuantity.js";

export const getBatches = asyncHandler(async (req, res, next) => {
    const BatchModel = getLocalBatchModel();

    const { productId } = req.params;

    let query = {};
    if (productId) {
        query.product = productId;
    }

    const batches = await BatchModel.find(query)
        .populate("product")
        .populate("supplier")
        .sort({ createdAt: -1 });

    res.status(200).json({
        success: true,
        message: "Batches retrieved successfully",
        data: batches,
    });
});

export const createBatch = asyncHandler(async (req, res, next) => {
    const BatchModel = getLocalBatchModel();
    const ProductModel = getLocalProductModel();

    const validatedData = await createBatchSchema.validate(req.body, {
        abortEarly: false,
        stripUnknown: true,
    });

    const existingBatch = await BatchModel.findOne({
        batchNumber: validatedData.batchNumber,
    });

    if (existingBatch) {
        return next(new ErrorResponse("Batch number already exists", 400));
    }

    const batch = await BatchModel.create(validatedData);

    // Add batch id to the related product.batches array
    await ProductModel.findByIdAndUpdate(validatedData.product, {
        $push: { batches: batch._id },
    });

    // Update product stock after batch creation
    await handleProductStockQuantity(validatedData.product, "create", validatedData.quantity);

    res.status(201).json({
        success: true,
        message: "Batch created successfully",
        data: batch,
    });
});

export const updateBatch = asyncHandler(async (req, res, next) => {
    const BatchModel = getLocalBatchModel();
    const ProductModel = getLocalProductModel();
    const { id } = req.params;

    let batch = await BatchModel.findById(id);

    if (!batch) {
        return next(new ErrorResponse("Batch not found", 404));
    }

    const validatedData = await updateBatchSchema.validate(req.body, {
        abortEarly: false,
        stripUnknown: true,
    });

    if (
        validatedData.batchNumber &&
        validatedData.batchNumber !== batch.batchNumber
    ) {
        const batchExists = await BatchModel.findOne({
            batchNumber: validatedData.batchNumber,
        });
        if (batchExists) {
            return next(new ErrorResponse("Batch number already in use", 400));
        }
    }

    // If quantity is being updated, adjust product stock accordingly
    if (validatedData.quantity !== undefined && validatedData.quantity !== batch.quantity) {
        const quantityDiff = validatedData.quantity - batch.quantity;
        await handleProductStockQuantity(batch.product, "create", quantityDiff);
    }

    batch = await BatchModel.findByIdAndUpdate(id, validatedData, {
        new: true,
        runValidators: true,
    });

    res.status(200).json({
        success: true,
        message: "Batch updated successfully",
        data: batch,
    });
});

export const deleteBatch = asyncHandler(async (req, res, next) => {
    const BatchModel = getLocalBatchModel();
    const ProductModel = getLocalProductModel();
    const { id } = req.params;

    const batch = await BatchModel.findById(id);

    if (!batch) {
        return next(new ErrorResponse("Batch not found", 404));
    }

    // Remove batch reference from product
    await ProductModel.findByIdAndUpdate(batch.product, {
        $pull: { batches: batch._id },
    });

    // Deduct batch quantity from product stock
    await handleProductStockQuantity(batch.product, "delete", batch.quantity);

    await batch.deleteOne();

    res.status(200).json({
        success: true,
        message: "Batch deleted successfully",
        data: {},
    });
});
