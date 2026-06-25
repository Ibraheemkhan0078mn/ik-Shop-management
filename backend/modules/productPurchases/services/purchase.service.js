import { createPurchaseService, findPurchaseService, findOnePurchaseService, findByIdPurchaseService, updatePurchaseService, deleteOnePurchaseService, countPurchaseService } from "./purchase.crud.js";

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

    return await createPurchaseService({
        supplier: purchaseData.supplier,
        date: purchaseData.date,
        invoiceNumber: purchaseData.invoiceNumber,
        items: purchaseItems,
        subtotal: purchaseData.subtotal,
        discount: purchaseData.discount,
        discountType: purchaseData.discountType,
        gst: purchaseData.gst,
        shippingCost: purchaseData.shippingCost,
        totalAmount: purchaseData.totalAmount,
        notes: purchaseData.notes,
    });
};

const updatePurchase = async (id, data, BatchModel, ProductModel) => {
    const existing = await findByIdPurchaseService(id);
    if (!existing) {
        throw new Error("Purchase not found");
    }

    for (const old of existing.items) {
        const oldBatch = await BatchModel.findById(old.batch);
        if (oldBatch) {
            oldBatch.quantity -= old.quantity;
            if (oldBatch.quantity <= 0) {
                await oldBatch.deleteOne();
                await ProductModel.findByIdAndUpdate(old.product, { $pull: { batches: oldBatch._id } });
            } else {
                await oldBatch.save();
            }
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
            batch.quantity += item.quantity;
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

    return await updatePurchaseService(id, {
        supplier: data.supplier, date: data.date,
        invoiceNumber: data.invoiceNumber, items: purchaseItems,
        subtotal: data.subtotal, discount: data.discount,
        discountType: data.discountType, gst: data.gst,
        shippingCost: data.shippingCost, totalAmount: data.totalAmount,
        notes: data.notes,
    });
};

const deletePurchase = async (id, BatchModel, ProductModel) => {
    const existing = await findByIdPurchaseService(id);
    if (!existing) {
        throw new Error("Purchase not found");
    }

    for (const item of existing.items) {
        const batch = await BatchModel.findById(item.batch);
        if (batch) {
            batch.quantity -= item.quantity;
            if (batch.quantity <= 0) {
                await batch.deleteOne();
                await ProductModel.findByIdAndUpdate(item.product, { $pull: { batches: batch._id } });
            } else {
                await batch.save();
            }
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
