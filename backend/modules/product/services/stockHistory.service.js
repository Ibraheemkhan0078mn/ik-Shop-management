import { 
    getLocalBatchModel, 
    getLocalProductModel, 
    getLocalOrderModel, 
    getLocalProductReturnModel, 
    getLocalWastageModel,
    getLocalPurchaseReturnModel,
    getLocalPurchaseModel
} from "../../../configs/connect.db.js";
import { findDocs, aggregateDocs } from "../../../common/services/db/mongodbCentralizedCrud.service.js";

/**
 * Get stock history for a specific product and its batches
 * 
 * Returns detailed history organized by date for each batch, showing:
 * - Purchases (adds stock)
 * - Purchase Returns (removes stock)
 * - Orders (removes stock)
 * - Order Returns (adds stock)
 * - Wastage (removes stock)
 * 
 * Data structure:
 * {
 *   productId: string,
 *   productName: string,
 *   batches: [
 *     {
 *       batchId: string,
 *       batchNumber: string,
 *       currentStock: number,
 *       summary: {
 *         purchases: number,
 *         purchaseReturns: number,
 *         orders: number,
 *         orderReturns: number,
 *         wastage: number,
 *         finalStock: number
 *       },
 *       history: {
 *         purchases: { "YYYY-MM-DD": [{ purchaseId, _id, itemId, itemName, quantity, date }] },
 *         purchaseReturns: { "YYYY-MM-DD": [...] },
 *         orders: { "YYYY-MM-DD": [...] },
 *         orderReturns: { "YYYY-MM-DD": [...] },
 *         wastage: { "YYYY-MM-DD": [...] }
 *       }
 *     }
 *   ]
 * }
 */
export const getStockHistory = async (productId) => {
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

        // Get product details
        const product = await findDocs({
            model: ProductModel,
            filter: { _id: productId },
            options: { lean: true }
        });

        if (!product || product.length === 0) {
            throw new Error("Product not found");
        }

        const productData = product[0];

        // Get all batches for this product
        const batches = await findDocs({
            model: BatchModel,
            filter: {
                product: productId,
                isDeleted: false
            },
            options: { lean: true }
        });

        if (!batches || batches.length === 0) {
            return {
                productId,
                productName: productData.name,
                batches: []
            };
        }

        // Process each batch
        const batchResults = await Promise.all(
            batches.map(async (batch) => {
                const batchId = batch._id;
                const batchNumber = batch.batchNumber;

                // Helper to format date as YYYY-MM-DD
                const formatDateKey = (date) => {
                    if (!date) return "Unknown";
                    const d = new Date(date);
                    return d.toISOString().split('T')[0];
                };

                // Helper to organize data by date
                const organizeByDate = (items) => {
                    const organized = {};
                    items.forEach(item => {
                        const dateKey = formatDateKey(item.date || item.createdAt);
                        if (!organized[dateKey]) {
                            organized[dateKey] = [];
                        }
                        organized[dateKey].push(item);
                    });
                    return organized;
                };

                // 1. Purchases (delivered status)
                const purchases = await aggregateDocs({
                    model: PurchaseModel,
                    pipeline: [
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
                            $project: {
                                purchaseId: "$_id",
                                _id: "$items._id",
                                itemId: "$items.item",
                                itemName: "$items.name",
                                quantity: "$items.quantity",
                                date: "$createdAt",
                                invoiceNumber: "$invoiceNumber"
                            }
                        }
                    ]
                });

                // 2. Purchase Returns (approved status)
                const purchaseReturns = await aggregateDocs({
                    model: PurchaseReturnModel,
                    pipeline: [
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
                            $project: {
                                purchaseReturnId: "$_id",
                                _id: "$items._id",
                                itemId: "$items.item",
                                itemName: "$items.name",
                                quantity: "$items.quantity",
                                date: "$createdAt",
                                returnNumber: "$returnNumber"
                            }
                        }
                    ]
                });

                // 3. Orders (completed status)
                const orders = await aggregateDocs({
                    model: OrderModel,
                    pipeline: [
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
                            $project: {
                                orderId: "$_id",
                                _id: "$items._id",
                                itemId: "$items.item",
                                itemName: "$items.name",
                                quantity: "$items.quantity",
                                date: "$createdAt",
                                orderNumber: "$orderNumber"
                            }
                        }
                    ]
                });

                // 4. Order Returns / Product Returns (approved status)
                const orderReturns = await aggregateDocs({
                    model: ProductReturnModel,
                    pipeline: [
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
                            $project: {
                                orderReturnId: "$_id",
                                _id: "$items._id",
                                itemId: "$items.item",
                                itemName: "$items.name",
                                quantity: "$items.quantity",
                                date: "$createdAt",
                                returnNumber: "$returnNumber"
                            }
                        }
                    ]
                });

                // 5. Wastage (approved status)
                const wastage = await aggregateDocs({
                    model: WastageModel,
                    pipeline: [
                        {
                            $match: {
                                status: "approved",
                                isDeleted: false,
                                $or: [
                                    { "items.batch": batchId },
                                    { "items.batchNumber": batchNumber, "items.product": productId }
                                ]
                            }
                        },
                        { $unwind: "$items" },
                        {
                            $match: {
                                $or: [
                                    { "items.batch": batchId },
                                    { "items.batchNumber": batchNumber, "items.product": productId }
                                ]
                            }
                        },
                        {
                            $project: {
                                wastageId: "$_id",
                                _id: "$items._id",
                                itemId: "$items.item",
                                itemName: "$items.name",
                                quantity: "$items.quantity",
                                date: "$createdAt",
                                wastageNumber: "$wastageNumber"
                            }
                        }
                    ]
                });

                // Calculate totals for summary
                const totalPurchased = purchases.reduce((sum, p) => sum + (p.quantity || 0), 0);
                const totalPurchaseReturned = purchaseReturns.reduce((sum, p) => sum + (p.quantity || 0), 0);
                const totalSold = orders.reduce((sum, o) => sum + (o.quantity || 0), 0);
                const totalOrderReturned = orderReturns.reduce((sum, o) => sum + (o.quantity || 0), 0);
                const totalWasted = wastage.reduce((sum, w) => sum + (w.quantity || 0), 0);

                // Calculate final stock
                const finalStock = Math.max(0, totalPurchased - totalPurchaseReturned - totalSold + totalOrderReturned - totalWasted);

                // Organize by date
                const purchasesByDate = organizeByDate(purchases);
                const purchaseReturnsByDate = organizeByDate(purchaseReturns);
                const ordersByDate = organizeByDate(orders);
                const orderReturnsByDate = organizeByDate(orderReturns);
                const wastageByDate = organizeByDate(wastage);

                return {
                    batchId: batchId,
                    batchNumber: batchNumber,
                    currentStock: batch.quantity || 0,
                    summary: {
                        purchases: totalPurchased,
                        purchaseReturns: totalPurchaseReturned,
                        orders: totalSold,
                        orderReturns: totalOrderReturned,
                        wastage: totalWasted,
                        finalStock: finalStock
                    },
                    history: {
                        purchases: purchasesByDate,
                        purchaseReturns: purchaseReturnsByDate,
                        orders: ordersByDate,
                        orderReturns: orderReturnsByDate,
                        wastage: wastageByDate
                    }
                };
            })
        );

        return {
            productId,
            productName: productData.name,
            productCode: productData.productCode,
            batches: batchResults
        };
    } catch (error) {
        console.error("Error getting stock history:", error);
        throw error;
    }
};
