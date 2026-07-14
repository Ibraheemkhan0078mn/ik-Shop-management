import { createPurchaseService, findPurchaseService, findOnePurchaseService, findByIdPurchaseService, updatePurchaseService, deleteOnePurchaseService, countPurchaseService } from "./purchase.crud.js";
import { adjustStock, calculateStockDiff } from "../../../common/services/stockManager.js";

const getPurchases = async () => {
    return await findPurchaseService()
        .populate("supplier", "name")
        .populate({
            path: "items.product",
            select: "name productCode",
        })
        .populate({
            path: "items.batch",
            select: "batchNumber",
        })
        .sort({ createdAt: -1 });
};

const getPurchaseById = async (id) => {
    return await findByIdPurchaseService(id)
        .populate("supplier", "name")
        .populate({
            path: "items.product",
            select: "name productCode",
        })
        .populate({
            path: "items.batch",
            select: "batchNumber",
        });
};

const getPurchaseByInvoiceNumber = async (invoiceNumber) => {
    return await findOnePurchaseService({ invoiceNumber })
        .populate("supplier", "name")
        .populate({ path: "items.product", select: "name productCode" })
        .populate({ path: "items.batch", select: "batchNumber expiryDate" });
};

const getPaginatedPurchases = async (filters = {}) => {
    const { page = 1, limit = 20 } = filters;
    const query = {};
    const purchases = await findPurchaseService(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(parseInt(limit))
        .populate([
            { path: "supplier", select: "name" },
            { path: "items.product", select: "name productCode" },
            { path: "items.batch", select: "batchNumber" },
        ]);
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
        let batch = await BatchModel.findOne({
            batchNumber: item.batchNumber,
            product: item.product,
        });

        if (!batch) {
            batch = await BatchModel.create({
                product: item.product,
                batchNumber: item.batchNumber,
                supplier: purchaseData.supplier,
                quantity: item.quantity,
                purchasePrice: item.price,
                sellingPrice: item.price,
                mfgDate: item.mfgDate,
                expiryDate: item.expiryDate,
            });

            await ProductModel.findByIdAndUpdate(item.product, {
                $push: { batches: batch._id },
            });
        } else {
            batch.quantity += item.quantity;
            batch.purchasePrice = item.price;
            if (item.mfgDate) {
                batch.mfgDate = item.mfgDate;
            }
            if (item.expiryDate) {
                batch.expiryDate = item.expiryDate;
            }
            if (purchaseData.supplier) {
                batch.supplier = purchaseData.supplier;
            }
            await batch.save();
        }

        purchaseItems.push({
            product: item.product,
            batch: batch._id,
            quantity: item.quantity,
            price: item.price,
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

    // Don't increment stock for pre-orders - stock is incremented when status changes to 'delivered'

    return purchase;
};

const updatePurchase = async (id, data, BatchModel, ProductModel) => {
    const existing = await findByIdPurchaseService(id);
    if (!existing) {
        throw new Error("Purchase not found");
    }

    // Only adjust stock if purchase was delivered
    if (existing.status === 'delivered') {
        // Calculate stock differences
        const stockAdjustments = calculateStockDiff(existing.items, data.items);

        // Apply stock adjustments
        for (const adj of stockAdjustments) {
            await adjustStock(adj.productId, adj.batchId, adj.operation, adj.quantity);
        }
    }

    const purchaseItems = [];
    for (const item of data.items) {
        let batch = await BatchModel.findOne({ batchNumber: item.batchNumber, product: item.product });

        if (!batch) {
            batch = await BatchModel.create({
                product: item.product, batchNumber: item.batchNumber,
                supplier: data.supplier, quantity: item.quantity,
                purchasePrice: item.price, sellingPrice: item.price,
                mfgDate: item.mfgDate, expiryDate: item.expiryDate,
            });
            await ProductModel.findByIdAndUpdate(item.product, { $push: { batches: batch._id } });
        } else {
            batch.quantity = item.quantity;
            batch.purchasePrice = item.price;
            if (item.mfgDate) batch.mfgDate = item.mfgDate;
            if (item.expiryDate) batch.expiryDate = item.expiryDate;
            if (data.supplier) batch.supplier = data.supplier;
            await batch.save();
        }

        purchaseItems.push({
            product: item.product, batch: batch._id,
            quantity: item.quantity, price: item.price,
            discount: item.discount, discountType: item.discountType,
            tax: item.tax, taxType: item.taxType,
            mfgDate: item.mfgDate, expiryDate: item.expiryDate,
        });
    }

    const purchase = await updatePurchaseService(id, {
        supplier: data.supplier, date: data.date,
        invoiceNumber: data.invoiceNumber, items: purchaseItems,
        subtotal: data.subtotal, discount: data.discount,
        discountType: data.discountType, gst: data.gst,
        gstType: data.gstType, shippingCost: data.shippingCost, totalAmount: data.totalAmount,
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
