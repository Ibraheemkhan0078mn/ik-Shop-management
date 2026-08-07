import { createPurchaseService, findPurchaseService, findOnePurchaseService, findByIdPurchaseService, updatePurchaseService, deleteOnePurchaseService, countPurchaseService } from "./purchase.crud.js";
import { findOneBatchService, createBatchService, updateBatchService } from "./batch.crud.js";
import { adjustStock, calculateStockDiff } from "../../../common/services/stockManager.js";

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
    return await findByIdPurchaseService(id, {
        populate: [
            { path: "supplier", select: "name" },
            { path: "items.product", select: "name productCode" },
            { path: "items.batch", select: "batchNumber" }
        ]
    });
};

const getPurchaseByInvoiceNumber = async (invoiceNumber) => {
    return await findOnePurchaseService({ invoiceNumber });
};

const getPaginatedPurchases = async (filters = {}) => {
    const { page = 1, limit = 20 } = filters;
    const query = {};
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

const createPurchase = async (purchaseData, BatchModel, ProductModel) => {
    const purchaseItems = [];

    for (const item of purchaseData.items) {
        let batch = await findOneBatchService({
            batchNumber: item.batchNumber,
            product: item.product,
        });

        if (!batch) {
            // Create new batch with quantity=0 — stock will be incremented when status changes to 'delivered'
            batch = await createBatchService({
                product: item.product,
                batchNumber: item.batchNumber,
                supplier: purchaseData.supplier,
                quantity: 0,
                purchasePrice: item.costPrice || item.price,
                sellingPrice: item.price,
                mfgDate: item.mfgDate,
                expiryDate: item.expiryDate,
            });

            await ProductModel.findByIdAndUpdate(item.product, {
                $push: { batches: batch._id },
            });
        } else {
            // Only update batch metadata — do NOT modify quantity here.
            // Batch quantity is managed solely through updatePurchaseStatus (ordered → delivered).
            await updateBatchService(batch._id, {
                purchasePrice: item.price,
                mfgDate: item.mfgDate,
                expiryDate: item.expiryDate,
                supplier: purchaseData.supplier,
            });
        }

        purchaseItems.push({
            product: item.product,
            batch: batch._id,
            quantity: item.quantity,
            price: item.price,
            costPrice: item.costPrice || 0,
            discount: item.discount,
            discountType: item.discountType,
            tax: item.tax,
            taxType: item.taxType,
            mfgDate: item.mfgDate,
            expiryDate: item.expiryDate,
        });
    }

    const purchase = await createPurchaseService({
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

const updatePurchase = async (id, data, BatchModel, ProductModel) => {
    const existing = await findByIdPurchaseService(id);
    if (!existing) {
        throw new Error("Purchase not found");
    }

    const purchaseItems = [];

    // First pass: create/update batches (without adjusting stock yet)
    for (const item of data.items) {
        // Always look up batch by batchNumber to ensure consistency with stock adjustments
        let batch = await findOneBatchService({ batchNumber: item.batchNumber, product: item.product });
        
        if (!batch) {
            // Create new batch with quantity=0 - adjustStock will handle the increment
            batch = await createBatchService({
                product: item.product, 
                batchNumber: item.batchNumber,
                supplier: data.supplier, 
                quantity: 0,  // Start at 0, adjustStock will increment
                purchasePrice: item.costPrice || item.price, 
                sellingPrice: item.price,
                mfgDate: item.mfgDate, 
                expiryDate: item.expiryDate,
            });
            await ProductModel.findByIdAndUpdate(item.product, { $push: { batches: batch._id } });
        } else {
            // Update existing batch (quantity is NOT updated here - adjustStock already handles it)
            await updateBatchService(batch._id, {
                purchasePrice: item.costPrice || item.price,
                mfgDate: item.mfgDate,
                expiryDate: item.expiryDate,
                supplier: data.supplier,
            });
        }

        purchaseItems.push({
            product: item.product, 
            batch: batch._id,
            quantity: item.quantity, 
            price: item.price,
            costPrice: item.costPrice || 0,
            discount: item.discount, 
            discountType: item.discountType,
            tax: item.tax, 
            taxType: item.taxType,
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

    return purchase;
};

const deletePurchase = async (id, BatchModel, ProductModel) => {
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

    return await deleteOnePurchaseService(id);
};

export {
    getPurchases,
    getPurchaseById,
    getPurchaseByInvoiceNumber,
    getPaginatedPurchases,
    createPurchase,
    updatePurchase,
    deletePurchase,
};
