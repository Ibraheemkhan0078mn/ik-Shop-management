import { findByIdProductService, updateProductService } from "../../product/services/product.crud.js";

export async function handleProductStockQuantity(productId, origin, quantity) {
    if (!productId || !origin || quantity == null) return;
    if (origin === "create") return updateProductService(productId, { $inc: { currentStockLevel: Number(quantity) } });
    if (origin === "delete") return updateProductService(productId, { $inc: { currentStockLevel: -Number(quantity) } });
    if (origin !== "update") return;
    const product = await findByIdProductService(productId);
    if (!product) throw new Error("Product not found");
    const delta = Number(quantity) - Number(product.currentStockLevel || 0);
    if (delta) await updateProductService(productId, { $inc: { currentStockLevel: delta } });
}
