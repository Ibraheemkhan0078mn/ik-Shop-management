import { create, find, findOne, findById, update, deleteOne } from "./batch.crud.js";
import { handleProductStockQuantity } from "./ChangeProductStockQuantity.js";

const getBatches = async (productId = null) => {
    const query = {};
    if (productId) {
        query.product = productId;
    }
    return await find(query)
        .populate("product")
        .populate("supplier")
        .sort({ createdAt: -1 });
};

const createBatch = async (batchData, ProductModel) => {
    const existingBatch = await findOne({
        batchNumber: batchData.batchNumber,
    });

    if (existingBatch) {
        throw new Error("Batch number already exists");
    }

    const batch = await create(batchData);

    await ProductModel.findByIdAndUpdate(batchData.product, {
        $push: { batches: batch._id },
    });

    await handleProductStockQuantity(batchData.product, "create", batchData.quantity);

    return batch;
};

const updateBatch = async (id, updateData, ProductModel) => {
    const batch = await findById(id);

    if (!batch) {
        throw new Error("Batch not found");
    }

    if (
        updateData.batchNumber &&
        updateData.batchNumber !== batch.batchNumber
    ) {
        const batchExists = await findOne({
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

    return await update(id, updateData);
};

const deleteBatch = async (id, ProductModel) => {
    const batch = await findById(id);

    if (!batch) {
        throw new Error("Batch not found");
    }

    await ProductModel.findByIdAndUpdate(batch.product, {
        $pull: { batches: batch._id },
    });

    await handleProductStockQuantity(batch.product, "delete", batch.quantity);

    return await deleteOne(id);
};

export { getBatches, createBatch, updateBatch, deleteBatch };
