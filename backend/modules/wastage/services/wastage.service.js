import { createWastageService, findWastageService, findOneWastageService, findByIdWastageService, updateWastageService, deleteOneWastageService, countWastageService } from "./wastage.crud.js";

const wastageCreate = async (data) => {
    return await createWastageService(data);
};

const getAllWastages = (query = {}) => {
    return findWastageService(query, { populate: [{ path: 'items.product', select: 'name _id' }], sort: { createdAt: -1 } });
};

const getWastageById = async (id) => {
    return await findByIdWastageService(id, { populate: [{ path: 'items.product', select: 'name _id' }] });
};

const wastageUpdate = async (id, data) => {
    return await updateWastageService(id, data);
};

const wastageDelete = async (id) => {
    return await deleteOneWastageService(id);
};

const countWastages = async (query = {}) => {
    return await countWastageService(query);
};

/**
 * Calculate wastage values from wastage documents
 * This function properly handles the items array structure in wastage documents
 * @param {Array} wastages - Array of wastage documents
 * @returns {Object} - Calculated wastage metrics
 */
const calculateWastageValues = (wastages) => {
    let totalWastageAmount = 0;
    let totalWastageQuantity = 0;
    let wastageCount = 0;
    
    const wastagesByProduct = {};
    const wastagesList = [];

    wastages.forEach(wastage => {
        // Calculate totals from items array
        const items = wastage.items || [];
        
        items.forEach(item => {
            const quantity = Number(item.quantity || 0);
            const costPrice = Number(item.costPrice || 0);
            const totalLoss = Number(item.totalLoss || (quantity * costPrice));

            // Accumulate total wastage amount
            totalWastageAmount += totalLoss;
            totalWastageQuantity += quantity;
            wastageCount += 1;

            // Get product name from populated product or fallback
            const productName = item.product?.name || item.product?._id?.toString() || 'Unknown Product';

            // Group by product for breakdown
            if (!wastagesByProduct[productName]) {
                wastagesByProduct[productName] = {
                    total: 0,
                    count: 0,
                    totalQuantity: 0
                };
            }
            wastagesByProduct[productName].total += totalLoss;
            wastagesByProduct[productName].count += 1;
            wastagesByProduct[productName].totalQuantity += quantity;

            // Add to wastages list for detailed view
            wastagesList.push({
                id: wastage._id,
                wastageNumber: wastage.wastageNumber,
                productName: productName,
                quantity: quantity,
                unit: item.unit,
                costPrice: costPrice,
                totalLoss: totalLoss,
                reason: item.reason || wastage.reason,
                batchNumber: item.batchNumber,
                expiryDate: item.expiryDate,
                date: wastage.wastageDate || wastage.createdAt
            });
        });
    });

    // Convert wastagesByProduct map to array
    const wastagesByProductArray = Object.entries(wastagesByProduct).map(([productName, data]) => ({
        _id: productName,
        productName: productName,
        total: data.total,
        count: data.count,
        totalQuantity: data.totalQuantity
    }));

    return {
        totalWastageAmount,
        totalWastageQuantity,
        wastageCount,
        wastagesByProduct: wastagesByProductArray,
        wastagesList: wastagesList.sort((a, b) => new Date(b.date) - new Date(a.date))
    };
};

export {
    wastageCreate,
    getAllWastages,
    getWastageById,
    wastageUpdate,
    wastageDelete,
    countWastages,
    calculateWastageValues,
};
