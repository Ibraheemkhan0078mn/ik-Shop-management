import { getLocalProductModel, getLocalBatchModel } from "../../configs/connect.db.js";

export async function adjustStock(productId, batchId, delta) {
    if (!productId || delta === 0) return;
    const ProductModel = getLocalProductModel();
    await ProductModel.findByIdAndUpdate(productId, { $inc: { currentStockLevel: delta } });
    if (batchId) {
        const BatchModel = getLocalBatchModel();
        await BatchModel.findByIdAndUpdate(batchId, { $inc: { quantity: delta } });
    }
}
