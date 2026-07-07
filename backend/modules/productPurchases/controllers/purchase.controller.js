import asyncHandler from "express-async-handler";
import {
    getLocalBatchModel,
    getLocalProductModel,
} from "../../../configs/connect.db.js";
import mongoose from "mongoose";
import {
    getPurchases,
    getPurchaseById,
    getPurchaseByInvoiceNumber,
    getPaginatedPurchases,
    createPurchase,
    updatePurchase,
    deletePurchase,
} from "../services/purchase.service.js";
import {
    createPurchasePayment,
    getPurchasePayments,
    getPurchasePaymentById,
    deletePurchasePayment,
} from "../services/purchasePayment.service.js";

export const getPurchasesData = asyncHandler(async (req, res, next) => {
    const purchases = await getPurchases();
    res.status(200).json({
        success: true,
        message: "Purchases retrieved successfully",
        data: purchases,
    });
});




export const getPurchaseDataById = asyncHandler(async (req, res, next) => {
    const purchase = await getPurchaseById(req.params.id);
    res.status(200).json({
        success: true,
        message: "Purchase retrieved successfully",
        data: purchase,
    });
})



export const getPurchaseDataByInvoiceNumber = asyncHandler(async (req, res) => {
    const { invoiceNumber } = req.body;
    if (!invoiceNumber)
        return res.status(400).json({ success: false, message: "Invoice number is required" });

    const purchase = await getPurchaseByInvoiceNumber(invoiceNumber);
    if (!purchase)
        return res.status(404).json({ success: false, message: "Purchase not found" });

    return res.status(200).json({ success: true, message: "Purchase found", data: purchase });
});



export const getPaginatedPurchasesData = asyncHandler(async (req, res) => {
    const result = await getPaginatedPurchases(req.query);
    res.status(200).json({
        success: true,
        message: "Purchases retrieved successfully",
        ...result,
    });
});

export const createPurchaseData = asyncHandler(async (req, res, next) => {
    const BatchModel = getLocalBatchModel();
    const ProductModel = getLocalProductModel();

    const validatedData = req.body || {};

    const purchase = await createPurchase(validatedData, BatchModel, ProductModel);

    res.status(201).json({
        success: true,
        message: "Purchase recorded successfully",
        data: purchase,
    });
});




// export const updatePurchase = asyncHandler(async (req, res, next) => {



//     const PurchaseModel = getLocalPurchaseModel();
//     const BatchModel    = getLocalBatchModel();
//     const ProductModel  = getLocalProductModel();

//     const { id } = req.params;

//     // ── Purani purchase fetch karo ───────────────────────────
//     const existingPurchase = await PurchaseModel.findById(id);
//     if (!existingPurchase) return next(new ErrorResponse("Purchase not found", 404));

//     const validatedData = await updatePurchaseSchema.validate(req.body, {
//         abortEarly: false,
//         stripUnknown: true,
//     });

//     // ── Step 1: Purane items ka stock WAPAS karo ─────────────
//     // Pehle purani purchase ke items ka stock reverse karo
//     for (const oldItem of existingPurchase.items) {
//         // Product ka stock minus karo
//         await ProductModel.findByIdAndUpdate(oldItem.product, {
//             $inc: { currentStockLevel: -oldItem.quantity },
//         });

//         // Batch ki quantity bhi reverse karo
//         const oldBatch = await BatchModel.findById(oldItem.batch);
//         if (oldBatch) {
//             oldBatch.quantity -= oldItem.quantity;
//             if (oldBatch.quantity <= 0) {
//                 // Quantity zero ya negative ho gayi — batch delete karo
//                 await oldBatch.deleteOne();
//                 await ProductModel.findByIdAndUpdate(oldItem.product, {
//                     $pull: { batches: oldBatch._id },
//                 });
//             } else {
//                 await oldBatch.save();
//             }
//         }
//     }

//     // ── Step 2: Naye items process karo ─────────────────────
//     const purchaseItems = [];

//     for (const item of validatedData.items) {
//         let batch = await BatchModel.findOne({
//             batchNumber: item.batchNumber,
//             product:     item.product,
//         });

//         if (!batch) {
//             // Naya batch banao
//             batch = await BatchModel.create({
//                 product:       item.product,
//                 batchNumber:   item.batchNumber,
//                 supplier:      validatedData.supplier,
//                 quantity:      item.quantity,
//                 purchasePrice: item.price,
//                 sellingPrice:  item.price,
//                 mfgDate:       item.mfgDate,
//                 expiryDate:    item.expiryDate,
//             });

//             await ProductModel.findByIdAndUpdate(item.product, {
//                 $push: { batches: batch._id },
//             });
//         } else {
//             // Existing batch update karo
//             batch.quantity      += item.quantity;
//             batch.purchasePrice  = item.price;
//             if (item.mfgDate)          batch.mfgDate   = item.mfgDate;
//             if (item.expiryDate)       batch.expiryDate = item.expiryDate;
//             if (validatedData.supplier) batch.supplier  = validatedData.supplier;
//             await batch.save();
//         }

//         // Product ka stock add karo
//         await ProductModel.findByIdAndUpdate(item.product, {
//             $inc: { currentStockLevel: item.quantity },
//         });

//         purchaseItems.push({
//             product:      item.product,
//             batch:        batch._id,
//             quantity:     item.quantity,
//             price:        item.price,
//             discount:     item.discount,
//             discountType: item.discountType,
//             tax:          item.tax,
//             taxType:      item.taxType,
//             mfgDate:      item.mfgDate,
//             expiryDate:   item.expiryDate,
//         });
//     }

//     // ── Step 3: Purchase update karo ────────────────────────
//     const updatedPurchase = await PurchaseModel.findByIdAndUpdate(
//         id,
//         {
//             supplier:      validatedData.supplier,
//             date:          validatedData.date,
//             invoiceNumber: validatedData.invoiceNumber,
//             items:         purchaseItems,
//             subtotal:      validatedData.subtotal,
//             discount:      validatedData.discount,
//             discountType:  validatedData.discountType,
//             gst:           validatedData.gst,
//             shippingCost:  validatedData.shippingCost,
//             totalAmount:   validatedData.totalAmount,
//             notes:         validatedData.notes,
//         },
//         { new: true, runValidators: true }
//     );

//     res.status(200).json({
//         success: true,
//         message: "Purchase updated successfully",
//         data: updatedPurchase,
//     });
// });


























export const updatePurchaseData = asyncHandler(async (req, res, next) => {
    const BatchModel = getLocalBatchModel();
    const ProductModel = getLocalProductModel();

    const data = req.body || {};

    try {
        const updated = await updatePurchase(req.params.id, data, BatchModel, ProductModel);
        res.status(200).json({ success: true, message: "Purchase updated successfully", data: updated });
    } catch (error) {
        return res.status(404).json({ success: false, message: error.message });
    }
});









export const deletePurchaseData = asyncHandler(async (req, res) => {
    const BatchModel = getLocalBatchModel();
    const ProductModel = getLocalProductModel();

    try {
        await deletePurchase(req.params.id, BatchModel, ProductModel);
        res.status(200).json({ success: true, message: "Purchase deleted successfully" });
    } catch (error) {
        return res.status(404).json({ success: false, message: error.message });
    }
});

export const updatePurchaseStatus = asyncHandler(async (req, res) => {
    const { getLocalPurchaseModel, getLocalBatchModel, getLocalProductModel } = await import("../../../configs/connect.db.js");
    const PurchaseModel = getLocalPurchaseModel();
    const BatchModel = getLocalBatchModel();
    const ProductModel = getLocalProductModel();

    const { id } = req.params;
    const { status } = req.body;

    if (!['ordered', 'delivered', 'rejected'].includes(status)) {
        return res.status(400).json({ success: false, message: "Invalid status" });
    }

    const purchase = await PurchaseModel.findById(id);
    if (!purchase) {
        return res.status(404).json({ success: false, message: "Purchase not found" });
    }

    const oldStatus = purchase.status;

    // If changing from delivered to something else, reverse stock
    if (oldStatus === 'delivered' && status !== 'delivered') {
        for (const item of purchase.items) {
            const batch = await BatchModel.findById(item.batch);
            if (batch) {
                batch.quantity -= item.quantity;
                if (batch.quantity < 0) batch.quantity = 0;
                await batch.save();
            }
            
            // Reverse master product stock
            await ProductModel.findByIdAndUpdate(item.product, {
                $inc: { currentStockLevel: -item.quantity }
            });
        }
    }

    purchase.status = status;

    // If status is delivered (and wasn't before), increment stock for all items
    if (status === 'delivered' && oldStatus !== 'delivered') {
        for (const item of purchase.items) {
            const batch = await BatchModel.findById(item.batch);
            if (batch) {
                batch.quantity += item.quantity;
                await batch.save();
            }
            
            // Increment master product stock
            await ProductModel.findByIdAndUpdate(item.product, {
                $inc: { currentStockLevel: item.quantity }
            });
        }
    }

    await purchase.save();

    res.status(200).json({
        success: true,
        message: `Purchase status updated to ${status}`,
        data: purchase,
    });
});

export const createPurchasePaymentData = asyncHandler(async (req, res) => {
    try {
        const paymentData = {
            ...req.body,
            createdBy: req.user?._id,
        };
        const payment = await createPurchasePayment(paymentData);
        res.status(201).json({
            success: true,
            message: "Purchase payment recorded successfully",
            data: payment,
        });
    } catch (error) {
        return res.status(400).json({ success: false, message: error.message });
    }
}); 

export const getPurchasePaymentsData = asyncHandler(async (req, res) => {
    try {
        const payments = await getPurchasePayments(req.params.id);
        res.status(200).json({
            success: true,
            message: "Purchase payments retrieved successfully",
            data: payments,
        });
    } catch (error) {
        return res.status(400).json({ success: false, message: error.message });
    }
});

export const deletePurchasePaymentData = asyncHandler(async (req, res) => {
    try {
        const result = await deletePurchasePayment(req.params.paymentId);
        res.status(200).json({
            success: true,
            message: result.message,
            data: result,
        });
    } catch (error) {
        return res.status(400).json({ success: false, message: error.message });
    }
});




