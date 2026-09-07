import { findOneBatchService } from "../../productPurchases/services/batch.crud.js";

const getProductCostingByBatch = async (productId, batchId) => {
    const emptyCosting = {
        productId,
        batchId,
        batchNumber: null,
        sellingPrice: 0,
        basePurchasePrice: 0,
        discountValue: 0,
        discountType: "percentage",
        discountAmount: 0,
        taxValue: 0,
        taxType: "percentage",
        taxAmount: 0,
        effectiveCostPrice: 0,
        found: false,
    };

    if (!productId || !batchId) return emptyCosting;

    const batch = await findOneBatchService({ _id: batchId, product: productId }, { populate: "product" });
    if (!batch) return emptyCosting;

    const basePurchasePrice = Number(batch.purchasePrice) || 0;
    const discountValue = Number(batch.discount?.amount) || 0;
    const discountType = batch.discount?.type || "percentage";
    const discountAmount = discountType === "percentage"
        ? (basePurchasePrice * discountValue) / 100
        : discountValue;
    const priceAfterDiscount = Math.max(0, basePurchasePrice - discountAmount);
    const taxValue = Number(batch.gst) || 0;
    const taxAmount = (priceAfterDiscount * taxValue) / 100;

    return {
        productId,
        batchId,
        batchNumber: batch.batchNumber || null,
        sellingPrice: Number(batch.sellingPrice) || 0,
        basePurchasePrice,
        discountValue,
        discountType,
        discountAmount,
        taxValue,
        taxType: "percentage",
        taxAmount,
        effectiveCostPrice: priceAfterDiscount + taxAmount,
        found: true,
    };
};

export { getProductCostingByBatch };