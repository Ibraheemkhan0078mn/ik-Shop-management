import { createProductReturnService, findProductReturnService, findOneProductReturnService, findByIdProductReturnService, updateProductReturnService, deleteOneProductReturnService, countProductReturnService } from "./productReturn.crud.js";
import { findOneOrderService } from "../../pos/services/order.crud.js";
import { adjustStock, calculateStockDiff } from "../../../common/services/stockManager.js";
import { getTransactions } from "../../transactions/services/transaction.service.js";

const generateReturnNumber = async () => {
    const lastReturn = await findProductReturnService({}, { sort: { createdAt: -1 }, limit: 1 });
    const lastNumber = lastReturn.length ? parseInt(lastReturn[0].returnNumber.replace("RET-", "")) : 0;
    const newNumber = lastNumber + 1;
    return `RET-${String(newNumber).padStart(6, "0")}`;
};
  
const getOrderByNumber = async (orderNumber) => {
    return await findOneOrderService({ orderNumber });
};

// Helper function to calculate per-unit order discount share for an item
export const calculatePerUnitOrderDiscountShare = (order, orderItem) => {
    if (!order || !orderItem) return 0;
    
    const orderSubtotal = order.subtotal || 0;
    const orderDiscountAmount = order.discountAmount || 0;
    // Order subtotal is made from item totals after item discount and tax.
    // Use the same post-item-adjustment amount for proportional allocation.
    const itemLineTotal = orderItem.itemTotal ?? orderItem.lineTotal ?? 0;
    const itemQuantity = orderItem.quantity || 1;
    
    // If no order discount or subtotal, return 0
    if (orderSubtotal === 0 || orderDiscountAmount === 0) return 0;
    
    // Calculate item's share of order discount based on its contribution to subtotal
    const itemTotalOrderDiscountShare = (itemLineTotal / orderSubtotal) * orderDiscountAmount;
    
    // Calculate per-unit order discount share
    const perUnitOrderDiscountShare = itemTotalOrderDiscountShare / itemQuantity;
    
    return perUnitOrderDiscountShare;
};

const calculateReturnItemTotals = (item) => {
    const quantity = Number(item.quantity) || 0;
    const price = Number(item.originalPrice) || 0;
    const discountValue = Number(item.costing?.discountPercent) || 0;
    const discountType = item.costing?.discountType || "percentage";
    const taxValue = Number(item.costing?.taxPercent) || 0;
    const taxType = item.costing?.taxType || "percentage";
    const perUnitOrderDiscountShare = Number(item.perItemOrderDiscountShare?.perUnitOrderDiscountShare) || 0;

    // Calculate the complete returned line before applying discounts and tax.
    const lineTotal = price * quantity;
    const discountAmount = discountType === "fixed"
        ? discountValue * quantity
        : (lineTotal * discountValue) / 100;
    const orderDiscountAmount = perUnitOrderDiscountShare * quantity;
    const priceAfterItemDiscount = Math.max(0, lineTotal - discountAmount);
    const taxAmount = taxType === "fixed"
        ? taxValue * quantity
        : (priceAfterItemDiscount * taxValue) / 100;
    const priceAfterItemTax = priceAfterItemDiscount + taxAmount;
    const priceAfterDiscount = Math.max(0, priceAfterItemTax - orderDiscountAmount);
    const itemTotal = priceAfterDiscount;
    const unitCost = quantity > 0 ? itemTotal / quantity : 0;
    const refundAmount = Math.max(0, itemTotal - (Number(item.cut) || 0));

    return { lineTotal, discountAmount, orderDiscountAmount, priceAfterDiscount, taxAmount, itemTotal, unitCost, refundAmount };
};

const createProductReturn = async (returnData) => {
    const returnNumber = await generateReturnNumber();
    
    // Calculate refundAmount for each item if not provided or validate it
    const itemsWithCalculatedRefund = returnData.items.map(item => {
        const totals = calculateReturnItemTotals(item);
        
        return {
            ...item,
            cut: item.cut || 0,
            refundAmount: totals.refundAmount,
            costing: {
                ...item.costing,
                itemTotal: totals.unitCost,
                taxAmount: totals.taxAmount / (Number(item.quantity) || 1),
                discountAmount: totals.discountAmount / (Number(item.quantity) || 1),
            },
            perItemOrderDiscountShare: item.perItemOrderDiscountShare || {},
        };
    });
    
    const totalRefundAmount = itemsWithCalculatedRefund.reduce((sum, item) => sum + item.refundAmount, 0);
    
    const createdReturn = await createProductReturnService({
        returnNumber,
        referenceOrderId: returnData.referenceOrderId,
        referenceOrderNumber: returnData.referenceOrderNumber,
        items: itemsWithCalculatedRefund,
        totalRefundAmount,
        customerName: returnData.customerName,
        customerId: returnData.customerId,
        notes: returnData.notes,
        returnStatus: returnData.returnStatus || 'pending',
    });

    // If status is approved, increment stock immediately (like purchase return)
    if (returnData.returnStatus === 'approved') {
        for (const item of returnData.items) {
            await adjustStock(item.productId, item.batchId, 'inc', item.quantity);
        }
    }

    return createdReturn;
};

const getAllProductReturns = async (filters = {}) => {
    const { page = 1, limit = 10, status, search, referenceOrderId, customerId } = filters;
    const query = {};
    if (status) query.returnStatus = status;
    if (referenceOrderId) query.referenceOrderId = referenceOrderId;  // CRITICAL: Filter by specific order
    if (customerId) query.customerId = customerId;
    if (search) {
        query.$or = [
            { returnNumber: { $regex: search, $options: "i" } },
            { referenceOrderNumber: { $regex: search, $options: "i" } },
            { customerName: { $regex: search, $options: "i" } },
        ];
    }
    const productReturns = await findProductReturnService(query, {
        sort: { createdAt: -1 },
        skip: (page - 1) * limit,
        limit: parseInt(limit),
        populate: ["referenceOrderId", "items.productId"]
    });
    const total = await countProductReturnService(query);
    const normalizedReturns = await Promise.all(productReturns.map((productReturn) => normalizeProductReturnTotals(productReturn)));
    return {
        data: normalizedReturns,
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit),
    };
};

const getPaginatedProductReturns = async (filters = {}) => {
    const { page = 1, limit = 10, status, search, returnNumber, referenceOrderId, customerId } = filters;
    const query = {};
    if (status) query.returnStatus = status;
    if (referenceOrderId) query.referenceOrderId = referenceOrderId;  // CRITICAL: Filter by specific order
    if (customerId) query.customerId = customerId;
    if (returnNumber) query.returnNumber = { $regex: returnNumber, $options: "i" };
    if (search) {
        query.$or = [
            { returnNumber: { $regex: search, $options: "i" } },
            { referenceOrderNumber: { $regex: search, $options: "i" } },
            { customerName: { $regex: search, $options: "i" } },
        ];
    }
    const productReturns = await findProductReturnService(query, {
        sort: { createdAt: -1 },
        skip: (page - 1) * limit,
        limit: parseInt(limit),
        populate: ["referenceOrderId", "items.productId"]
    });
    const total = await countProductReturnService(query);
    const normalizedReturns = await Promise.all(productReturns.map((productReturn) => normalizeProductReturnTotals(productReturn)));
    return {
        data: normalizedReturns,
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit),
    };
};

const getItemRefundAmount = (item) => {
    if (!item) return 0;
    const directRefundAmount = Number(item.refundAmount ?? 0);
    if (Number.isFinite(directRefundAmount) && directRefundAmount >= 0) {
        return directRefundAmount;
    }
    return calculateReturnItemTotals(item).refundAmount;
};

const normalizeProductReturnTotals = async (productReturn) => {
    if (!productReturn) return null;

    const items = Array.isArray(productReturn.items) ? productReturn.items : [];
    const calculatedRefundAmount = items.reduce((sum, item) => sum + getItemRefundAmount(item), 0);
    const refundStatus = await calculateProductReturnRefundStatus(productReturn._id, calculatedRefundAmount);
    const normalized = {
        totalRefundAmount: calculatedRefundAmount,
        refundedAmount: refundStatus.totalRefunded,
        refundStatus: refundStatus.refundStatus,
    };

    const existingTotal = Number(productReturn.totalRefundAmount ?? 0);
    const needsUpdate = existingTotal !== calculatedRefundAmount || Number(productReturn.refundedAmount ?? 0) !== refundStatus.totalRefunded || (productReturn.refundStatus || 'pending') !== refundStatus.refundStatus;

    if (needsUpdate) {
        await updateProductReturnService(productReturn._id, normalized);
    }

    return {
        ...(productReturn.toObject ? productReturn.toObject() : productReturn),
        ...normalized,
    };
};

const getProductReturnById = async (id) => {
    const productReturn = await findByIdProductReturnService(id, { 
        populate: ["referenceOrderId", "items.productId", "customerId"]
    });
    return await normalizeProductReturnTotals(productReturn);
};

const updateProductReturn = async (id, updateData) => {
    const existing = await findByIdProductReturnService(id);
    if (!existing) {
        throw new Error("Product return not found");
    }

    // Calculate refundAmount for items if provided
    let itemsToUpdate = updateData.items;
    if (itemsToUpdate) {
        itemsToUpdate = itemsToUpdate.map(item => {
            const totals = calculateReturnItemTotals(item);
            
            return {
                ...item,
                cut: item.cut || 0,
                refundAmount: totals.refundAmount,
                costing: {
                    ...item.costing,
                    itemTotal: totals.unitCost,
                    taxAmount: totals.taxAmount / (Number(item.quantity) || 1),
                    discountAmount: totals.discountAmount / (Number(item.quantity) || 1),
                },
                perItemOrderDiscountShare: item.perItemOrderDiscountShare || {},
            };
        });
        
        // Recalculate total refund amount
        updateData.totalRefundAmount = itemsToUpdate.reduce((sum, item) => sum + item.refundAmount, 0);
        updateData.items = itemsToUpdate;
    }

    // Calculate stock adjustments based on item changes ONLY if returnStatus is approved
    if (updateData.items && existing.returnStatus === 'approved') {
        const adjustments = calculateStockDiff(existing.items, updateData.items);
        for (const adj of adjustments) {
            await adjustStock(adj.productId, adj.batchId, adj.operation, adj.quantity);
        }
    }

    return await updateProductReturnService(id, updateData, { populate: ["referenceOrderId", "items.productId"] });
};

const deleteProductReturn = async (id) => {
    const existing = await findByIdProductReturnService(id);
    if (!existing) {
        throw new Error("Product return not found");
    }

    // Only increment stock if return was approved
    if (existing.returnStatus === 'approved') {
        // Increment stock for all items before deletion
        for (const item of existing.items) {
            await adjustStock(item.productId, item.batchId, 'incr', item.quantity);
        }
    }

    // Delete all related transactions
    const transactions = await getTransactions({ sourceType: 'orderReturn', sourceId: id });
    for (const transaction of transactions) {
        const { deleteTransaction } = await import("../../transactions/services/transaction.service.js");
        await deleteTransaction(transaction._id);
    }

    return await deleteOneProductReturnService(id);
};

const updateReturnStatus = async (id, status) => {
    const existing = await findByIdProductReturnService(id);
    if (!existing) {
        throw new Error("Product return not found");
    }

    // If approving, increment stock for all items
    if (status === 'approved' && existing.returnStatus !== 'approved') {
        for (const item of existing.items) {
            await adjustStock(item.productId, item.batchId, 'inc', item.quantity);
        }
    }

    // If rejecting an approved return, decrement stock
    if (status === 'rejected' && existing.returnStatus === 'approved') {
        for (const item of existing.items) {
            await adjustStock(item.productId, item.batchId, 'decr', item.quantity);
        }
    }

    return await updateProductReturnService(id, { returnStatus: status }, { populate: ["referenceOrderId", "items.productId"] });
};

const calculateProductReturnRefundStatus = async (productReturnId, totalRefundAmount) => {
    const transactions = await getTransactions({ sourceType: 'orderReturn', sourceId: productReturnId });
    const totalRefunded = transactions.reduce((sum, t) => sum + (t.amount || 0), 0);
    
    let refundStatus = 'pending';
    if (totalRefunded >= totalRefundAmount && totalRefundAmount > 0) {
        refundStatus = 'fully_refunded';
    } else if (totalRefunded > 0) {
        refundStatus = 'partial';
    }
    
    return {
        totalRefunded,
        refundStatus,
        remainingAmount: Math.max(0, totalRefundAmount - totalRefunded)
    };
};

const recalculateProductReturnRefundAmount = async (productReturnId) => {
    const productReturn = await findByIdProductReturnService(productReturnId);
    if (!productReturn) {
        throw new Error("Product return not found");
    }

    // Recalculate total refund amount from items using taxType and discountType
    const calculatedRefundAmount = productReturn.items.reduce((sum, item) => (
        sum + calculateReturnItemTotals(item).refundAmount
    ), 0);

    // Update the product return with correct total
    await updateProductReturnService(productReturnId, {
        totalRefundAmount: calculatedRefundAmount
    });

    const refundStatus = await calculateProductReturnRefundStatus(productReturnId, calculatedRefundAmount);

    await updateProductReturnService(productReturnId, {
        refundedAmount: refundStatus.totalRefunded,
        refundStatus: refundStatus.refundStatus,
        totalRefundAmount: calculatedRefundAmount
    });

    return {
        ...refundStatus,
        totalRefundAmount: calculatedRefundAmount
    };
};

export {
    generateReturnNumber,
    getOrderByNumber,
    createProductReturn,
    getAllProductReturns,
    getPaginatedProductReturns,
    getProductReturnById,
    updateProductReturn,
    deleteProductReturn,
    updateReturnStatus,
    recalculateProductReturnRefundAmount,
};
