import { createWastageService, findWastageService, findOneWastageService, findByIdWastageService, updateWastageService, deleteOneWastageService, countWastageService } from "./wastage.crud.js";
import { findOneBatchService } from "../../productPurchases/services/batch.crud.js";
import { getProductCostingByBatch } from "../../product/services/productCosting.service.js";

const calculateWastageItemCosting = async (item) => {
    let batchId = item.batch?._id || item.batch;
    let batch = batchId ? await findOneBatchService({ _id: batchId, product: item.product }) : null;

    if (!batch && item.batchNumber && item.product) {
        batch = await findOneBatchService({ product: item.product, batchNumber: item.batchNumber });
        batchId = batch?._id;
    }

    const costing = batchId
        ? await getProductCostingByBatch(item.product, batchId)
        : { found: false };

    if (!costing.found) {
        const fallbackCost = Number(item.costPrice) || 0;
        return {
            ...item,
            costPrice: fallbackCost,
            totalLoss: (Number(item.quantity) || 0) * fallbackCost,
        };
    }

    const quantity = Number(item.quantity) || 0;
    const finalCosting = {
        baseCostPrice: costing.basePurchasePrice,
        discountValue: costing.discountValue,
        discountType: costing.discountType,
        discountAmount: costing.discountAmount,
        taxValue: costing.taxValue,
        taxType: costing.taxType,
        taxAmount: costing.taxAmount,
        invoiceDiscountValue: 0,
        invoiceDiscountType: "percentage",
        invoiceDiscountAmount: 0,
        invoiceTaxValue: 0,
        invoiceTaxType: "percentage",
        invoiceTaxAmount: 0,
        shippingAmount: 0,
        effectiveCostPrice: costing.effectiveCostPrice,
    };

    return {
        ...item,
        batch: batch._id,
        batchNumber: item.batchNumber || costing.batchNumber,
        expiryDate: item.expiryDate || batch.expiryDate,
        ...finalCosting,
        costPrice: finalCosting.effectiveCostPrice,
        totalLoss: quantity * finalCosting.effectiveCostPrice,
    };
};

const calculateWastageItems = async (items = []) => Promise.all(items.map(calculateWastageItemCosting));

const wastageCreate = async (data) => {
    return await createWastageService(data);
};

const getAllWastages = (query = {}) => {
    return findWastageService(query, { populate: [{ path: 'items.product', select: 'name _id' }], sort: { createdAt: -1 } });
};

const getWastageById = async (id) => {
    return await findByIdWastageService(id, { populate: [{ path: 'items.product', select: 'name _id' }] });
};

const wastageUpdate = async (id, data) => {
    return await updateWastageService(id, data);
};

const wastageDelete = async (id) => {
    return await deleteOneWastageService(id);
};

const countWastages = async (query = {}) => {
    return await countWastageService(query);
};

/**
 * Calculate wastage values from wastage documents
 * This function properly handles the items array structure in wastage documents
 * @param {Array} wastages - Array of wastage documents
 * @returns {Object} - Calculated wastage metrics
 */
const calculateWastageValues = (wastages) => {
    let totalWastageAmount = 0;
    let totalWastageQuantity = 0;
    let wastageCount = 0;
    
    const wastagesByProduct = {};
    const wastagesList = [];

    wastages.forEach(wastage => {
        // Calculate totals from items array
        const items = wastage.items || [];
        
        items.forEach(item => {
            const quantity = Number(item.quantity || 0);
            const costPrice = Number(item.costPrice || 0);
            const totalLoss = Number(item.totalLoss || (quantity * costPrice));

            // Accumulate total wastage amount
            totalWastageAmount += totalLoss;
            totalWastageQuantity += quantity;
            wastageCount += 1;

            // Get product name from populated product or fallback
            const productName = item.product?.name || item.product?._id?.toString() || 'Unknown Product';

            // Group by product for breakdown
            if (!wastagesByProduct[productName]) {
                wastagesByProduct[productName] = {
                    total: 0,
                    count: 0,
                    totalQuantity: 0
                };
            }
            wastagesByProduct[productName].total += totalLoss;
            wastagesByProduct[productName].count += 1;
            wastagesByProduct[productName].totalQuantity += quantity;

            // Add to wastages list for detailed view
            wastagesList.push({
                id: wastage._id,
                wastageNumber: wastage.wastageNumber,
                productName: productName,
                quantity: quantity,
                unit: item.unit,
                costPrice: costPrice,
                totalLoss: totalLoss,
                reason: item.reason || wastage.reason,
                batchNumber: item.batchNumber,
                expiryDate: item.expiryDate,
                date: wastage.wastageDate || wastage.createdAt
            });
        });
    });

    // Convert wastagesByProduct map to array
    const wastagesByProductArray = Object.entries(wastagesByProduct).map(([productName, data]) => ({
        _id: productName,
        productName: productName,
        total: data.total,
        count: data.count,
        totalQuantity: data.totalQuantity
    }));

    return {
        totalWastageAmount,
        totalWastageQuantity,
        wastageCount,
        wastagesByProduct: wastagesByProductArray,
        wastagesList: wastagesList.sort((a, b) => new Date(b.date) - new Date(a.date))
    };
};

export {
    wastageCreate,
    getAllWastages,
    getWastageById,
    wastageUpdate,
    wastageDelete,
    countWastages,
    calculateWastageValues,
    calculateWastageItems,
};
