import {
    createPurchaseReturnService,
    findPurchaseReturnService,
    findOnePurchaseReturnService,
    findByIdPurchaseReturnService,
    updatePurchaseReturnService,
    deleteOnePurchaseReturnService,
    countPurchaseReturnService
} from "./purchaseReturn.crud.js";
import { getTransactions } from "../../transactions/services/transaction.service.js";

const createPurchaseReturn = async (data) => {
    return await createPurchaseReturnService(data);
};

const getAllPurchaseReturns = async (query = {}) => {
    return await findPurchaseReturnService(query, {
        populate: [
            { path: "purchase", select: "invoiceNumber date totalAmount" },
            { path: "supplier", select: "name" },
            { path: "items.product", select: "name productCode" },
            { path: "items.batch", select: "batchNumber" }
        ],
        sort: { createdAt: -1 }
    });
};

const getPurchaseReturnById = async (id) => {
    return await findByIdPurchaseReturnService(id, {
        populate: [
            { path: "purchase", select: "invoiceNumber date totalAmount" },
            { path: "supplier", select: "name" },
            { path: "items.product", select: "name productCode" },
            { path: "items.batch", select: "batchNumber" }
        ]
    });
};

const findPurchaseReturnByPurchase = async (purchaseId) => {
    return await findOnePurchaseReturnService({ purchase: purchaseId }, {
        populate: [
            { path: "purchase", select: "invoiceNumber date totalAmount" },
            { path: "supplier", select: "name" },
            { path: "items.product", select: "name productCode" },
            { path: "items.batch", select: "batchNumber" }
        ]
    });
};

const updatePurchaseReturn = async (id, data) => {
    return await updatePurchaseReturnService(id, data);
};

const deletePurchaseReturn = async (id) => {
    return await deleteOnePurchaseReturnService(id);
};

const countPurchaseReturns = async (query = {}) => {
    return await countPurchaseReturnService(query);
};

const getPaginatedPurchaseReturns = async (filters = {}) => {
    const { page = 1, limit = 20, status, search, returnHash } = filters;
    const query = {};
    
    if (status) query.status = status;
    if (returnHash) query.returnNumber = { $regex: returnHash, $options: "i" };
    if (search) {
        query.$or = [
            { returnNumber: { $regex: search, $options: "i" } },
            { notes: { $regex: search, $options: "i" } }
        ];
    }
    
    const skip = (page - 1) * limit;
    
    const purchaseReturns = await findPurchaseReturnService(query, {
        sort: { createdAt: -1 },
        skip: skip,
        limit: limit,
        populate: [
            { path: "purchase", select: "invoiceNumber date totalAmount" },
            { path: "supplier", select: "name" },
            { path: "items.product", select: "name productCode" },
            { path: "items.batch", select: "batchNumber" }
        ]
    });
    
    const total = await countPurchaseReturnService(query);
    
    return {
        data: purchaseReturns,
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
    };
};

/**
 * Calculate refund status for a purchase return based on transactions
 * Returns object with totalRefunded, remainingAmount, refundStatus, and transaction details
 */
const calculatePurchaseReturnRefundStatus = async (purchaseReturnId, totalRefundAmount) => {
    const transactions = await getTransactions({ sourceType: 'purchaseReturn', sourceId: purchaseReturnId });
    
    const totalRefunded = transactions.reduce((sum, t) => sum + (t.amount || 0), 0) || 0;
    const remainingAmount = totalRefundAmount - totalRefunded;
    
    let refundStatus = 'pending';
    if (remainingAmount <= 0) {
        refundStatus = 'full';
    } else if (totalRefunded > 0) {
        refundStatus = 'partial';
    }
    
    // Calculate cash and credit breakdowns
    const totalCash = transactions.reduce((sum, t) => sum + (t.cashAmount || 0), 0) || 0;
    const totalCredit = transactions.reduce((sum, t) => sum + (t.creditAmount || 0), 0) || 0;
    
    return {
        totalRefunded,
        remainingAmount,
        refundStatus,
        totalCash,
        totalCredit,
        transactionCount: transactions.length,
        transactions
    };
};

/**
 * Recalculate and update purchase return refundedAmount from all related transactions
 * This function syncs the purchase return document's refundedAmount with the actual transaction totals
 */
const recalculatePurchaseReturnRefundAmount = async (purchaseReturnId) => {
    const purchaseReturn = await getPurchaseReturnById(purchaseReturnId);
    if (!purchaseReturn) {
        throw new Error("Purchase return not found");
    }

    // Handle both direct purchase return object and wrapped response
    const totalRefundAmount = purchaseReturn?.totalRefundAmount || purchaseReturn?.data?.totalRefundAmount;
    if (!totalRefundAmount && totalRefundAmount !== 0) {
        throw new Error("Purchase return total refund amount not found");
    }

    const refundStatus = await calculatePurchaseReturnRefundStatus(purchaseReturnId, totalRefundAmount);

    // Update purchase return with recalculated values using direct service to avoid items iteration
    await updatePurchaseReturnService(purchaseReturnId, {
        refundedAmount: refundStatus.totalRefunded,
        refundStatus: refundStatus.refundStatus
    });

    return refundStatus;
};

export {
    createPurchaseReturn,
    getAllPurchaseReturns,
    getPurchaseReturnById,
    findPurchaseReturnByPurchase,
    updatePurchaseReturn,
    deletePurchaseReturn,
    countPurchaseReturns,
    getPaginatedPurchaseReturns,
    calculatePurchaseReturnRefundStatus,
    recalculatePurchaseReturnRefundAmount
};
