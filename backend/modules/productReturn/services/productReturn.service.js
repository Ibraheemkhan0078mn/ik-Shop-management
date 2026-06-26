import { createProductReturnService, findProductReturnService, findOneProductReturnService, findByIdProductReturnService, updateProductReturnService, deleteOneProductReturnService, countProductReturnService } from "./productReturn.crud.js";
import { getLocalOrderModel } from "../../../configs/connect.db.js";
import { adjustStock } from "../../../common/services/stockManager.js";

const generateReturnNumber = async () => {
    const lastReturn = await findProductReturnService({}).sort({ createdAt: -1 }).limit(1);
    const lastNumber = lastReturn.length ? parseInt(lastReturn[0].returnNumber.replace("RET-", "")) : 0;
    const newNumber = lastNumber + 1;
    return `RET-${String(newNumber).padStart(6, "0")}`;
};
  
const getOrderByNumber = async (orderNumber) => {
    const OrderModel = getLocalOrderModel();
    return await OrderModel.findOne({ orderNumber });
};

const createProductReturn = async (returnData) => {
    const returnNumber = await generateReturnNumber();
    const totalRefundAmount = returnData.items.reduce((sum, item) => sum + item.refundAmount, 0);
    
    const createdReturn = await createProductReturnService({
        returnNumber,
        referenceOrderId: returnData.referenceOrderId,
        referenceOrderNumber: returnData.referenceOrderNumber,
        items: returnData.items,
        totalRefundAmount,
        customerName: returnData.customerName,
        notes: returnData.notes,
    });

    // Increment stock for all returned items
    for (const item of returnData.items) {
        await adjustStock(item.productId, item.batchId, 'inc', item.quantity);
    }

    return createdReturn;
};

const getAllProductReturns = async (filters = {}) => {
    const { page = 1, limit = 10, status, search } = filters;
    const query = {};
    if (status) query.returnStatus = status;
    if (search) {
        query.$or = [
            { returnNumber: { $regex: search, $options: "i" } },
            { referenceOrderNumber: { $regex: search, $options: "i" } },
            { customerName: { $regex: search, $options: "i" } },
        ];
    }
    const productReturns = await findProductReturnService(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(parseInt(limit))
        .populate("referenceOrderId")
        .populate("items.productId");
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
    const { page = 1, limit = 10, status, search } = filters;
    const query = {};
    if (status) query.returnStatus = status;
    if (search) {
        query.$or = [
            { returnNumber: { $regex: search, $options: "i" } },
            { referenceOrderNumber: { $regex: search, $options: "i" } },
            { customerName: { $regex: search, $options: "i" } },
        ];
    }
    const productReturns = await findProductReturnService(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(parseInt(limit))
        .populate("referenceOrderId")
        .populate("items.productId");
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
    return await findByIdProductReturnService(id).populate("referenceOrderId").populate("items.productId");
};

const updateProductReturn = async (id, updateData) => {
    const existing = await findByIdProductReturnService(id);
    if (!existing) {
        throw new Error("Product return not found");
    }

    // Calculate stock adjustments based on item changes
    if (updateData.items) {
        const oldItemsMap = new Map();
        const newItemsMap = new Map();

        // Build old items map using productId and batchId as key
        for (const item of existing.items) {
            const key = `${item.productId}_${item.batchId}`;
            oldItemsMap.set(key, item);
        }

        // Build new items map using productId and batchId as key
        for (const item of updateData.items) {
            const key = `${item.productId}_${item.batchId}`;
            newItemsMap.set(key, item);
        }

        // Handle removed items - decrement stock
        for (const [key, oldItem] of oldItemsMap) {
            if (!newItemsMap.has(key)) {
                await adjustStock(oldItem.productId, oldItem.batchId, 'decr', oldItem.quantity);
            }
        }

        // Handle added items - increment stock
        for (const [key, newItem] of newItemsMap) {
            if (!oldItemsMap.has(key)) {
                await adjustStock(newItem.productId, newItem.batchId, 'inc', newItem.quantity);
            }
        }

        // Handle quantity changes
        for (const [key, newItem] of newItemsMap) {
            const oldItem = oldItemsMap.get(key);
            if (oldItem && oldItem.quantity !== newItem.quantity) {
                const diff = newItem.quantity - oldItem.quantity;
                if (diff > 0) {
                    await adjustStock(newItem.productId, newItem.batchId, 'inc', diff);
                } else {
                    await adjustStock(newItem.productId, newItem.batchId, 'decr', Math.abs(diff));
                }
            }
        }
    }

    return await updateProductReturnService(id, updateData).populate("referenceOrderId").populate("items.productId");
};

const deleteProductReturn = async (id) => {
    const existing = await findByIdProductReturnService(id);
    if (!existing) {
        throw new Error("Product return not found");
    }

    // If approved, decrement stock before deletion
    if (existing.returnStatus === 'approved') {
        for (const item of existing.items) {
            await adjustStock(item.productId, item.batchId, 'decr', item.quantity);
        }
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

    return await updateProductReturnService(id, { returnStatus: status }).populate("referenceOrderId").populate("items.productId");
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
};
