import { findOneBatchService } from "../../productPurchases/services/batch.crud.js";

const toNumber = (value) => {
    const numericValue = Number(value);
    return Number.isFinite(numericValue) ? numericValue : 0;
};

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

    const directCost = toNumber(batch.perUnitCosting) || toNumber(batch.costPrice) || toNumber(batch.purchasePrice) || 0;
    const sellingPrice = toNumber(batch.defaultSellingPrice) || toNumber(batch.sellingPrice) || 0;

    return {
        productId,
        batchId,
        batchNumber: batch.batchNumber || null,
        sellingPrice,
        basePurchasePrice: directCost,
        discountValue: 0,
        discountType: "percentage",
        discountAmount: 0,
        taxValue: 0,
        taxType: "percentage",
        taxAmount: 0,
        effectiveCostPrice: directCost,
        found: true,
    };
};

export { getProductCostingByBatch };