import asyncHandler from "express-async-handler";
import ErrorResponse from "../../../common/utils/ErrorResponse.js";
import { getLocalProductModel, getLocalBatchModel } from "../../../configs/connect.db.js";

// ─── RECONCILE INVENTORY ─────────────────────────────────────────────────────────
// Validates that product.currentStockLevel equals sum of active batch quantities
// Returns discrepancies and optionally fixes them
export const reconcileInventory = asyncHandler(async (req, res, next) => {
    const ProductModel = getLocalProductModel();
    const BatchModel = getLocalBatchModel();
    const { fix = false } = req.query;

    const products = await ProductModel.find().populate("batches");
    const discrepancies = [];
    let fixedCount = 0;

    for (const product of products) {
        // Calculate sum of active batch quantities
        const activeBatches = product.batches.filter(b => b.isActive && b.quantity > 0);
        const calculatedStock = activeBatches.reduce((sum, batch) => sum + batch.quantity, 0);
        const currentStock = product.currentStockLevel || 0;

        if (calculatedStock !== currentStock) {
            const discrepancy = {
                productId: product._id,
                productName: product.name,
                currentStockLevel: currentStock,
                calculatedBatchSum: calculatedStock,
                difference: calculatedStock - currentStock,
                activeBatchesCount: activeBatches.length,
                totalBatchesCount: product.batches.length,
            };
            discrepancies.push(discrepancy);

            // Fix if requested
            if (fix === "true") {
                await ProductModel.findByIdAndUpdate(product._id, { currentStockLevel: calculatedStock });
                fixedCount++;
            }
        }
    }

    res.status(200).json({
        success: true,
        message: fix === "true" 
            ? `Reconciliation complete. Fixed ${fixedCount} discrepancies out of ${discrepancies.length} found.`
            : `Found ${discrepancies.length} inventory discrepancies.`,
        data: {
            totalProducts: products.length,
            discrepanciesFound: discrepancies.length,
            discrepanciesFixed: fixedCount,
            discrepancies,
        },
    });
});

// ─── VALIDATE BATCH STOCK ─────────────────────────────────────────────────────────
// Checks for batches with negative stock or expired batches that are still active
export const validateBatchStock = asyncHandler(async (req, res, next) => {
    const BatchModel = getLocalBatchModel();

    // Find batches with negative stock
    const negativeStockBatches = await BatchModel.find({ quantity: { $lt: 0 } })
        .populate("product", "name")
        .populate("supplier", "name");

    // Find expired batches that are still active
    const now = new Date();
    const expiredActiveBatches = await BatchModel.find({
        expiryDate: { $lt: now },
        isActive: true
    })
        .populate("product", "name")
        .populate("supplier", "name");

    res.status(200).json({
        success: true,
        message: "Batch stock validation complete",
        data: {
            negativeStockBatches: negativeStockBatches.map(b => ({
                batchId: b._id,
                batchNumber: b.batchNumber,
                productName: b.product?.name,
                supplierName: b.supplier?.name,
                quantity: b.quantity,
            })),
            expiredActiveBatches: expiredActiveBatches.map(b => ({
                batchId: b._id,
                batchNumber: b.batchNumber,
                productName: b.product?.name,
                supplierName: b.supplier?.name,
                expiryDate: b.expiryDate,
            })),
        },
    });
});

// ─── GET PRODUCT INVENTORY STATUS ─────────────────────────────────────────────────
// Returns detailed inventory status for a specific product
export const getProductInventoryStatus = asyncHandler(async (req, res, next) => {
    const ProductModel = getLocalProductModel();
    const BatchModel = getLocalBatchModel();
    const { productId } = req.params;

    const product = await ProductModel.findById(productId).populate("batches");
    if (!product) {
        return next(new ErrorResponse("Product not found", 404));
    }

    const activeBatches = product.batches.filter(b => b.isActive);
    const batchSum = activeBatches.reduce((sum, batch) => sum + batch.quantity, 0);
    const isConsistent = batchSum === (product.currentStockLevel || 0);

    // Check for expired batches
    const now = new Date();
    const expiredBatches = activeBatches.filter(b => b.expiryDate && new Date(b.expiryDate) < now);

    res.status(200).json({
        success: true,
        message: "Product inventory status retrieved",
        data: {
            productId: product._id,
            productName: product.name,
            currentStockLevel: product.currentStockLevel || 0,
            calculatedBatchSum: batchSum,
            isConsistent,
            difference: batchSum - (product.currentStockLevel || 0),
            totalBatches: product.batches.length,
            activeBatchesCount: activeBatches.length,
            expiredBatchesCount: expiredBatches.length,
            batches: activeBatches.map(b => ({
                batchId: b._id,
                batchNumber: b.batchNumber,
                quantity: b.quantity,
                sellingPrice: b.sellingPrice,
                expiryDate: b.expiryDate,
                isExpired: b.expiryDate && new Date(b.expiryDate) < now,
                isNegativeStock: b.quantity < 0,
            })),
        },
    });
});
