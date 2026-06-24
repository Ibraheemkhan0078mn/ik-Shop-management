// backend/modules/productPurchases/services/purchaseReturn.service.js
import { getLocalBatchModel, getLocalProductModel, getLocalPurchaseReturnModel } from "../../../configs/connect.db.js";
import { handleProductStockQuantity } from "./ChangeProductStockQuantity.js";

// Helper to adjust batch stock
async function adjustBatchStock(batchId, delta) {
  const BatchModel = getLocalBatchModel();
  await BatchModel.findByIdAndUpdate(batchId, { $inc: { currentStock: delta } });
}

export async function createPurchaseReturn(data) {
  const PurchaseReturnModel = getLocalPurchaseReturnModel();
  const { purchase, products } = data;

  // Adjust stocks for each returned product
  for (const item of products) {
    const { productId, batchId, quantity } = item;
    // Decrease product stock
    await handleProductStockQuantity(productId, "update", quantity, batchId); // We'll treat as update with negative delta
    // Actually we need to decrement product stock by quantity
    const ProductModel = getLocalProductModel();
    await ProductModel.findByIdAndUpdate(productId, { $inc: { currentStockLevel: -Number(quantity) } });
    // Increase batch currentStock
    await adjustBatchStock(batchId, Number(quantity));
  }

  const purchaseReturn = await PurchaseReturnModel.create({ purchase, products });
  return purchaseReturn;
}

export async function getPurchaseReturnById(id) {
  const PurchaseReturnModel = getLocalPurchaseReturnModel();
  return await PurchaseReturnModel.findById(id).populate("purchase").populate("products.productId").populate("products.batchId");
}

export async function updatePurchaseReturn(id, newData) {
  const PurchaseReturnModel = getLocalPurchaseReturnModel();
  const existing = await PurchaseReturnModel.findById(id);
  if (!existing) throw new Error("PurchaseReturn not found");

  // Revert old stock changes
  for (const oldItem of existing.products) {
    const { productId, batchId, quantity } = oldItem;
    // Revert: increase product stock, decrease batch stock
    const ProductModel = getLocalProductModel();
    await ProductModel.findByIdAndUpdate(productId, { $inc: { currentStockLevel: Number(quantity) } });
    await adjustBatchStock(batchId, -Number(quantity));
  }

  // Apply new stock changes
  for (const newItem of newData.products) {
    const { productId, batchId, quantity } = newItem;
    const ProductModel = getLocalProductModel();
    await ProductModel.findByIdAndUpdate(productId, { $inc: { currentStockLevel: -Number(quantity) } });
    await adjustBatchStock(batchId, Number(quantity));
  }

  // Update document
  existing.purchase = newData.purchase;
  existing.products = newData.products;
  await existing.save();
  return existing;
}

export async function deletePurchaseReturn(id) {
  const PurchaseReturnModel = getLocalPurchaseReturnModel();
  const existing = await PurchaseReturnModel.findById(id);
  if (!existing) throw new Error("PurchaseReturn not found");

  // Revert stock changes
  for (const item of existing.products) {
    const { productId, batchId, quantity } = item;
    const ProductModel = getLocalProductModel();
    await ProductModel.findByIdAndUpdate(productId, { $inc: { currentStockLevel: Number(quantity) } });
    await adjustBatchStock(batchId, -Number(quantity));
  }

  await PurchaseReturnModel.deleteOne({ _id: id });
  return { message: "Deleted successfully" };
}
