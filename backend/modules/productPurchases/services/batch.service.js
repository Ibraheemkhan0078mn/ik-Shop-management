import { createBatchService, findBatchService, findOneBatchService, findByIdBatchService, updateBatchService, deleteOneBatchService } from "./batch.crud.js";
import { handleProductStockQuantity } from "./ChangeProductStockQuantity.js";
import { calculateBatchesStockStatus, calculateBatchStockStatus } from "./batchStockStatus.service.js";

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
    });

    if (existingBatch) {
        throw new Error("Batch number already exists");
    }

    const batch = await createBatchService(batchData);

    await ProductModel.findByIdAndUpdate(batchData.product, {
        $push: { batches: batch._id },
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
        });
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

    await ProductModel.findByIdAndUpdate(batch.product, {
        $pull: { batches: batch._id },
    });

    await handleProductStockQuantity(batch.product, "delete", batch.quantity);

    return await deleteOneBatchService(id);
};

const generateBatchNumber = async () => {
    const allBatches = await findBatchService({ batchNumber: /^PB-\d+$/ }, {
        sort: { batchNumber: -1 },
        limit: 1
    });

    let nextNumber = 1;
    if (allBatches && allBatches.length > 0) {
        const lastBatch = allBatches[0];
        const match = lastBatch.batchNumber.match(/^PB-(\d+)$/);
        if (match) {
            nextNumber = parseInt(match[1]) + 1;
        }
    }

    return `PB-${String(nextNumber).padStart(3, '0')}`;
};

export { getBatches, createBatch, updateBatch, deleteBatch, generateBatchNumber, getBatchById };
