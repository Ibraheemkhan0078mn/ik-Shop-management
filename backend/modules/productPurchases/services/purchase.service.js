import mongoose from "mongoose";
import { createPurchaseService, findPurchaseService, findOnePurchaseService, findByIdPurchaseService, updatePurchaseService, deleteOnePurchaseService, countPurchaseService } from "./purchase.crud.js";
import { createBatchService, findOneBatchService, findByIdBatchService, updateBatchService } from "./batch.crud.js";
import { adjustStock, calculateStockDiff } from "../../../common/services/stockManager.js";
import { getTransactions, updateTransaction, deleteTransaction, createPurchaseTransaction } from "../../transactions/services/transaction.service.js";
import { generateBatchNumber } from "./batch.service.js";
import { updateDocs } from "../../../common/services/db/mongodbCentralizedCrud.service.js";
import { findOneSupplierService } from "../../suppliers/services/supplier.crud.js";

const number = (value) => Number(value) || 0;

const calculateItemCosting = (item) => {
    const quantity = number(item.quantity);
    const costPrice = number(item.costPrice ?? item.price);
    const discount = number(item.discountInputValue ?? item.discount);
    const discountType = item.discountEntryType ?? item.discountInputType ?? item.discountType ?? "percentage";
    const discountScope = item.discountScope ?? "entire";
    const discountAmount = discountType === "fixed"
        ? Math.min(quantity * costPrice, discount * (discountScope === "perUnit" ? quantity : 1))
        : Math.min(quantity * costPrice, quantity * costPrice * discount / 100);
    const afterDiscount = Math.max(0, quantity * costPrice - discountAmount);
    const tax = number(item.taxEntryValue ?? item.taxInputValue ?? item.tax);
    const taxType = item.taxEntryType ?? item.taxInputType ?? item.taxType ?? "percentage";
    const taxAmount = taxType === "fixed" ? tax * (item.taxScope === "perUnit" ? quantity : 1) : afterDiscount * tax / 100;
    const totalCosting = afterDiscount + taxAmount;
    return { perUnitCosting: quantity ? totalCosting / quantity : 0 };
};

const getBatchData = (item, purchaseId, supplier) => {
    const costing = calculateItemCosting(item);
    const discountEntryType = item.discountEntryType ?? item.discountInputType ?? item.discountType ?? "percentage";
    const discountEntryValue = number(item.discountEntryValue ?? item.discountInputValue ?? item.discount);
    const taxEntryType = item.taxEntryType ?? item.taxInputType ?? item.taxType ?? "percentage";
    const taxEntryValue = number(item.taxEntryValue ?? item.taxInputValue ?? item.tax);
    return {
        product: item.product,
        batchNumber: item.batchNumber,
        quantity: 0,
        costPrice: number(item.costPrice ?? item.price),
        originPurchaseId: purchaseId,
        perUnitCosting: costing.perUnitCosting,
        defaultSellingPrice: number(item.defaultSellingPrice ?? item.price),
        mfgDate: item.mfgDate,
        expiryDate: item.expiryDate,
        discountInPercentage: discountEntryType === "percentage" ? discountEntryValue : 0,
        discountEntryType,
        discountEntryValue,
        discountScope: item.discountScope ?? "entire",
        taxInPercentage: taxEntryType === "percentage" ? taxEntryValue : 0,
        taxEntryType,
        taxEntryValue,
        taxScope: item.taxScope ?? "entire",
    };
};

const ensureBatchNumber = async (requested, isNewBatch = false) => {
    let batchNumber = requested;
    if (!batchNumber || isNewBatch) {
        do { batchNumber = await generateBatchNumber(); }
        while (await findOneBatchService({ batchNumber }, { includeDeleted: true }));
    }
    return batchNumber;
};

const upsertBatch = async (item, purchaseId, supplier, ProductModel) => {
    const batchNumber = await ensureBatchNumber(item.batchNumber, item.isNewBatch);
    let batch = item.batch ? await findByIdBatchService(item.batch) : null;

    if (!batch && item.batchNumber) {
        batch = await findOneBatchService({ batchNumber, product: item.product });
    }

    const batchData = getBatchData({ ...item, batchNumber }, purchaseId, supplier);

    if (!batch) {
        batch = await createBatchService(batchData);
        await updateDocs({ model: ProductModel, filter: { _id: item.product }, data: { $push: { batches: batch._id } } });
    } else if (item.batchMetadataEdited || item.isNewBatch || item.batchNumber) {
        const shouldUpdateThisBatch = !batch.originPurchaseId || String(batch.originPurchaseId) === String(purchaseId) || String(item.batch) === String(batch._id);
        if (shouldUpdateThisBatch) {
            await updateBatchService(batch._id, batchData);
            batch = await findByIdBatchService(batch._id);
        }
    }
    return batch;
};

const purchaseItemsFromRequest = async (items, purchaseId, supplier, ProductModel) => {
    const purchaseItems = [];
    for (const item of items || []) {
        const batch = await upsertBatch(item, purchaseId, supplier, ProductModel);
        purchaseItems.push({ product: item.product, batch: batch._id, quantity: number(item.quantity) });
    }
    return purchaseItems;
};

const populateOptions = {
    populate: [
        { path: "supplier", select: "name qarzaAccountId" },
        { path: "items.product", select: "name productCode category" },
        { path: "items.batch", select: "batchNumber costPrice defaultSellingPrice perUnitCosting mfgDate expiryDate discountInPercentage discountEntryType discountEntryValue discountScope taxInPercentage taxEntryType taxEntryValue taxScope quantity" },
    ],
};

const generatePurchaseNumber = async () => {
    const latest = await findPurchaseService({ invoiceNumber: /^PI-\d+$/ }, { sort: { invoiceNumber: -1 }, limit: 1 });
    const lastNumber = latest?.[0]?.invoiceNumber?.match(/^PI-(\d+)$/)?.[1];
    return `PI-${String((Number(lastNumber) || 0) + 1).padStart(2, "0")}`;
};

const getPurchases = () => findPurchaseService({}, { ...populateOptions, sort: { createdAt: -1 } });
const getPurchaseById = async (id) => {
    const result = await findByIdPurchaseService(id, populateOptions);
    return result?.data || result;
};
const getPurchaseByInvoiceNumber = (invoiceNumber) => findOnePurchaseService({ invoiceNumber }, populateOptions);

const getPaginatedPurchases = async ({ page = 1, limit = 20, invoiceNumber, supplier, startDate, endDate } = {}) => {
    const query = {};
    if (invoiceNumber) query.invoiceNumber = { $regex: invoiceNumber, $options: "i" };
    if (supplier) query.supplier = supplier;
    if (startDate || endDate) {
        query.date = {};
        if (startDate) query.date.$gte = new Date(startDate);
        if (endDate) query.date.$lte = new Date(endDate);
    }
    const parsedPage = Number(page) || 1;
    const parsedLimit = Number(limit) || 20;
    const [data, total] = await Promise.all([
        findPurchaseService(query, { ...populateOptions, sort: { createdAt: -1 }, skip: (parsedPage - 1) * parsedLimit, limit: parsedLimit }),
        countPurchaseService(query),
    ]);
    return { data, total, page: parsedPage, limit: parsedLimit, totalPages: Math.ceil(total / parsedLimit) };
};

const purchaseDocumentData = (data, items, status = "ordered") => ({
    supplier: data.supplier, date: data.date, invoiceNumber: data.invoiceNumber, items,
    subtotal: number(data.subtotal), totalAmount: number(data.totalAmount), notes: data.notes, status,
});

const createPurchase = async (data, ProductModel) => {
    const purchaseId = new mongoose.Types.ObjectId();
    const items = await purchaseItemsFromRequest(data.items, purchaseId, data.supplier, ProductModel);
    return createPurchaseService({ _id: purchaseId, ...purchaseDocumentData(data, items) });
};

const updatePurchase = async (id, data, ProductModel) => {
    const existing = await findByIdPurchaseService(id);
    if (!existing) throw new Error("Purchase not found");
    const items = await purchaseItemsFromRequest(data.items, id, data.supplier, ProductModel);
    if (existing.status === "delivered") {
        for (const adjustment of calculateStockDiff(existing.items, items)) {
            if (adjustment.productId && adjustment.batchId && adjustment.quantity > 0) await adjustStock(adjustment.productId, adjustment.batchId, adjustment.operation, adjustment.quantity);
        }
    }
    const purchase = await updatePurchaseService(id, purchaseDocumentData(data, items, existing.status));
    if (existing.status === "delivered") await syncDeliveryTransaction(purchase, existing.supplier, data.supplier);
    return purchase;
};

const syncDeliveryTransaction = async (purchase, previousSupplierId, currentSupplierId) => {
    const previousSupplier = await findOneSupplierService({ _id: previousSupplierId?._id || previousSupplierId });
    const currentSupplier = await findOneSupplierService({ _id: currentSupplierId });
    const transactions = await getTransactions({ sourceType: "purchase", sourceId: purchase._id });
    const automaticCredit = transactions.find((transaction) => transaction.method === "credit" && transaction.notes?.startsWith("Auto-created credit transaction on delivery for purchase"));
    if (automaticCredit && currentSupplier?.qarzaAccountId) {
        await updateTransaction(automaticCredit._id, { amount: purchase.totalAmount, creditAmount: purchase.totalAmount, cashAmount: 0, creditAccount: currentSupplier.qarzaAccountId, creditType: "cashin", notes: `Auto-created credit transaction on delivery for purchase ${purchase.invoiceNumber}` });
    } else if (!automaticCredit && currentSupplier?.qarzaAccountId) {
        await createPurchaseTransaction({ purchase: purchase._id, paymentMethod: "credit", amount: purchase.totalAmount, creditAmount: purchase.totalAmount, creditAccount: currentSupplier.qarzaAccountId, paymentDate: new Date(), notes: `Auto-created credit transaction on delivery for purchase ${purchase.invoiceNumber}` });
    }
    const accountIds = new Set([previousSupplier?.qarzaAccountId?.toString(), currentSupplier?.qarzaAccountId?.toString()].filter(Boolean));
    if (accountIds.size) {
        const { recalculateSupplierBalance } = await import("../../qarza/services/recalculateSupplierBalance.service.js");
        for (const accountId of accountIds) await recalculateSupplierBalance(accountId);
    }
};

const deletePurchase = async (id) => {
    const purchase = await findByIdPurchaseService(id);
    if (!purchase) throw new Error("Purchase not found");
    if (purchase.status === "delivered") for (const item of purchase.items) await adjustStock(item.product, item.batch, "decr", item.quantity);
    for (const transaction of await getTransactions({ sourceType: "purchase", sourceId: id })) await deleteTransaction(transaction._id);
    return deleteOnePurchaseService(id);
};

const calculatePurchasePaymentStatus = async (purchaseId, totalAmount) => {
    const transactions = await getTransactions({ sourceType: "purchase", sourceId: purchaseId });
    const totalPaid = transactions.reduce((sum, transaction) => sum + number(transaction.amount), 0);
    const remainingAmount = number(totalAmount) - totalPaid;
    return {
        totalPaid, remainingAmount,
        paymentStatus: remainingAmount <= 0 ? "full" : totalPaid > 0 ? "partial" : "pending",
        totalCash: transactions.reduce((sum, transaction) => sum + number(transaction.cashAmount), 0),
        totalCredit: transactions.reduce((sum, transaction) => sum + number(transaction.creditAmount), 0),
        transactionCount: transactions.length, transactions,
    };
};

const recalculatePurchasePaidAmount = (purchaseId) => calculatePurchasePaymentStatusForPurchase(purchaseId);
const calculatePurchasePaymentStatusForPurchase = async (purchaseId) => {
    const purchase = await getPurchaseById(purchaseId);
    if (!purchase) throw new Error("Purchase not found");
    return calculatePurchasePaymentStatus(purchaseId, purchase.totalAmount);
};

const getBatchUsageForPurchase = async (batchId, purchaseId) => {
    const batch = await findOneBatchService({ _id: batchId });
    const purchases = await findPurchaseService({ "items.batch": batchId }, { select: "_id" });
    const purchaseIds = purchases.map((purchase) => String(purchase._id));
    const currentPurchaseId = String(purchaseId);
    return { batchId: String(batchId), originPurchaseId: batch?.originPurchaseId ? String(batch.originPurchaseId) : null, purchaseIds, usageCount: purchaseIds.length, usedByOtherPurchase: purchaseIds.some((id) => id !== currentPurchaseId), editable: purchaseIds.length === 1 && purchaseIds[0] === currentPurchaseId };
};

export { getPurchases, getPurchaseById, getPurchaseByInvoiceNumber, getPaginatedPurchases, createPurchase, updatePurchase, deletePurchase, generatePurchaseNumber, calculatePurchasePaymentStatus, recalculatePurchasePaidAmount, getBatchUsageForPurchase };
