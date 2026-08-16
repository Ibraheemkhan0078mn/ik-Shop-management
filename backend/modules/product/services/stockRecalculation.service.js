import { 
    getLocalBatchModel, 
    getLocalProductModel, 
    getLocalOrderModel, 
    getLocalProductReturnModel, 
    getLocalWastageModel,
    getLocalPurchaseReturnModel,
    getLocalPurchaseModel
} from "../../../configs/connect.db.js";
import { findDocs, updateDocs } from "../../../common/services/db/mongodbCentralizedCrud.service.js";

/**
 * Recalculate stock for a specific product and its batches
 * 
 * Algorithm:
 * a: Take the product and all its batch IDs.
 * b: Take all the purchase, purchase return, wastage, order, order return on the basis of this productId.
 * c: Loop on batch of product and calculate one by one for batch:
 *    - Purchased quantity (from delivered purchases for this batch)
 *    - Deducted quantity via purchase return (from approved purchase returns for this batch)
 *    - Deducted quantity via orders (from completed orders for this batch)
 *    - Added back quantity via order return (from approved product returns for this batch)
 *    - Deducted quantity via wastage (from approved wastage for this batch)
 * d: Sum all batch calculated stock to update product currentStockLevel.
 */
export const recalculateProductStock = async (productId) => {
    try {
        const BatchModel = getLocalBatchModel();
        const ProductModel = getLocalProductModel();
        const OrderModel = getLocalOrderModel();
        const ProductReturnModel = getLocalProductReturnModel();
        const WastageModel = getLocalWastageModel();
        const PurchaseReturnModel = getLocalPurchaseReturnModel();
        const PurchaseModel = getLocalPurchaseModel();

        if (!BatchModel || !ProductModel || !OrderModel || !ProductReturnModel || !WastageModel || !PurchaseReturnModel || !PurchaseModel) {
            throw new Error("Database models not initialized. Please ensure database connection is established.");
        }

        // a: Take the product and all its batches
        const batches = await findDocs({
            model: BatchModel,
            filter: {
                product: productId,
                isDeleted: false
            },
            options: { lean: true }
        });

        if (!batches || batches.length === 0) {
            await updateDocs({
                model: ProductModel,
                filter: { _id: productId },
                data: { currentStockLevel: 0 }
            });
            return { productId, currentStockLevel: 0, batches: [] };
        }

        // c: Loop through each batch of the product and calculate stock
        const batchResults = await Promise.all(
            batches.map(async (batch) => {
                const batchId = batch._id;

                // 1. Purchased stock (delivered purchases for this batch)
                const purchases = await PurchaseModel.aggregate([
                    {
                        $match: {
                            status: "delivered",
                            isDeleted: false,
                            "items.batch": batchId
                        }
                    },
                    { $unwind: "$items" },
                    {
                        $match: {
                            "items.batch": batchId
                        }
                    },
                    {
                        $group: {
                            _id: null,
                            totalPurchased: { $sum: "$items.quantity" }
                        }
                    }
                ]);
                const totalPurchased = purchases[0]?.totalPurchased || 0;

                // 2. Purchase returns (approved purchase returns for this batch)
                const purchaseReturns = await PurchaseReturnModel.aggregate([
                    {
                        $match: {
                            status: "approved",
                            isDeleted: false,
                            "items.batch": batchId
                        }
                    },
                    { $unwind: "$items" },
                    {
                        $match: {
                            "items.batch": batchId
                        }
                    },
                    {
                        $group: {
                            _id: null,
                            totalPurchaseReturned: { $sum: "$items.quantity" }
                        }
                    }
                ]);
                const totalPurchaseReturned = purchaseReturns[0]?.totalPurchaseReturned || 0;

                // 3. Sales from orders (completed orders for this batch)
                const sales = await OrderModel.aggregate([
                    {
                        $match: {
                            status: "completed",
                            isDeleted: false,
                            "items.batchId": batchId
                        }
                    },
                    { $unwind: "$items" },
                    {
                        $match: {
                            "items.batchId": batchId
                        }
                    },
                    {
                        $group: {
                            _id: null,
                            totalSold: { $sum: "$items.quantity" }
                        }
                    }
                ]);
                const totalSold = sales[0]?.totalSold || 0;

                // 4. Order returns / Product returns (approved returns for this batch)
                const productReturns = await ProductReturnModel.aggregate([
                    {
                        $match: {
                            returnStatus: "approved",
                            isDeleted: false,
                            "items.batchId": batchId
                        }
                    },
                    { $unwind: "$items" },
                    {
                        $match: {
                            "items.batchId": batchId
                        }
                    },
                    {
                        $group: {
                            _id: null,
                            totalReturned: { $sum: "$items.quantity" }
                        }
                    }
                ]);
                const totalProductReturned = productReturns[0]?.totalReturned || 0;

                // 5. Wastage (approved wastage for this batch)
                const wastage = await WastageModel.aggregate([
                    {
                        $match: {
                            status: "approved",
                            isDeleted: false,
                            $or: [
                                { "items.batch": batchId },
                                { "items.batchNumber": batch.batchNumber, "items.product": productId }
                            ]
                        }
                    },
                    { $unwind: "$items" },
                    {
                        $match: {
                            $or: [
                                { "items.batch": batchId },
                                { "items.batchNumber": batch.batchNumber, "items.product": productId }
                            ]
                        }
                    },
                    {
                        $group: {
                            _id: null,
                            totalWasted: { $sum: "$items.quantity" }
                        }
                    }
                ]);
                const totalWasted = wastage[0]?.totalWasted || 0;

                // Calculate current batch stock according to formula:
                // Purchased - PurchaseReturned - Sold + OrderReturned - Wasted
                const calculatedStock = Math.max(0, totalPurchased - totalPurchaseReturned - totalSold + totalProductReturned - totalWasted);

                // Update batch in database (quantity is the batch stock level field)
                await updateDocs({
                    model: BatchModel,
                    filter: { _id: batchId },
                    data: { quantity: calculatedStock }
                });

                return {
                    batchId: batchId,
                    batchNumber: batch.batchNumber,
                    totalPurchased,
                    totalPurchaseReturned,
                    totalSold,
                    totalProductReturned,
                    totalWasted,
                    quantity: calculatedStock
                };
            })
        );

        // d: Calculate total product stock from the calculated batch stocks
        const totalProductStock = batchResults.reduce((sum, b) => sum + b.quantity, 0);

        // Update product stock in database
        await updateDocs({
            model: ProductModel,
            filter: { _id: productId },
            data: { currentStockLevel: totalProductStock }
        });

        return {
            productId,
            currentStockLevel: totalProductStock,
            batches: batchResults
        };
    } catch (error) {
        console.error("Error recalculating product stock:", error);
        throw error;
    }
};

/**
 * Recalculate stock for all products
 */
export const recalculateAllStock = async () => {
    try {
        const ProductModel = getLocalProductModel();
        
        if (!ProductModel) {
            throw new Error("Database models not initialized. Please ensure database connection is established.");
        }

        const products = await findDocs({
            model: ProductModel,
            filter: { isDeleted: false },
            options: { select: "_id", lean: true }
        });
        const results = await Promise.all(
            products.map(p => recalculateProductStock(p._id))
        );
        
        return {
            success: true,
            message: `Recalculated stock for ${results.length} products`,
            data: results
        };
    } catch (error) {
        console.error("Error recalculating all stock:", error);
        throw error;
    }
};
