import asyncHandler from "express-async-handler";
import ErrorResponse from "../../../common/utils/ErrorResponse.js";
import {
    createBatchSchema,
    updateBatchSchema,
} from "../schema/batch.schema.js";
import {
    getLocalBatchModel,
    getLocalProductModel,
} from "../../../configs/connect.db.js";

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

    // add batch id to the related product.batches array
    await ProductModel.findByIdAndUpdate(validatedData.product, {
        $push: { batches: batch._id },
    });

    res.status(201).json({
        success: true,
        message: "Batch created successfully",
        data: batch,
    });
});

export const updateBatch = asyncHandler(async (req, res, next) => {
    const BatchModel = getLocalBatchModel();
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
    const { id } = req.params;

    const batch = await BatchModel.findById(id);

    if (!batch) {
        return next(new ErrorResponse("Batch not found", 404));
    }

    await batch.deleteOne();

    res.status(200).json({
        success: true,
        message: "Batch deleted successfully",
        data: {},
    });
});
