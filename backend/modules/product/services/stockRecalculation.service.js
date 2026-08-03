import { 
    getLocalBatchModel, 
    getLocalProductModel, 
    getLocalOrderModel, 
    getLocalProductReturnModel, 
    getLocalWastageModel,
    getLocalPurchaseReturnModel
} from "../../../configs/connect.db.js";

/**
 * Recalculate stock for a specific product and its batches
 * This calculates stock based on:
 * 1. Initial batch quantities from purchases (add)
 * 2. Sales from orders (subtract)
 * 3. Product returns (add back)
 * 4. Purchase returns (subtract)
 * 5. Wastage (subtract)
 */
export const recalculateProductStock = async (productId) => {
    try {
        // Get the actual Mongoose models
        const BatchModel = getLocalBatchModel();
        const ProductModel = getLocalProductModel();
        const OrderModel = getLocalOrderModel();
        const ProductReturnModel = getLocalProductReturnModel();
        const WastageModel = getLocalWastageModel();
        const PurchaseReturnModel = getLocalPurchaseReturnModel();

        if (!BatchModel || !ProductModel || !OrderModel || !ProductReturnModel || !WastageModel || !PurchaseReturnModel) {
            throw new Error("Database models not initialized. Please ensure database connection is established.");
        }

        // Get all batches for this product
        const batches = await BatchModel.find({ 
            product: productId, 
            isDeleted: false 
        }).lean();

        if (!batches || batches.length === 0) {
            // No batches, set product stock to 0
            await ProductModel.findByIdAndUpdate(productId, { currentStockLevel: 0 });
            return { productId, currentStockLevel: 0, batches: [] };
        }

        // Calculate stock for each batch
        const batchResults = await Promise.all(
            batches.map(async (batch) => {
                const batchId = batch._id;
                
                // Start with initial quantity from purchase
                let currentStock = batch.quantity;

                // Subtract sales from orders (only completed orders)
                const sales = await OrderModel.aggregate([
                    {
                        $match: {
                            status: "completed",
                            isDeleted: false,
                            "items.batchId": batchId
                        }
                    },
                    {
                        $unwind: "$items"
                    },
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
                currentStock -= totalSold;

                // Add back product returns
                const productReturns = await ProductReturnModel.aggregate([
                    {
                        $match: {
                            isDeleted: false,
                            "items.batchId": batchId
                        }
                    },
                    {
                        $unwind: "$items"
                    },
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
                currentStock += totalProductReturned;

                // Subtract purchase returns
                const purchaseReturns = await PurchaseReturnModel.aggregate([
                    {
                        $match: {
                            status: "approved",
                            isDeleted: false,
                            "items.batch": batchId
                        }
                    },
                    {
                        $unwind: "$items"
                    },
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
                currentStock -= totalPurchaseReturned;

                // Subtract wastage
                const wastage = await WastageModel.aggregate([
                    {
                        $match: {
                            status: "approved",
                            isDeleted: false,
                            "items.batchNumber": batch.batchNumber,
                            "items.product": productId
                        }
                    },
                    {
                        $unwind: "$items"
                    },
                    {
                        $match: {
                            "items.batchNumber": batch.batchNumber,
                            "items.product": productId
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
                currentStock -= totalWasted;

                // Update batch current stock
                await BatchModel.findByIdAndUpdate(batchId, { currentStock: Math.max(0, currentStock) });

                return {
                    batchId: batchId,
                    batchNumber: batch.batchNumber,
                    initialQuantity: batch.quantity,
                    totalSold,
                    totalProductReturned,
                    totalPurchaseReturned,
                    totalWasted,
                    currentStock: Math.max(0, currentStock)
                };
            })
        );

        // Calculate total product stock (sum of all batch stocks)
        const totalProductStock = batchResults.reduce((sum, batch) => sum + batch.currentStock, 0);

        // Update product stock
        await ProductModel.findByIdAndUpdate(productId, { currentStockLevel: totalProductStock });

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

        const products = await ProductModel.find({ isDeleted: false }).select("_id").lean();
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
