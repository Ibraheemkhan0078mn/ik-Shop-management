import asyncHandler from "express-async-handler";
import ErrorResponse from "../../../common/utils/ErrorResponse.js";
import {
    getLocalProductModel,
    getLocalBatchModel,
    getLocalOrderModel,
    getLocalProductReturnModel,
    getLocalWastageModel,
    getLocalPurchaseReturnModel,
    getLocalPurchaseModel
} from "../../../configs/connect.db.js";
import {
    getBatches,
    createBatch,
    updateBatch,
    deleteBatch,
    generateBatchNumber,
    getBatchById,
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

export const generateBatchNumberData = asyncHandler(async (req, res, next) => {
    try {
        const batchNumber = await generateBatchNumber();

        res.status(200).json({
            success: true,
            message: "Batch number generated successfully",
            data: { batchNumber }
        });
    } catch (error) {
        return next(new ErrorResponse(error.message, 500));
    }
});

export const getBatchByIdData = asyncHandler(async (req, res, next) => {
    const { id } = req.params;
    const batch = await getBatchById(id);
    
    if (!batch) {
        return next(new ErrorResponse("Batch not found", 404));
    }
    
    res.status(200).json({
        success: true,
        message: "Batch retrieved successfully",
        data: batch,
    });
});

export const getBatchStockData = asyncHandler(async (req, res, next) => {
    const { id } = req.params;
    
    const BatchModel = getLocalBatchModel();
    const PurchaseModel = getLocalPurchaseModel();
    const PurchaseReturnModel = getLocalPurchaseReturnModel();
    const OrderModel = getLocalOrderModel();
    const ProductReturnModel = getLocalProductReturnModel();
    const WastageModel = getLocalWastageModel();
    
    const batch = await BatchModel.findById(id);
    if (!batch) {
        return next(new ErrorResponse("Batch not found", 404));
    }
    
    const batchId = batch._id;
    
    // 1. Purchased stock (delivered purchases for this batch)
    const purchases = await PurchaseModel.aggregate([
        {
            $match: {
                status: "delivered",
                isDeleted: false,
                "items.batch": batchId
            }
        },
        { $unwind: "$items" },
        {
            $match: {
                "items.batch": batchId
            }
        },
        {
            $group: {
                _id: null,
                totalPurchased: { $sum: "$items.quantity" }
            }
        }
    ]);
    const totalPurchased = purchases[0]?.totalPurchased || 0;

    // 2. Purchase returns (approved purchase returns for this batch)
    const purchaseReturns = await PurchaseReturnModel.aggregate([
        {
            $match: {
                status: "approved",
                isDeleted: false,
                "items.batch": batchId
            }
        },
        { $unwind: "$items" },
        {
            $match: {
                "items.batch": batchId
            }
        },
        {
            $group: {
                _id: null,
                totalPurchaseReturned: { $sum: "$items.quantity" }
            }
        }
    ]);
    const totalPurchaseReturned = purchaseReturns[0]?.totalPurchaseReturned || 0;

    // 3. Sales from orders (completed orders for this batch)
    const sales = await OrderModel.aggregate([
        {
            $match: {
                status: "completed",
                isDeleted: false,
                "items.batchId": batchId
            }
        },
        { $unwind: "$items" },
        {
            $match: {
                "items.batchId": batchId
            }
        },
        {
            $group: {
                _id: null,
                totalSold: { $sum: "$items.quantity" }
            }
        }
    ]);
    const totalSold = sales[0]?.totalSold || 0;

    // 4. Order returns / Product returns (approved returns for this batch)
    const productReturns = await ProductReturnModel.aggregate([
        {
            $match: {
                returnStatus: "approved",
                isDeleted: false,
                "items.batchId": batchId
            }
        },
        { $unwind: "$items" },
        {
            $match: {
                "items.batchId": batchId
            }
        },
        {
            $group: {
                _id: null,
                totalReturned: { $sum: "$items.quantity" }
            }
        }
    ]);
    const totalProductReturned = productReturns[0]?.totalReturned || 0;

    // 5. Wastage (approved wastage for this batch)
    const wastage = await WastageModel.aggregate([
        {
            $match: {
                status: "approved",
                isDeleted: false,
                $or: [
                    { "items.batch": batchId },
                    { "items.batchNumber": batch.batchNumber, "items.product": batch.product }
                ]
            }
        },
        { $unwind: "$items" },
        {
            $match: {
                $or: [
                    { "items.batch": batchId },
                    { "items.batchNumber": batch.batchNumber, "items.product": batch.product }
                ]
            }
        },
        {
            $group: {
                _id: null,
                totalWasted: { $sum: "$items.quantity" }
            }
        }
    ]);
    const totalWasted = wastage[0]?.totalWasted || 0;

    // Calculate current batch stock
    const calculatedStock = Math.max(0, totalPurchased - totalPurchaseReturned - totalSold + totalProductReturned - totalWasted);
    
    res.status(200).json({
        success: true,
        message: "Batch stock calculated successfully",
        data: {
            batchId: batchId,
            batchNumber: batch.batchNumber,
            quantity: calculatedStock,
            breakdown: {
                totalPurchased,
                totalPurchaseReturned,
                totalSold,
                totalProductReturned,
                totalWasted
            }
        },
    });
});
