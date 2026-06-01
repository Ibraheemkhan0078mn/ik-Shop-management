import asyncHandler from "express-async-handler";
import { createPurchaseSchema, updatePurchaseSchema } from "../schema/purchase.schema.js";
import {
    getLocalPurchaseModel,
    getLocalBatchModel,
    getLocalProductModel,
} from "../../../configs/connect.db.js";
import { paginateModel } from "../../../common/services/common.service.js";
import mongoose from "mongoose";
import { handleProductStockQuantity } from "../services/ChangeProductStockQuantity.js";

export const getPurchases = asyncHandler(async (req, res, next) => {
    console.log("THe get purchase is hitted")
    const PurchaseModel = getLocalPurchaseModel();

    const purchases = await PurchaseModel.find()
        .populate("supplier", "name")
        .populate({
            path: "items.product",
            select: "name productCode",
        })
        .populate({
            path: "items.batch",
            select: "batchNumber",
        })
        .sort({ createdAt: -1 });

    res.status(200).json({
        success: true,
        message: "Purchases retrieved successfully",
        data: purchases,
    });
});




export const getPurchaseById = asyncHandler(async (req, res, next) => {
    const PurchaseModel = getLocalPurchaseModel();
    console.log("The purchase id is ", req.params.id)
    const purchase = await PurchaseModel.findById(new mongoose.Types.ObjectId(req.params.id))
        .populate("supplier", "name")
        .populate({
            path: "items.product",
            select: "name productCode",
        })
        .populate({
            path: "items.batch",
            select: "batchNumber",
        });
    res.status(200).json({
        success: true,
        message: "Purchase retrieved successfully",
        data: purchase,
    });
})



export const getPurchaseByInvoiceNumber = asyncHandler(async (req, res, next) => {
    let { invoiceNumber } = req.body;
    console.log(invoiceNumber, "The inboive number`")
    if (!invoiceNumber) return res.json({ success: false, msg: "The invoice number is required" })
    let PurchaseModel = getLocalPurchaseModel()
 
    let purchasesData = await PurchaseModel.findOne({ invoiceNumber: invoiceNumber }).populate("items.product").populate("items.batch")
    if (!purchasesData) {
        return res.json({ success: false, msg: "The purchases is not found" })
    }


    return res.json({ success: false, msg: "The purchaes is found.", data: purchasesData })

})



export const getPaginatedPurchases = asyncHandler(async (req, res, next) => {
    const PurchaseModel = getLocalPurchaseModel();

    // const purchases = await PurchaseModel.find()
    //     .populate("supplier", "name")
    //     .populate({
    //         path: "items.product",
    //         select: "name productCode",
    //     })
    //     .populate({
    //         path: "items.batch",
    //         select: "batchNumber",
    //     })
    //     .sort({ createdAt: -1 });

    if (!req.query.page || !req.query.limit) {
        return res.json({ success: false, msg: "The page and limit both are required. " })
    }
    const purchases = await paginateModel({
        model: PurchaseModel,
        page: req.query.page,
        limit: req.query.limit,
        populate: ["supplier", "items.product", "items.batch"],
        sort: { createdAt: -1 },
    });

    res.status(200).json({
        success: true,
        message: "Purchases retrieved successfully",
        data: purchases,
    });
});

export const createPurchase = asyncHandler(async (req, res, next) => {
    const PurchaseModel = getLocalPurchaseModel();
    const BatchModel = getLocalBatchModel();
    const ProductModel = getLocalProductModel();

    const validatedData = await createPurchaseSchema.validate(req.body, {
        abortEarly: false,
        stripUnknown: true,
    });

    const purchaseItems = [];

    for (const item of validatedData.items) {
        let batch = await BatchModel.findOne({
            batchNumber: item.batchNumber,
            product: item.product,
        });

        if (!batch) {
            batch = await BatchModel.create({
                product: item.product,
                batchNumber: item.batchNumber,
                supplier: validatedData.supplier,
                quantity: item.quantity,
                purchasePrice: item.price,
                sellingPrice: item.price,
                mfgDate: item.mfgDate,
                expiryDate: item.expiryDate,
            });

            await ProductModel.findByIdAndUpdate(item.product, {
                $push: { batches: batch._id },
            });
        } else {
            batch.quantity += item.quantity;
            batch.purchasePrice = item.price;
            if (item.mfgDate) {
                batch.mfgDate = item.mfgDate;
            }
            if (item.expiryDate) {
                batch.expiryDate = item.expiryDate;
            }
            if (validatedData.supplier) {
                batch.supplier = validatedData.supplier;
            }
            await batch.save();
        }


        // await ProductModel.findOneAndUpdate(
        //     { _id: item?.product },
        //     { $inc: { currentStockLevel: item?.quantity } }
        // );


        await handleProductStockQuantity(item?.product,"create", item?.quantity)

        purchaseItems.push({
            product: item.product,
            batch: batch._id,
            quantity: item.quantity,
            price: item.price,
            discount: item.discount,
            discountType: item.discountType,
            tax: item.tax,
            taxType: item.taxType,
            mfgDate: item.mfgDate,
            expiryDate: item.expiryDate,
        });
    }

    const purchase = await PurchaseModel.create({
        supplier: validatedData.supplier,
        date: validatedData.date,
        invoiceNumber: validatedData.invoiceNumber,
        items: purchaseItems,
        subtotal: validatedData.subtotal,
        discount: validatedData.discount,
        discountType: validatedData.discountType,
        gst: validatedData.gst,
        shippingCost: validatedData.shippingCost,
        totalAmount: validatedData.totalAmount,
        notes: validatedData.notes,
    });

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


























export const updatePurchase = asyncHandler(async (req, res, next) => {
    const PurchaseModel = getLocalPurchaseModel();
    const BatchModel = getLocalBatchModel();
    const ProductModel = getLocalProductModel();

    const existing = await PurchaseModel.findById(req.params.id);
    if (!existing) return res.status(404).json({ success: false, message: "Purchase not found" });

    const data = await updatePurchaseSchema.validate(req.body, { abortEarly: false, stripUnknown: true });

    // Step 1: Purana stock reverse karo
    for (const old of existing.items) {
        await ProductModel.findByIdAndUpdate(old.product, { $inc: { currentStockLevel: -old.quantity } });

        const oldBatch = await BatchModel.findById(old.batch);
        if (oldBatch) {
            oldBatch.quantity -= old.quantity;
            if (oldBatch.quantity <= 0) {
                await oldBatch.deleteOne();
                await ProductModel.findByIdAndUpdate(old.product, { $pull: { batches: oldBatch._id } });
            } else {
                await oldBatch.save();
            }
        }
    }

    // Step 2: Naye items process karo
    const purchaseItems = [];
    for (const item of data.items) {
        let batch = await BatchModel.findOne({ batchNumber: item.batchNumber, product: item.product });

        if (!batch) {
            batch = await BatchModel.create({
                product: item.product, batchNumber: item.batchNumber,
                supplier: data.supplier, quantity: item.quantity,
                purchasePrice: item.price, sellingPrice: item.price,
                mfgDate: item.mfgDate, expiryDate: item.expiryDate,
            });
            await ProductModel.findByIdAndUpdate(item.product, { $push: { batches: batch._id } });
        } else {
            batch.quantity += item.quantity;
            batch.purchasePrice = item.price;
            if (item.mfgDate) batch.mfgDate = item.mfgDate;
            if (item.expiryDate) batch.expiryDate = item.expiryDate;
            if (data.supplier) batch.supplier = data.supplier;
            await batch.save();
        }

        await ProductModel.findByIdAndUpdate(item.product, { $inc: { currentStockLevel: item.quantity } });

        purchaseItems.push({
            product: item.product, batch: batch._id,
            quantity: item.quantity, price: item.price,
            discount: item.discount, discountType: item.discountType,
            tax: item.tax, taxType: item.taxType,
            mfgDate: item.mfgDate, expiryDate: item.expiryDate,
        });
    }

    // Step 3: Purchase save karo
    const updated = await PurchaseModel.findByIdAndUpdate(
        req.params.id,
        {
            supplier: data.supplier, date: data.date,
            invoiceNumber: data.invoiceNumber, items: purchaseItems,
            subtotal: data.subtotal, discount: data.discount,
            discountType: data.discountType, gst: data.gst,
            shippingCost: data.shippingCost, totalAmount: data.totalAmount,
            notes: data.notes,
        },
        { new: true }
    );

    res.status(200).json({ success: true, message: "Purchase updated successfully", data: updated });
});









export const deletePurchase = asyncHandler(async (req, res, next) => {
    const PurchaseModel = getLocalPurchaseModel();
    const BatchModel = getLocalBatchModel();
    const ProductModel = getLocalProductModel();

    const existing = await PurchaseModel.findById(req.params.id);
    if (!existing) return res.status(404).json({ success: false, message: "Purchase not found" });

    // Step 1: Stock aur batch reverse karo
    // for (const item of existing.items) {
    //     await ProductModel.findByIdAndUpdate(item.product, {
    //         $inc: { currentStockLevel: -item.quantity },
    //     });

    //     const batch = await BatchModel.findById(item.batch);
    //     if (batch) {
    //         batch.quantity -= item.quantity;
    //         if (batch.quantity <= 0) {
    //             await batch.deleteOne();
    //             await ProductModel.findByIdAndUpdate(item.product, {
    //                 $pull: { batches: batch._id },
    //             });
    //         } else {
    //             await batch.save();
    //         }
    //     }
    // }

    // Step 2: Purchase delete karo
    await existing.deleteOne();

    res.status(200).json({ success: true, message: "Purchase deleted successfully" });
});




