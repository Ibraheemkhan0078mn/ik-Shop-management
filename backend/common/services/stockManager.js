import { getLocalProductModel, getLocalBatchModel } from "../../configs/connect.db.js";

/**
 * Unified stock adjustment function
 * @param {string} productId - Product ID
 * @param {string} batchId - Batch ID (optional)
 * @param {string} operation - 'inc' to increase, 'decr' to decrease
 * @param {number} quantity - Quantity to adjust
 */
export async function adjustStock(productId, batchId, operation, quantity) {
    if (!productId || !quantity || quantity <= 0) return;
    
    const delta = operation === 'inc' ? quantity : -quantity;
    const ProductModel = getLocalProductModel();
    
    // Adjust product stock
    await ProductModel.findByIdAndUpdate(productId, { $inc: { currentStockLevel: delta } });
    
    // Adjust batch stock if batchId provided
    if (batchId) {
        const BatchModel = getLocalBatchModel();
        await BatchModel.findByIdAndUpdate(batchId, { $inc: { quantity: delta } });
    }
}

/**
 * Calculate stock difference between old and new items
 * @param {Array} oldItems - Old items array
 * @param {Array} newItems - New items array
 * @returns {Array} Array of {productId, batchId, operation, quantity}
 */
export function calculateStockDiff(oldItems = [], newItems = []) {
    const adjustments = [];
    
    // Create maps for easier lookup
    const oldMap = new Map();
    const newMap = new Map();
    
    for (const item of oldItems) {
        const key = `${item.product}-${item.batch || item.batchId}`;
        oldMap.set(key, { ...item });
    }
    
    for (const item of newItems) {
        const key = `${item.product}-${item.batch || item.batchId}`;
        newMap.set(key, { ...item });
    }
    
    // Check for decrements (items removed or reduced)
    for (const [key, oldItem] of oldMap) {
        const newItem = newMap.get(key);
        const batchId = oldItem.batch || oldItem.batchId;
        
        if (!newItem) {
            // Item removed - decrement full quantity
            adjustments.push({
                productId: oldItem.product,
                batchId,
                operation: 'decr',
                quantity: oldItem.quantity
            });
        } else if (newItem.quantity < oldItem.quantity) {
            // Quantity reduced - decrement the difference
            adjustments.push({
                productId: oldItem.product,
                batchId,
                operation: 'decr',
                quantity: oldItem.quantity - newItem.quantity
            });
        }
    }
    
    // Check for increments (items added or increased)
    for (const [key, newItem] of newMap) {
        const oldItem = oldMap.get(key);
        const batchId = newItem.batch || newItem.batchId;
        
        if (!oldItem) {
            // Item added - increment full quantity
            adjustments.push({
                productId: newItem.product,
                batchId,
                operation: 'inc',
                quantity: newItem.quantity
            });
        } else if (newItem.quantity > oldItem.quantity) {
            // Quantity increased - increment the difference
            adjustments.push({
                productId: newItem.product,
                batchId,
                operation: 'inc',
                quantity: newItem.quantity - oldItem.quantity
            });
        }
    }
    
    return adjustments;
}
