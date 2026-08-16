import { findByIdProductService } from "../../product/services/product.crud.js";

/**
 * Calculate stock status for a batch based on product's min/max stock levels
 * @param {Object} batch - Batch object with quantity and product reference
 * @returns {Object} Batch object with added stockStatus field
 */
const calculateBatchStockStatus = async (batch) => {
    if (!batch || !batch.product) {
        return batch;
    }

    try {
        // Fetch product to get min/max stock levels
        const product = await findByIdProductService(batch.product);
        
        if (!product) {
            // If product not found, return batch without status
            return batch;
        }

        const { quantity = 0 } = batch;
        const { minStockLevel = 5, maxStockLevel = 10 } = product;

        let stockStatus;

        if (quantity === 0) {
            stockStatus = 'empty';
        } else if (quantity < minStockLevel) {
            stockStatus = 'low_stock';
        } else if (quantity >= maxStockLevel) {
            stockStatus = 'max_stock';
        } else {
            stockStatus = 'normal_stock';
        }

        // Return batch object with stock status
        const batchObj = batch.toObject ? batch.toObject() : batch;
        return {
            ...batchObj,
            stockStatus
        };
    } catch (error) {
        console.error('Error calculating batch stock status:', error);
        // Return batch without status if there's an error
        return batch;
    }
};

/**
 * Calculate stock status for multiple batches
 * @param {Array} batches - Array of batch objects
 * @returns {Promise<Array>} Array of batch objects with added stockStatus field
 */
const calculateBatchesStockStatus = async (batches) => {
    if (!batches || batches.length === 0) {
        return batches;
    }

    return Promise.all(
        batches.map(batch => calculateBatchStockStatus(batch))
    );
};

export {
    calculateBatchStockStatus,
    calculateBatchesStockStatus
};
