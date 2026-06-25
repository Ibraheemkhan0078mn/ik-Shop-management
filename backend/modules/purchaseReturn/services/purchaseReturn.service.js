import { createPurchaseReturnService, findPurchaseReturnService, findOnePurchaseReturnService, findByIdPurchaseReturnService, updatePurchaseReturnService, deleteOnePurchaseReturnService, countPurchaseReturnService } from "./purchaseReturn.crud.js";
import { getLocalPurchaseModel, getLocalBatchModel, getLocalPurchaseReturnModel } from "../../../configs/connect.db.js";
import { adjustStock, calculateStockDiff } from "../../../common/services/stockManager.js";

const normalizePurchaseReturnItems = async (items = [], BatchModel) => {
    if (!Array.isArray(items)) return [];

    const normalizedItems = [];

    for (const item of items) {
        const batch = item.batch ? await BatchModel.findById(item.batch) : null;
        normalizedItems.push({
            ...item,
            batchNumber: item.batchNumber?.trim() || batch?.batchNumber || "",
        });
    }

    return normalizedItems;
};

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

    return await findPurchaseReturnService(query)
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

    const purchaseReturns = await findPurchaseReturnService(query)
        .populate("purchase", "invoiceNumber")
        .populate("supplier", "name")
        .populate("items.product", "name")
        .populate("items.batch", "batchNumber")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(parseInt(limit));

    const total = await countPurchaseReturnService(query);

    return {
        data: purchaseReturns,
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit),
    };
};

const getPurchaseReturnById = async (id) => {
    return await findByIdPurchaseReturnService(id)
        .populate("purchase")
        .populate("supplier")
        .populate("items.product")
        .populate("items.batch");
};

const createPurchaseReturn = async (data, userId) => {
    const PurchaseModel = getLocalPurchaseModel();
    const BatchModel = getLocalBatchModel();
    const PurchaseReturnModel = getLocalPurchaseReturnModel();

    // Generate purchase return number
    const startOfDay = new Date(new Date().setHours(0, 0, 0, 0));
    const endOfDay = new Date(new Date().setHours(23, 59, 59, 999));
    const dateRange = { createdAt: { $gte: startOfDay, $lt: endOfDay } };

    const countValue = await countPurchaseReturnService(dateRange);
    const dateStr = startOfDay.toISOString().slice(0, 10).replace(/-/g, "");
    const purchaseReturnNumber = `PR-${dateStr}-${String(countValue + 1).padStart(4, "0")}`;

    // Validate that purchase exists
    const purchase = await PurchaseModel.findById(data.purchase);
    if (!purchase) {
        throw new Error("Purchase not found");
    }

    const normalizedItems = await normalizePurchaseReturnItems(data.items, BatchModel);

    // Validate batches and quantities
    for (const item of normalizedItems) {
        const batch = await BatchModel.findById(item.batch);
        if (!batch) {
            throw new Error(`Batch not found: ${item.batchNumber}`);
        }
        if (batch.quantity < item.quantity) {
            throw new Error(`Insufficient quantity in batch ${item.batchNumber}. Available: ${batch.quantity}, Required: ${item.quantity}`);
        }
    }

    return await createPurchaseReturnService({
        ...data,
        items: normalizedItems,
        purchaseReturnNumber,
        createdBy: userId,
    });
};

const updatePurchaseReturn = async (id, data) => {
    const BatchModel = getLocalBatchModel();
    const existing = await findByIdPurchaseReturnService(id);
    if (!existing) {
        throw new Error("Purchase return not found");
    }

    if (existing.status !== "draft") {
        throw new Error("Only draft purchase returns can be updated");
    }

    let normalizedItems = data.items;

    // Validate batches and quantities if items are being updated
    if (data.items) {
        normalizedItems = await normalizePurchaseReturnItems(data.items, BatchModel);
        for (const item of normalizedItems) {
            const batch = await BatchModel.findById(item.batch);
            if (!batch) {
                throw new Error(`Batch not found: ${item.batchNumber}`);
            }
            if (batch.quantity < item.quantity) {
                throw new Error(`Insufficient quantity in batch ${item.batchNumber}. Available: ${batch.quantity}, Required: ${item.quantity}`);
            }
        }
    }

    return await updatePurchaseReturnService(id, { ...data, items: normalizedItems, updatedAt: new Date() });
};

const deletePurchaseReturn = async (id) => {
    const existing = await findByIdPurchaseReturnService(id);
    if (!existing) {
        throw new Error("Purchase return not found");
    }

    if (existing.status !== "draft") {
        throw new Error("Only draft purchase returns can be deleted");
    }

    // If approved, restore stock before deletion
    if (existing.status === "approved") {
        for (const item of existing.items) {
            await adjustStock(item.product, item.batch, 'inc', item.quantity);
        }
    }

    return await deleteOnePurchaseReturnService(id);
};

const submitPurchaseReturn = async (id) => {
    const existing = await findByIdPurchaseReturnService(id);
    if (!existing) {
        throw new Error("Purchase return not found");
    }

    if (existing.status !== "draft") {
        throw new Error("Only draft purchase returns can be submitted for approval");
    }

    return await updatePurchaseReturnService(id, { status: "pending" });
};

const approvePurchaseReturn = async (id, userId) => {
    const existing = await findByIdPurchaseReturnService(id);
    if (!existing) {
        throw new Error("Purchase return not found");
    }

    if (existing.status !== "pending") {
        throw new Error(`Only pending purchase returns can be approved. Current status: ${existing.status}`);
    }

    // Deduct stock for all items
    for (const item of existing.items) {
        await adjustStock(item.product, item.batch, 'decr', item.quantity);
    }

    return await updatePurchaseReturnService(id, {
        status: "approved",
        approvedBy: userId,
        approvedAt: new Date(),
    });
};

const rejectPurchaseReturn = async (id, rejectionReason) => {
    const existing = await findByIdPurchaseReturnService(id);
    if (!existing) {
        throw new Error("Purchase return not found");
    }

    if (existing.status !== "pending") {
        throw new Error(`Only pending purchase returns can be rejected. Current status: ${existing.status}`);
    }

    if (!rejectionReason) {
        throw new Error("Rejection reason is required");
    }

    return await updatePurchaseReturnService(id, { status: "rejected", rejectionReason });
};

const generatePurchaseReturnNumber = async () => {
    const startOfDay = new Date(new Date().setHours(0, 0, 0, 0));
    const endOfDay = new Date(new Date().setHours(23, 59, 59, 999));
    const dateRange = { createdAt: { $gte: startOfDay, $lt: endOfDay } };

    const countValue = await countPurchaseReturnService(dateRange);
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
