// import { getLocalProductModel } from "../../../configs/connect.db.js";



// export async function changeProductStockQuatity(productId,type, quantity ) {
//     try {
//         let ProductModel = getLocalProductModel()
//         if (!type || !quantity) return;
//         if (type == "add") {
//             await ProductModel.findOneAndUpdate(
//                 { _id: productId },
//                 { $inc: { currentStockLevel: Number(quantity) } }
//             );
//         } else {
//             await ProductModel.findOneAndUpdate(
//                 { _id: item?.product },
//                 { $inc: { currentStockLevel: Number(quantity) * -1 } }
//             );
//         }


//     } catch (error) {
//         throw new Error(error)
//     }
// }











import { findByIdProductService, updateProductService } from "../../product/services/product.crud.js";

export async function handleProductStockQuantity(productId, origin, quantity, batchId) {
    try {
        if (!productId || !origin || quantity == null) return;

        if (origin === "create") {
            // New product/purchase created → increment stock
            await updateProductService(productId, { $inc: { currentStockLevel: Number(quantity) } });

        } else if (origin === "update") {
            // Fetch current stock to calculate delta
            const product = await findByIdProductService(productId);
            if (!product) throw new Error("Product not found");

            const currentStock = product.currentStockLevel;
            const newQuantity = Number(quantity);

            if (newQuantity === currentStock) return; // No change needed

            const delta = newQuantity - currentStock;
            // delta > 0 → inc, delta < 0 → dec (handled by $inc with negative)
            await updateProductService(productId, { $inc: { currentStockLevel: delta } });

        } else if (origin === "delete") {
            // Product/purchase deleted → decrement stock
            await updateProductService(productId, { $inc: { currentStockLevel: Number(quantity) * -1 } });
        }

    } catch (error) {
        throw new Error(error);
    }
}