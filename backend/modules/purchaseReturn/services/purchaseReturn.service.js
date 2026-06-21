import { create, find, findOne, findById, update, deleteOne, count } from "./purchaseReturn.crud.js";
import { getLocalPurchaseModel, getLocalBatchModel } from "../../../configs/connect.db.js";
import { handleProductStockQuantity } from "../../productPurchases/services/ChangeProductStockQuantity.js";

const getPurchaseReturns = async (filters = {}) => {
    const { status, supplier, startDate, endDate } = filters;
    let query = {};
    if (status) query.status = status;
    if (supplier) query.supplier = supplier;
    if (startDate || endDate) {
        query.returnDate = {};
        if (startDate) query.returnDate.$gte = new Date(startDate);
        if (endDate) query.returnDate.$lte = new Date(endDate);
    }

    return await find(query)
        .populate("purchase", "invoiceNumber")
        .populate("supplier", "name")
        .populate("items.product", "name")
        .populate("items.batch", "batchNumber")
        .sort({ createdAt: -1 });
};

const getPaginatedPurchaseReturns = async (filters = {}) => {
    const { page = 1, limit = 20, status, supplier } = filters;
    let query = {};
    if (status) query.status = status;
    if (supplier) query.supplier = supplier;

    const purchaseReturns = await find(query)
        .populate("purchase", "invoiceNumber")
        .populate("supplier", "name")
        .populate("items.product", "name")
        .populate("items.batch", "batchNumber")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(parseInt(limit));

    const total = await count(query);

    return {
        data: purchaseReturns,
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit),
    };
};

const getPurchaseReturnById = async (id) => {
    return await findById(id)
        .populate("purchase")
        .populate("supplier")
        .populate("items.product")
        .populate("items.batch");
};

const createPurchaseReturn = async (data, userId) => {
    const PurchaseReturnModel = require("./purchaseReturn.crud.js").PurchaseReturnModel || getLocalPurchaseReturnModel();
    const PurchaseModel = getLocalPurchaseModel();
    const BatchModel = getLocalBatchModel();

    // Generate purchase return number
    const startOfDay = new Date(new Date().setHours(0, 0, 0, 0));
    const endOfDay = new Date(new Date().setHours(23, 59, 59, 999));
    const dateRange = { createdAt: { $gte: startOfDay, $lt: endOfDay } };

    const countValue = await count(dateRange);
    const dateStr = startOfDay.toISOString().slice(0, 10).replace(/-/g, "");
    const purchaseReturnNumber = `PR-${dateStr}-${String(countValue + 1).padStart(4, "0")}`;

    // Validate that purchase exists
    const purchase = await PurchaseModel.findById(data.purchase);
    if (!purchase) {
        throw new Error("Purchase not found");
    }

    // Validate batches and quantities
    for (const item of data.items) {
        const batch = await BatchModel.findById(item.batch);
        if (!batch) {
            throw new Error(`Batch not found: ${item.batchNumber}`);
        }
        if (batch.quantity < item.quantity) {
            throw new Error(`Insufficient quantity in batch ${item.batchNumber}. Available: ${batch.quantity}, Required: ${item.quantity}`);
        }
    }

    return await create({
        ...data,
        purchaseReturnNumber,
        createdBy: userId,
    });
};

const updatePurchaseReturn = async (id, data) => {
    const BatchModel = getLocalBatchModel();
    const existing = await findById(id);
    if (!existing) {
        throw new Error("Purchase return not found");
    }

    if (existing.status !== "draft") {
        throw new Error("Only draft purchase returns can be updated");
    }

    // Validate batches and quantities if items are being updated
    if (data.items) {
        for (const item of data.items) {
            const batch = await BatchModel.findById(item.batch);
            if (!batch) {
                throw new Error(`Batch not found: ${item.batchNumber}`);
            }
            if (batch.quantity < item.quantity) {
                throw new Error(`Insufficient quantity in batch ${item.batchNumber}. Available: ${batch.quantity}, Required: ${item.quantity}`);
            }
        }
    }

    return await update(id, { ...data, updatedAt: new Date() });
};

const deletePurchaseReturn = async (id) => {
    const existing = await findById(id);
    if (!existing) {
        throw new Error("Purchase return not found");
    }

    if (existing.status !== "draft") {
        throw new Error("Only draft purchase returns can be deleted");
    }

    return await deleteOne(id);
};

const submitPurchaseReturn = async (id) => {
    const existing = await findById(id);
    if (!existing) {
        throw new Error("Purchase return not found");
    }

    if (existing.status !== "draft") {
        throw new Error("Only draft purchase returns can be submitted for approval");
    }

    return await update(id, { status: "pending" });
};

const approvePurchaseReturn = async (id, userId) => {
    const BatchModel = getLocalBatchModel();
    const existing = await findById(id);
    if (!existing) {
        throw new Error("Purchase return not found");
    }

    if (existing.status !== "pending") {
        throw new Error(`Only pending purchase returns can be approved. Current status: ${existing.status}`);
    }

    // Deduct inventory: batch stock first, then product stock
    for (const item of existing.items) {
        const batch = await BatchModel.findById(item.batch);
        if (batch) {
            // Deduct from batch stock first
            batch.quantity -= item.quantity;
            if (batch.quantity <= 0) {
                batch.isActive = false;
            }
            await batch.save();
        }

        // Then deduct from product stock
        await handleProductStockQuantity(item.product, "delete", item.quantity);
    }

    return await update(id, {
        status: "approved",
        approvedBy: userId,
        approvedAt: new Date(),
    });
};

const rejectPurchaseReturn = async (id, rejectionReason) => {
    const existing = await findById(id);
    if (!existing) {
        throw new Error("Purchase return not found");
    }

    if (existing.status !== "pending") {
        throw new Error(`Only pending purchase returns can be rejected. Current status: ${existing.status}`);
    }

    if (!rejectionReason) {
        throw new Error("Rejection reason is required");
    }

    return await update(id, { status: "rejected", rejectionReason });
};

const generatePurchaseReturnNumber = async () => {
    const startOfDay = new Date(new Date().setHours(0, 0, 0, 0));
    const endOfDay = new Date(new Date().setHours(23, 59, 59, 999));
    const dateRange = { createdAt: { $gte: startOfDay, $lt: endOfDay } };

    const countValue = await count(dateRange);
    const dateStr = startOfDay.toISOString().slice(0, 10).replace(/-/g, "");
    const purchaseReturnNumber = `PR-${dateStr}-${String(countValue + 1).padStart(4, "0")}`;

    return purchaseReturnNumber;
};

export {
    getPurchaseReturns,
    getPaginatedPurchaseReturns,
    getPurchaseReturnById,
    createPurchaseReturn,
    updatePurchaseReturn,
    deletePurchaseReturn,
    submitPurchaseReturn,
    approvePurchaseReturn,
    rejectPurchaseReturn,
    generatePurchaseReturnNumber,
};
