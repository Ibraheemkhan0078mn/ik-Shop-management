import { createBatchService, findBatchService, findOneBatchService, findByIdBatchService, updateBatchService, deleteOneBatchService, countBatchService } from "./batch.crud.js";
import { handleProductStockQuantity } from "./ChangeProductStockQuantity.js";
import { calculateBatchesStockStatus, calculateBatchStockStatus } from "./batchStockStatus.service.js";
import { updateDocs } from "../../../common/services/db/mongodbCentralizedCrud.service.js";

const getBatches = async (productId = null) => {
    const query = {};
    if (productId) {
        query.product = productId;
    }
    const batches = await findBatchService(query, {
        populate: ["product", "supplier"],
        sort: { createdAt: -1 }
    });
    return await calculateBatchesStockStatus(batches);
};

const getBatchById = async (id) => {
    const batch = await findByIdBatchService(id);
    return await calculateBatchStockStatus(batch);
};

const createBatch = async (batchData, ProductModel) => {
    const existingBatch = await findOneBatchService({
        batchNumber: batchData.batchNumber,
    }, { includeDeleted: true });

    if (existingBatch) {
        throw new Error("Batch number already exists");
    }

    const batch = await createBatchService(batchData);

    await updateDocs({
        model: ProductModel,
        filter: { _id: batchData.product },
        data: { $push: { batches: batch._id } }
    });

    await handleProductStockQuantity(batchData.product, "create", batchData.quantity);

    return await calculateBatchStockStatus(batch);
};

const updateBatch = async (id, updateData, ProductModel) => {
    const batch = await findByIdBatchService(id);

    if (!batch) {
        throw new Error("Batch not found");
    }

    if (
        updateData.batchNumber &&
        updateData.batchNumber !== batch.batchNumber
    ) {
        const batchExists = await findOneBatchService({
            batchNumber: updateData.batchNumber,
        }, { includeDeleted: true });
        if (batchExists) {
            throw new Error("Batch number already in use");
        }
    }

    if (updateData.quantity !== undefined && updateData.quantity !== batch.quantity) {
        const quantityDiff = updateData.quantity - batch.quantity;
        await handleProductStockQuantity(batch.product, "create", quantityDiff);
    }

    const updatedBatch = await updateBatchService(id, updateData);
    return await calculateBatchStockStatus(updatedBatch);
};

const deleteBatch = async (id, ProductModel) => {
    const batch = await findByIdBatchService(id);

    if (!batch) {
        throw new Error("Batch not found");
    }

    await updateDocs({
        model: ProductModel,
        filter: { _id: batch.product },
        data: { $pull: { batches: batch._id } }
    });

    await handleProductStockQuantity(batch.product, "delete", batch.quantity);

    return await deleteOneBatchService(id);
};

const generateBatchNumber = async (reservedBatchNumbers = []) => {
    const batchNumberPattern = /^PB-\d+$/;
    const batchCount = await countBatchService(batchNumberPattern, { includeDeleted: true });
    const reserved = new Set(Array.isArray(reservedBatchNumbers) ? reservedBatchNumbers : []);
    let nextNumber = batchCount + 1;
    let nextBatchNumber = `PB-${String(nextNumber).padStart(3, "0")}`;

    while (reserved.has(nextBatchNumber) || await findOneBatchService({ batchNumber: nextBatchNumber }, { includeDeleted: true })) {
        nextNumber += 1;
        nextBatchNumber = `PB-${String(nextNumber).padStart(3, "0")}`;
    }

    return nextBatchNumber;
};

export { getBatches, createBatch, updateBatch, deleteBatch, generateBatchNumber, getBatchById };
