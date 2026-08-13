/**
 * Purchase Return Recalculation Service
 * Handles all calculations for purchase return CRUD form including subtotal, discounts, taxes, and totals
 */

/**
 * Calculate base amount from items (quantity * cost price)
 * @param {Array} items - Array of purchase return items
 * @returns {Number} baseAmount
 */
const calculateBaseAmount = (items) => {
    if (!items || !Array.isArray(items)) return 0;
    
    return items.reduce((sum, item) => {
        const quantity = Number(item.quantity) || 0;
        const costPrice = Number(item.costPrice || item.purchasePrice) || 0;
        return sum + (quantity * costPrice);
    }, 0);
};

/**
 * Calculate total cut amount from items
 * @param {Array} items - Array of purchase return items
 * @returns {Number} totalCutAmount
 */
const calculateTotalCutAmount = (items) => {
    if (!items || !Array.isArray(items)) return 0;
    
    return items.reduce((sum, item) => {
        return sum + (Number(item.cut) || 0);
    }, 0);
};

/**
 * Calculate discount amount from original purchase
 * @param {Number} baseAmount - Base amount before discount
 * @param {Object} purchase - Original purchase document
 * @returns {Number} discountAmount
 */
const calculateDiscountAmount = (baseAmount, purchase) => {
    if (!purchase || !purchase.discount) return 0;
    
    const discount = Number(purchase.discount) || 0;
    
    if (purchase.discountType === 'percentage') {
        return (baseAmount * discount) / 100;
    } else if (purchase.discountType === 'fixed') {
        // Distribute fixed discount proportionally
        const totalPurchaseQuantity = purchase.items?.reduce((sum, i) => sum + (i.quantity || 0), 0) || 1;
        return discount; // Fixed discount is applied to total, not per item
    }
    
    return 0;
};

/**
 * Calculate tax amount from original purchase
 * @param {Number} afterDiscountAmount - Amount after discount
 * @param {Object} purchase - Original purchase document
 * @returns {Number} taxAmount
 */
const calculateTaxAmount = (afterDiscountAmount, purchase) => {
    if (!purchase || !purchase.gst) return 0;
    
    const tax = Number(purchase.gst) || 0;
    
    if (purchase.gstType === 'percentage') {
        return (afterDiscountAmount * tax) / 100;
    } else if (purchase.gstType === 'fixed') {
        return tax;
    }
    
    return 0;
};

/**
 * Calculate total refund amount
 * @param {Number} baseAmount - Base amount
 * @param {Number} discountAmount - Discount amount
 * @param {Number} taxAmount - Tax amount
 * @param {Number} totalCutAmount - Total cut amount
 * @returns {Number} totalRefundAmount
 */
const calculateTotalRefundAmount = (baseAmount, discountAmount, taxAmount, totalCutAmount) => {
    return baseAmount - discountAmount + taxAmount - totalCutAmount;
};

/**
 * Recalculate all purchase return totals
 * @param {Object} purchaseReturnData - Purchase return form data
 * @param {Object} purchase - Original purchase document
 * @returns {Object} Recalculated purchase return data
 */
const recalculatePurchaseReturnTotals = (purchaseReturnData, purchase) => {
    const { items } = purchaseReturnData;
    
    // Calculate base amount
    const baseAmount = calculateBaseAmount(items);
    
    // Calculate discount amount from original purchase
    const discountAmount = calculateDiscountAmount(baseAmount, purchase);
    
    // Calculate amount after discount
    const afterDiscountAmount = baseAmount - discountAmount;
    
    // Calculate tax amount from original purchase
    const taxAmount = calculateTaxAmount(afterDiscountAmount, purchase);
    
    // Calculate total cut amount
    const totalCutAmount = calculateTotalCutAmount(items);
    
    // Calculate total refund
    const totalRefundAmount = calculateTotalRefundAmount(baseAmount, discountAmount, taxAmount, totalCutAmount);
    
    // Calculate total quantity
    const totalQuantity = items.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
    
    return {
        baseAmount,
        discountAmount,
        taxAmount,
        totalCutAmount,
        totalRefundAmount,
        totalQuantity
    };
};

/**
 * Recalculate single item refund amount
 * @param {Object} item - Purchase return item
 * @param {Object} purchase - Original purchase document
 * @returns {Object} Item with calculated refund
 */
const recalculateItemRefund = (item, purchase) => {
    const quantity = Number(item.quantity) || 0;
    const costPrice = Number(item.costPrice || item.purchasePrice) || 0;
    const cut = Number(item.cut) || 0;
    
    // Calculate base total for this item
    const itemBaseTotal = quantity * costPrice;
    
    // Calculate discount for this item
    let itemDiscountAmount = 0;
    if (purchase?.discountType && purchase?.discount) {
        const discount = Number(purchase.discount) || 0;
        if (purchase.discountType === 'percentage') {
            itemDiscountAmount = (itemBaseTotal * discount) / 100;
        } else if (purchase.discountType === 'fixed') {
            // Distribute fixed discount proportionally across items
            const totalPurchaseQuantity = purchase.items?.reduce((sum, i) => sum + (i.quantity || 0), 0) || 1;
            const discountPerItem = discount / totalPurchaseQuantity;
            itemDiscountAmount = discountPerItem * quantity;
        }
    }
    
    // Calculate amount after discount
    const afterDiscount = itemBaseTotal - itemDiscountAmount;
    
    // Calculate tax for this item
    let itemTaxAmount = 0;
    if (purchase?.gstType && purchase?.gst) {
        const tax = Number(purchase.gst) || 0;
        if (purchase.gstType === 'percentage') {
            itemTaxAmount = (afterDiscount * tax) / 100;
        } else if (purchase.gstType === 'fixed') {
            // Distribute fixed tax proportionally across items
            const totalPurchaseQuantity = purchase.items?.reduce((sum, i) => sum + (i.quantity || 0), 0) || 1;
            const taxPerItem = tax / totalPurchaseQuantity;
            itemTaxAmount = taxPerItem * quantity;
        }
    }
    
    // Calculate final refund for this item
    const itemRefundAmount = itemBaseTotal - itemDiscountAmount + itemTaxAmount - cut;
    
    return {
        itemBaseTotal,
        itemDiscountAmount,
        itemTaxAmount,
        itemRefundAmount
    };
};

export {
    calculateBaseAmount,
    calculateTotalCutAmount,
    calculateDiscountAmount,
    calculateTaxAmount,
    calculateTotalRefundAmount,
    recalculatePurchaseReturnTotals,
    recalculateItemRefund
};
