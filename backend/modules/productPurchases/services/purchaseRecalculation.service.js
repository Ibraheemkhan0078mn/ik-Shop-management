import { getPurchaseById } from "./purchase.service.js";

const calculatePerUnitValuesForPurchaseReturn = async (purchaseId) => {
    const purchase = await getPurchaseById(purchaseId);
    if (!purchase?.items?.length) throw new Error("Purchase not found or has no items");

    return purchase.items.map((item) => {
        const batch = item.batch || {};
        const quantity = Number(item.quantity) || 0;
        const costPrice = Number(batch.costPrice) || 0;
        const discountValue = Number(batch.discountEntryValue) || 0;
        const discountType = batch.discountEntryType || "percentage";
        const taxValue = Number(batch.taxEntryValue) || 0;
        const taxType = batch.taxEntryType || "percentage";
        const baseTotal = quantity * costPrice;
        const discountAmount = discountType === "fixed" ? discountValue * (batch.discountScope === "perUnit" ? quantity : 1) : baseTotal * discountValue / 100;
        const afterDiscount = Math.max(0, baseTotal - discountAmount);
        const taxAmount = taxType === "fixed" ? taxValue * (batch.taxScope === "perUnit" ? quantity : 1) : afterDiscount * taxValue / 100;
        const finalTotal = afterDiscount + taxAmount;
        return {
            productId: item.product?._id || item.product,
            batchId: batch._id || item.batch,
            quantity,
            price: Number(batch.defaultSellingPrice) || 0,
            costPrice,
            itemDiscountValue: discountValue,
            itemDiscountType: discountType,
            itemTaxValue: taxValue,
            itemTaxType: taxType,
            invoiceDiscountValue: 0,
            invoiceDiscountType: "percentage",
            invoiceBaseTotal: baseTotal,
            invoiceTotalDiscountAmount: 0,
            invoiceTaxValue: 0,
            invoiceTaxType: "percentage",
            invoiceTotalTaxAmount: 0,
            invoiceShippingCost: 0,
            invoiceItemNetTotal: finalTotal,
            baseTotal,
            totalItemDiscount: discountAmount,
            totalItemTax: taxAmount,
            totalOverallDiscount: 0,
            totalOverallTax: 0,
            totalShipping: 0,
            finalTotal,
            perUnitCosting: quantity ? finalTotal / quantity : 0,
        };
    });
};

export { calculatePerUnitValuesForPurchaseReturn };
