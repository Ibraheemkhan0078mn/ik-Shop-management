// backend/modules/productPurchases/services/purchaseReturn.service.js
import { 
    createPurchaseReturnService, 
    findPurchaseReturnService, 
    findOnePurchaseReturnService, 
    findByIdPurchaseReturnService, 
    updatePurchaseReturnService, 
    deleteOnePurchaseReturnService 
} from "./purchaseReturn.crud.js";
import { updateBatchService } from "./batch.crud.js";
import { updateProductService } from "../product/services/product.crud.js";
import { handleProductStockQuantity } from "./ChangeProductStockQuantity.js";

// Helper to adjust batch stock
async function adjustBatchStock(batchId, delta) {
  await updateBatchService(batchId, { $inc: { currentStock: delta } });
}

export async function createPurchaseReturn(data) {
  const { purchase, products } = data;

  // Adjust stocks for each returned product
  for (const item of products) {
    const { productId, batchId, quantity } = item;
    // Decrease product stock
    await handleProductStockQuantity(productId, "update", quantity, batchId); // We'll treat as update with negative delta
    // Actually we need to decrement product stock by quantity
    await updateProductService(productId, { $inc: { currentStockLevel: -Number(quantity) } });
    // Increase batch currentStock
    await adjustBatchStock(batchId, Number(quantity));
  }

  const purchaseReturn = await createPurchaseReturnService({ purchase, products });
  return purchaseReturn;
}

export async function getPurchaseReturnById(id) {
  return await findByIdPurchaseReturnService(id).populate("purchase").populate("products.productId").populate("products.batchId");
}

export async function updatePurchaseReturn(id, newData) {
  const existing = await findByIdPurchaseReturnService(id);
  if (!existing) throw new Error("PurchaseReturn not found");

  // Revert old stock changes
  for (const oldItem of existing.products) {
    const { productId, batchId, quantity } = oldItem;
    // Revert: increase product stock, decrease batch stock
    await updateProductService(productId, { $inc: { currentStockLevel: Number(quantity) } });
    await adjustBatchStock(batchId, -Number(quantity));
  }

  // Apply new stock changes
  for (const newItem of newData.products) {
    const { productId, batchId, quantity } = newItem;
    await updateProductService(productId, { $inc: { currentStockLevel: -Number(quantity) } });
    await adjustBatchStock(batchId, Number(quantity));
  }

  // Update document using CRUD service
  const updated = await updatePurchaseReturnService(id, { purchase: newData.purchase, products: newData.products });
  return updated;
}

export async function deletePurchaseReturn(id) {
  const existing = await findByIdPurchaseReturnService(id);
  if (!existing) throw new Error("PurchaseReturn not found");

  // Revert stock changes
  for (const item of existing.products) {
    const { productId, batchId, quantity } = item;
    await updateProductService(productId, { $inc: { currentStockLevel: Number(quantity) } });
    await adjustBatchStock(batchId, -Number(quantity));
  }

  await deleteOnePurchaseReturnService(id);
  return { message: "Deleted successfully" };
}
