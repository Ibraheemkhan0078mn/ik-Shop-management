import { createPurchaseService, findPurchaseService, findOnePurchaseService, findByIdPurchaseService, updatePurchaseService, deleteOnePurchaseService, countPurchaseService } from "./purchase.crud.js";
import { findOneBatchService, createBatchService, updateBatchService } from "./batch.crud.js";
import { adjustStock, calculateStockDiff } from "../../../common/services/stockManager.js";
import { getTransactions } from "../../transactions/services/transaction.service.js";
import { updateTransaction } from "../../transactions/services/transaction.service.js";
import { generateBatchNumber } from "./batch.service.js";
import { updateDocs } from "../../../common/services/db/mongodbCentralizedCrud.service.js";
import { findOneSupplierService } from "../../suppliers/services/supplier.crud.js";
import mongoose from "mongoose";

const calculatePurchaseItemCosting = (item) => {
    const quantity = Number(item.quantity) || 0;
    const costPrice = Number(item.costPrice || item.price) || 0;
    const baseTotal = quantity * costPrice;
    const discount = Number(item.discount) || 0;
    const discountAmount = item.discountType === "fixed" ? Math.min(baseTotal, discount) : Math.min(baseTotal, (baseTotal * discount) / 100);
    const afterDiscount = Math.max(0, baseTotal - discountAmount);
    const tax = Number(item.tax) || 0;
    const taxAmount = item.taxType === "fixed" ? tax : (afterDiscount * tax) / 100;
    const totalCosting = afterDiscount + taxAmount;
    return { perUnitCosting: quantity > 0 ? totalCosting / quantity : 0, totalCosting };
};

const getBatchUsageForPurchase = async (batchId, purchaseId) => {
    const batch = await findOneBatchService({ _id: batchId });
    const purchases = await findPurchaseService({ "items.batch": batchId }, { select: "_id" });
    const purchaseIds = purchases.map(purchase => String(purchase._id));
    const currentPurchaseId = String(purchaseId);
    return {
        batchId: String(batchId),
        originPurchaseId: batch?.originPurchaseId ? String(batch.originPurchaseId) : null,
        purchaseIds,
        usageCount: purchaseIds.length,
        usedByOtherPurchase: purchaseIds.some(id => id !== currentPurchaseId),
        editable: purchaseIds.length === 1 && purchaseIds[0] === currentPurchaseId,
    };
};

const generatePurchaseNumber = async () => {
    const allPurchases = await findPurchaseService({ invoiceNumber: /^PI-\d+$/ }, {
        sort: { invoiceNumber: -1 },
        limit: 1
    });

    let nextNumber = 1;
    if (allPurchases && allPurchases.length > 0) {
        const lastPurchase = allPurchases[0];
        const match = lastPurchase.invoiceNumber.match(/^PI-(\d+)$/);
        if (match) {
            nextNumber = parseInt(match[1]) + 1;
        }
    }

    return `PI-${String(nextNumber).padStart(2, '0')}`;
};

const getPurchases = async () => {
    return await findPurchaseService({}, {
        populate: [
            { path: "supplier", select: "name" },
            { path: "items.product", select: "name productCode" },
            { path: "items.batch", select: "batchNumber" }
        ],
        sort: { createdAt: -1 }
    });
};

const getPurchaseById = async (id) => {
    const result = await findByIdPurchaseService(id, {
        populate: [
            { path: "supplier", select: "name qarzaAccountId" },
            { path: "items.product", select: "name productCode" },
            { path: "items.batch", select: "batchNumber" }
        ]
    });
    // Return the purchase data directly, unwrapping if result has data property
    return result?.data || result;
};

const getPurchaseByInvoiceNumber = async (invoiceNumber) => {
    return await findOnePurchaseService({ invoiceNumber });
};

const getPaginatedPurchases = async (filters = {}) => {
    const { page = 1, limit = 20, invoiceNumber, supplier, startDate, endDate } = filters;
    const query = {};
    
    // Add invoice number filter if provided (partial match)
    if (invoiceNumber) {
        query.invoiceNumber = { $regex: invoiceNumber, $options: "i" };
    }
    
    // Add supplier filter if provided
    if (supplier) {
        query.supplier = supplier;
    }
    
    // Add date range filter if provided
    if (startDate || endDate) {
        query.date = {};
        if (startDate) query.date.$gte = new Date(startDate);
        if (endDate) query.date.$lte = new Date(endDate);
    }
    
    const purchases = await findPurchaseService(query, {
        sort: { createdAt: -1 },
        skip: (page - 1) * limit,
        limit: parseInt(limit),
    });
    
    // Manually fetch supplier data using findOne
    const { findOneSupplierService } = await import("../../suppliers/services/supplier.crud.js");
    const { findOneProductService } = await import("../../product/services/product.crud.js");
    const { findOneBatchService } = await import("./batch.crud.js");
    
    for (const purchase of purchases) {
        if (purchase.supplier) {
            const supplier = await findOneSupplierService({ _id: purchase.supplier });
            if (supplier) {
                purchase.supplier = {
                    _id: supplier._id,
                    name: supplier.name
                };
            }
        }
        
        // Manually fetch product and batch data for items
        if (purchase.items && Array.isArray(purchase.items)) {
            for (const item of purchase.items) {
                if (item.product) {
                    const product = await findOneProductService({ _id: item.product });
                    if (product) {
                        item.product = {
                            _id: product._id,
                            name: product.name,
                            productCode: product.productCode
                        };
                    }
                }
                if (item.batch) {
                    const batch = await findOneBatchService({ _id: item.batch });
                    if (batch) {
                        item.batch = {
                            _id: batch._id,
                            batchNumber: batch.batchNumber
                        };
                    }
                }
            }
        }
    }
    
    const total = await countPurchaseService(query);
    return {
        data: purchases,
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit),
    };
};

const createPurchase = async (purchaseData, ProductModel) => {
    const purchaseItems = [];
    const purchaseId = new mongoose.Types.ObjectId();

    for (const item of purchaseData.items) {
        const costing = calculatePurchaseItemCosting(item);
        
        let batchNumber = item.batchNumber;
        
        // New batches must never reuse a number, including a soft-deleted number.
        if (item.isNewBatch) {
            let existingBatch = batchNumber
                ? await findOneBatchService({ batchNumber }, { includeDeleted: true })
                : true;
            while (existingBatch) {
                batchNumber = await generateBatchNumber();
                existingBatch = await findOneBatchService({ batchNumber }, { includeDeleted: true });
            }
        } else if (!batchNumber) {
            batchNumber = await generateBatchNumber();
        }

        let batch = await findOneBatchService({
            batchNumber: batchNumber,
            product: item.product,
        });

        if (!batch) {
            // Create new batch with quantity=0 — stock will be incremented when status changes to 'delivered'
            const batchData = {
                product: item.product,
                batchNumber: batchNumber,
                supplier: purchaseData.supplier,
                quantity: 0,
                purchasePrice: item.costPrice || item.price,
                originPurchaseId: purchaseId,
                perUnitCosting: costing.perUnitCosting,
                sellingPrice: item.price,
                mfgDate: item.mfgDate,
                expiryDate: item.expiryDate,
                gst: Number(item.tax) || 0,
                gstType: item.taxType || "percentage",
                gstInputType: item.taxInputType || item.taxType || "percentage",
                gstInputValue: Number(item.taxInputValue ?? item.tax) || 0,
                gstScope: item.taxScope || "entire",
            };
            
            // Add discount object with amount
            if (item.discount !== undefined && item.discount !== null) {
                batchData.discount = {
                    amount: Number(item.discount),
                    type: item.discountType || "percentage",
                    inputType: item.discountInputType || item.discountType || "percentage",
                    inputValue: Number(item.discountInputValue ?? item.discount) || 0,
                    scope: item.discountScope || "entire"
                };
            } else {
                batchData.discount = {
                    amount: 0,
                    type: item.discountType || "percentage",
                    inputType: item.discountInputType || item.discountType || "percentage",
                    inputValue: Number(item.discountInputValue ?? item.discount) || 0,
                    scope: item.discountScope || "entire"
                };
            }
            
            batch = await createBatchService(batchData);

            await updateDocs({
                model: ProductModel,
                filter: { _id: item.product },
                data: { $push: { batches: batch._id } }
            });
        } else {
            // Only update batch metadata — do NOT modify quantity here.
            // Batch quantity is managed solely through updatePurchaseStatus (ordered → delivered).
            const updateData = {
                purchasePrice: item.costPrice || item.price,
                perUnitCosting: costing.perUnitCosting,
                mfgDate: item.mfgDate,
                expiryDate: item.expiryDate,
                supplier: purchaseData.supplier,
                gst: Number(item.tax) || 0,
                gstType: item.taxType || "percentage",
                gstInputType: item.taxInputType || item.taxType || "percentage",
                gstInputValue: Number(item.taxInputValue ?? item.tax) || 0,
                gstScope: item.taxScope || "entire",
            };
            
            // Add discount object with amount
            if (item.discount !== undefined && item.discount !== null) {
                updateData.discount = {
                    amount: Number(item.discount),
                    type: item.discountType || "percentage"
                };
            } else {
                updateData.discount = {
                    amount: 0,
                    type: item.discountType || "percentage"
                };
            }
            
            await updateBatchService(batch._id, updateData);
        }

        purchaseItems.push({
            product: item.product,
            batch: batch._id,
            quantity: item.quantity,
            price: item.price,
            costPrice: item.costPrice || 0,
            perUnitCosting: costing.perUnitCosting,
            totalCosting: costing.totalCosting,
            discount: Number(item.discount) || 0,
            discountType: item.discountType || "percentage",
            discountInputType: item.discountInputType || item.discountType || "percentage",
            discountInputValue: Number(item.discountInputValue ?? item.discount) || 0,
            discountScope: item.discountScope || "entire",
            tax: Number(item.tax) || 0,
            taxType: item.taxType || "percentage",
            taxInputType: item.taxInputType || item.taxType || "percentage",
            taxInputValue: Number(item.taxInputValue ?? item.tax) || 0,
            taxScope: item.taxScope || "entire",
            mfgDate: item.mfgDate,
            expiryDate: item.expiryDate,
        });
    }

    const purchase = await createPurchaseService({
        _id: purchaseId,
        supplier: purchaseData.supplier,
        date: purchaseData.date,
        invoiceNumber: purchaseData.invoiceNumber,
        items: purchaseItems,
        subtotal: purchaseData.subtotal,
        discount: purchaseData.discount,
        discountType: purchaseData.discountType,
        gst: purchaseData.gst,
        gstType: purchaseData.gstType,
        shippingCost: purchaseData.shippingCost,
        totalAmount: purchaseData.totalAmount,
        notes: purchaseData.notes,
        status: 'ordered',
        paymentStatus: 'pending',
        paidAmount: 0,
    });

    // Don't increment stock for pre-orders - stock (both product AND batch) is incremented when status changes to 'delivered'

    return purchase;
};

const updatePurchase = async (id, data, ProductModel) => {
    const existing = await findByIdPurchaseService(id);
    if (!existing) {
        throw new Error("Purchase not found");
    }

    const purchaseItems = [];

    // First pass: create/update batches (without adjusting stock yet)
    for (const item of data.items) {
        const costing = calculatePurchaseItemCosting(item);
        let batchNumber = item.batchNumber;
        
        // If batchNumber is not provided, generate a unique one via API
        if (!batchNumber) {
            let isUnique = false;
            let attempts = 0;
            const maxAttempts = 10;
            
            while (!isUnique && attempts < maxAttempts) {
                batchNumber = await generateBatchNumber();
                const existingBatch = await findOneBatchService({
                    batchNumber: batchNumber,
                    product: item.product,
                });
                if (!existingBatch) {
                    isUnique = true;
                }
                attempts++;
            }
            
            if (!isUnique) {
                throw new Error("Failed to generate unique batch number after multiple attempts");
            }
        }

        // Always look up batch by batchNumber to ensure consistency with stock adjustments
        let batch = await findOneBatchService({ batchNumber: batchNumber, product: item.product });
        if (batch && item.batchMetadataEdited) {
            const usage = await getBatchUsageForPurchase(batch._id, id);
            if (!usage.editable) throw new Error(`Batch ${batch.batchNumber} is locked because it belongs to another purchase or is reused`);
        }
        
        if (!batch) {
            // Create new batch with quantity=0 - adjustStock will handle the increment
            const batchData = {
                product: item.product, 
                batchNumber: batchNumber,
                supplier: data.supplier, 
                quantity: 0,  // Start at 0, adjustStock will increment
                purchasePrice: item.costPrice || item.price, 
                originPurchaseId: id,
                perUnitCosting: costing.perUnitCosting,
                sellingPrice: item.price,
                mfgDate: item.mfgDate, 
                expiryDate: item.expiryDate,
                gst: Number(item.tax) || 0,
                gstType: item.taxType || "percentage",
                gstInputType: item.taxInputType || item.taxType || "percentage",
                gstInputValue: Number(item.taxInputValue ?? item.tax) || 0,
                gstScope: item.taxScope || "entire",
            };
            
            // Add discount object with amount
            if (item.discount !== undefined && item.discount !== null) {
                batchData.discount = {
                    amount: Number(item.discount),
                    type: item.discountType || "percentage",
                    inputType: item.discountInputType || item.discountType || "percentage",
                    inputValue: Number(item.discountInputValue ?? item.discount) || 0,
                    scope: item.discountScope || "entire"
                };
            } else {
                batchData.discount = {
                    amount: 0,
                    type: item.discountType || "percentage",
                    inputType: item.discountInputType || item.discountType || "percentage",
                    inputValue: Number(item.discountInputValue ?? item.discount) || 0,
                    scope: item.discountScope || "entire"
                };
            }
            
            batch = await createBatchService(batchData);
            
            await updateDocs({
                model: ProductModel,
                filter: { _id: item.product },
                data: { $push: { batches: batch._id } }
            });
        } else if (item.batchMetadataEdited) {
            // Update existing batch (quantity is NOT updated here - adjustStock already handles it)
            const updateData = {
                purchasePrice: item.costPrice || item.price,
                perUnitCosting: costing.perUnitCosting,
                mfgDate: item.mfgDate,
                expiryDate: item.expiryDate,
                supplier: data.supplier,
                gst: Number(item.tax) || 0,
                gstType: item.taxType || "percentage",
                gstInputType: item.taxInputType || item.taxType || "percentage",
                gstInputValue: Number(item.taxInputValue ?? item.tax) || 0,
                gstScope: item.taxScope || "entire",
            };
            
            // Add discount object with amount
            if (item.discount !== undefined && item.discount !== null) {
                updateData.discount = {
                    amount: Number(item.discount),
                    type: item.discountType || "percentage",
                    inputType: item.discountInputType || item.discountType || "percentage",
                    inputValue: Number(item.discountInputValue ?? item.discount) || 0,
                    scope: item.discountScope || "entire"
                };
            } else {
                updateData.discount = {
                    amount: 0,
                    type: item.discountType || "percentage",
                    inputType: item.discountInputType || item.discountType || "percentage",
                    inputValue: Number(item.discountInputValue ?? item.discount) || 0,
                    scope: item.discountScope || "entire"
                };
            }
            
            await updateBatchService(batch._id, updateData);
        }

        purchaseItems.push({
            product: item.product, 
            batch: batch._id,
            quantity: item.quantity, 
            price: item.price,
            costPrice: item.costPrice || 0,
            perUnitCosting: costing.perUnitCosting,
            totalCosting: costing.totalCosting,
            discount: Number(item.discount) || 0,
            discountType: item.discountType || "percentage",
            discountInputType: item.discountInputType || item.discountType || "percentage",
            discountInputValue: Number(item.discountInputValue ?? item.discount) || 0,
            discountScope: item.discountScope || "entire",
            tax: Number(item.tax) || 0,
            taxType: item.taxType || "percentage",
            taxInputType: item.taxInputType || item.taxType || "percentage",
            taxInputValue: Number(item.taxInputValue ?? item.tax) || 0,
            taxScope: item.taxScope || "entire",
            mfgDate: item.mfgDate, 
            expiryDate: item.expiryDate,
        });
    }

    // Only adjust stock if purchase was delivered
    if (existing.status === 'delivered') {
        // Map incoming items to their batch IDs for proper stock diff calculation
        const newItemsWithBatchIds = purchaseItems.map(item => ({
            product: item.product,
            batch: item.batch,
            quantity: item.quantity
        }));

        // Calculate stock differences
        const stockAdjustments = calculateStockDiff(existing.items, newItemsWithBatchIds);

        // Apply stock adjustments
        for (const adj of stockAdjustments) {
            if (adj.productId && adj.batchId && adj.quantity > 0) {
                await adjustStock(adj.productId, adj.batchId, adj.operation, adj.quantity);
            }
        }
    }

    const purchase = await updatePurchaseService(id, {
        supplier: data.supplier, 
        date: data.date,
        invoiceNumber: data.invoiceNumber, 
        items: purchaseItems,
        subtotal: data.subtotal, 
        discount: data.discount,
        discountType: data.discountType, 
        gst: data.gst,
        gstType: data.gstType, 
        shippingCost: data.shippingCost, 
        totalAmount: data.totalAmount,
        notes: data.notes,
    });

    // A delivered purchase creates one automatic supplier-credit transaction.
    // Keep that transaction synchronized when the purchase total or supplier changes.
    if (existing.status === 'delivered') {
        const previousSupplierId = existing.supplier?._id || existing.supplier;
        const previousSupplier = previousSupplierId
            ? await findOneSupplierService({ _id: previousSupplierId })
            : null;
        const currentSupplier = data.supplier
            ? await findOneSupplierService({ _id: data.supplier })
            : null;
        const currentCreditAccount = currentSupplier?.qarzaAccountId;
        const purchaseTransactions = await getTransactions({ sourceType: 'purchase', sourceId: id });
        const automaticCredit = purchaseTransactions.find((transaction) => (
            transaction.method === 'credit' &&
            typeof transaction.notes === 'string' &&
            transaction.notes.startsWith('Auto-created credit transaction on delivery for purchase')
        ));

        if (automaticCredit && currentCreditAccount) {
            await updateTransaction(automaticCredit._id, {
                amount: Number(purchase.totalAmount) || 0,
                creditAmount: Number(purchase.totalAmount) || 0,
                cashAmount: 0,
                creditAccount: currentCreditAccount,
                creditType: 'cashin',
                notes: `Auto-created credit transaction on delivery for purchase ${purchase.invoiceNumber}`,
            });
        } else if (!automaticCredit && currentCreditAccount) {
            const { createPurchaseTransaction } = await import("../../transactions/services/transaction.service.js");
            await createPurchaseTransaction({
                purchase: id,
                paymentMethod: 'credit',
                amount: Number(purchase.totalAmount) || 0,
                cashAmount: 0,
                creditAmount: Number(purchase.totalAmount) || 0,
                creditAccount: currentCreditAccount,
                paymentDate: new Date(),
                notes: `Auto-created credit transaction on delivery for purchase ${purchase.invoiceNumber}`,
            });
        }

        await recalculatePurchasePaidAmount(id);

        const accountIds = new Set([
            previousSupplier?.qarzaAccountId?.toString(),
            currentCreditAccount?.toString(),
        ].filter(Boolean));
        if (accountIds.size > 0) {
            const { recalculateSupplierBalance } = await import("../../qarza/services/recalculateSupplierBalance.service.js");
            for (const accountId of accountIds) {
                await recalculateSupplierBalance(accountId);
            }
        }
    }

    return purchase;
};

const deletePurchase = async (id) => {
    const existing = await findByIdPurchaseService(id);
    if (!existing) {
        throw new Error("Purchase not found");
    }

    // Only decrement stock if purchase was delivered
    if (existing.status === 'delivered') {
        // Decrement stock for all items before deletion
        for (const item of existing.items) {
            await adjustStock(item.product, item.batch, 'decr', item.quantity);
        }
    }

    // Delete all related transactions
    const transactions = await getTransactions({ sourceType: 'purchase', sourceId: id });
    for (const transaction of transactions) {
        const { deleteTransaction } = await import("../../transactions/services/transaction.service.js");
        await deleteTransaction(transaction._id);
    }

    return await deleteOnePurchaseService(id);
};

/**
 * Calculate payment status for a purchase based on transactions
 * Returns object with totalPaid, remainingAmount, paymentStatus, and transaction details
 */
const calculatePurchasePaymentStatus = async (purchaseId, totalAmount) => {
    const transactions = await getTransactions({ sourceType: 'purchase', sourceId: purchaseId });
    
    const totalPaid = transactions.reduce((sum, t) => sum + (t.amount || 0), 0) || 0;
    const remainingAmount = totalAmount - totalPaid;
    
    let paymentStatus = 'pending';
    if (remainingAmount <= 0) {
        paymentStatus = 'full';
    } else if (totalPaid > 0) {
        paymentStatus = 'partial';
    }
    
    // Calculate cash and credit breakdowns
    const totalCash = transactions.reduce((sum, t) => sum + (t.cashAmount || 0), 0) || 0;
    const totalCredit = transactions.reduce((sum, t) => sum + (t.creditAmount || 0), 0) || 0;
    
    return {
        totalPaid,
        remainingAmount,
        paymentStatus,
        totalCash,
        totalCredit,
        transactionCount: transactions.length,
        transactions
    };
};

/**
 * Recalculate and update purchase paidAmount from all related transactions
 * This function syncs the purchase document's paidAmount with the actual transaction totals
 */
const recalculatePurchasePaidAmount = async (purchaseId) => {
    const purchase = await getPurchaseById(purchaseId);
    if (!purchase) {
        throw new Error("Purchase not found");
    }

    // Handle both direct purchase object and wrapped response
    const totalAmount = purchase?.totalAmount || purchase?.data?.totalAmount;
    if (!totalAmount && totalAmount !== 0) {
        throw new Error("Purchase total amount not found");
    }

    const paymentStatus = await calculatePurchasePaymentStatus(purchaseId, totalAmount);

    // Update purchase with recalculated values using direct service to avoid items iteration
    await updatePurchaseService(purchaseId, {
        paidAmount: paymentStatus.totalPaid,
        paymentStatus: paymentStatus.paymentStatus
    });

    return paymentStatus;
};

export { getPurchases, getPurchaseById, getPurchaseByInvoiceNumber, getPaginatedPurchases, createPurchase, updatePurchase, deletePurchase, generatePurchaseNumber, calculatePurchasePaymentStatus, recalculatePurchasePaidAmount, getBatchUsageForPurchase };
