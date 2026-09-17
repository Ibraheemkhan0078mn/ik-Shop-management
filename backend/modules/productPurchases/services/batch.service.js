import { createBatchService, findBatchService, findOneBatchService, findByIdBatchService, updateBatchService, deleteOneBatchService, countBatchService } from "./batch.crud.js";
import { handleProductStockQuantity } from "./ChangeProductStockQuantity.js";
import { calculateBatchesStockStatus, calculateBatchStockStatus } from "./batchStockStatus.service.js";
import { updateDocs } from "../../../common/services/db/mongodbCentralizedCrud.service.js";

const getBatches = async (productId = null) => {
    const batches = await findBatchService(productId ? { product: productId } : {}, { populate: ["product"], sort: { created: -1 } });
    return calculateBatchesStockStatus(batches);
};

const getBatchById = async (id) => calculateBatchStockStatus(await findByIdBatchService(id));

const createBatch = async (batchData, ProductModel) => {
    const existingBatch = await findOneBatchService({ batchNumber: batchData.batchNumber }, { includeDeleted: true });
    if (existingBatch) throw new Error("Batch number already exists");
    const batch = await createBatchService(batchData);
    await updateDocs({ model: ProductModel, filter: { _id: batchData.product }, data: { $push: { batches: batch._id } } });
    await handleProductStockQuantity(batchData.product, "create", batchData.quantity);
    return calculateBatchStockStatus(batch);
};

const updateBatch = async (id, updateData, ProductModel) => {
    const batch = await findByIdBatchService(id);
    if (!batch) throw new Error("Batch not found");
    if (updateData.batchNumber && updateData.batchNumber !== batch.batchNumber && await findOneBatchService({ batchNumber: updateData.batchNumber }, { includeDeleted: true })) throw new Error("Batch number already in use");
    if (updateData.quantity !== undefined && updateData.quantity !== batch.quantity) await handleProductStockQuantity(batch.product, "create", number(updateData.quantity) - number(batch.quantity));
    return calculateBatchStockStatus(await updateBatchService(id, updateData));
};

const deleteBatch = async (id, ProductModel) => {
    const batch = await findByIdBatchService(id);
    if (!batch) throw new Error("Batch not found");
    await updateDocs({ model: ProductModel, filter: { _id: batch.product }, data: { $pull: { batches: batch._id } } });
    await handleProductStockQuantity(batch.product, "delete", batch.quantity);
    return deleteOneBatchService(id);
};

const number = (value) => Number(value) || 0;
const generateBatchNumber = async (reservedBatchNumbers = []) => {
    const reserved = new Set(Array.isArray(reservedBatchNumbers) ? reservedBatchNumbers : []);
    let nextNumber = (await countBatchService(/^PB-\d+$/, { includeDeleted: true })) + 1;
    let batchNumber = `PB-${String(nextNumber).padStart(3, "0")}`;
    while (reserved.has(batchNumber) || await findOneBatchService({ batchNumber }, { includeDeleted: true })) batchNumber = `PB-${String(++nextNumber).padStart(3, "0")}`;
    return batchNumber;
};

export { getBatches, createBatch, updateBatch, deleteBatch, generateBatchNumber, getBatchById };
