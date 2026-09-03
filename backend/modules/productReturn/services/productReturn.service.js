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

const createProductReturn = async (returnData) => {
    const returnNumber = await generateReturnNumber();
    
    // Calculate refundAmount for each item if not provided or validate it
    const itemsWithCalculatedRefund = returnData.items.map(item => {
        const calculatedRefund = (item.quantity * item.originalPrice) - (item.cut || 0);
        return {
            ...item,
            cut: item.cut || 0,
            refundAmount: item.refundAmount || calculatedRefund,
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
    const { page = 1, limit = 10, status, search, referenceOrderId } = filters;
    const query = {};
    if (status) query.returnStatus = status;
    if (referenceOrderId) query.referenceOrderId = referenceOrderId;  // CRITICAL: Filter by specific order
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
    return {
        data: productReturns,
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit),
    };
};

const getPaginatedProductReturns = async (filters = {}) => {
    const { page = 1, limit = 10, status, search, returnNumber, referenceOrderId } = filters;
    const query = {};
    if (status) query.returnStatus = status;
    if (referenceOrderId) query.referenceOrderId = referenceOrderId;  // CRITICAL: Filter by specific order
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
    return {
        data: productReturns,
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit),
    };
};

const getProductReturnById = async (id) => {
    return await findByIdProductReturnService(id, { 
        populate: ["referenceOrderId", "items.productId", "customerId"]
    });
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
            const calculatedRefund = (item.quantity * item.originalPrice) - (item.cut || 0);
            return {
                ...item,
                cut: item.cut || 0,
                refundAmount: item.refundAmount || calculatedRefund,
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

    // Recalculate total refund amount from items (similar to order fix)
    const calculatedRefundAmount = productReturn.items.reduce((sum, item) => {
        const itemRefund = (item.quantity * item.originalPrice) - (item.cut || 0);
        return sum + itemRefund;
    }, 0);

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
