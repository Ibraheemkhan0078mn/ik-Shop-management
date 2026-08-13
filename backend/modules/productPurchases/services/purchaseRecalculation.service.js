/**
 * Purchase Recalculation Service
 * Handles all calculations for purchase CRUD form including subtotal, discounts, taxes, and totals
 */

/**
 * Calculate subtotal from items
 * @param {Array} items - Array of purchase items
 * @returns {Number} subtotal
 */
const calculateSubtotal = (items) => {
    if (!items || !Array.isArray(items)) return 0;
    
    return items.reduce((sum, item) => {
        const quantity = Number(item.quantity) || 0;
        const price = Number(item.price) || 0;
        return sum + (quantity * price);
    }, 0);
};

/**
 * Calculate discount amount
 * @param {Number} subtotal - Subtotal before discount
 * @param {Number} discount - Discount value
 * @param {String} discountType - 'percentage' or 'fixed'
 * @returns {Number} discountAmount
 */
const calculateDiscountAmount = (subtotal, discount, discountType) => {
    const discountValue = Number(discount) || 0;
    
    if (discountType === 'percentage') {
        return (subtotal * discountValue) / 100;
    } else {
        return discountValue;
    }
};

/**
 * Calculate tax amount
 * @param {Number} subtotal - Subtotal before tax
 * @param {Number} discountAmount - Discount amount to subtract
 * @param {Number} tax - Tax value
 * @param {String} taxType - 'percentage' or 'fixed'
 * @returns {Number} taxAmount
 */
const calculateTaxAmount = (subtotal, discountAmount, tax, taxType) => {
    const taxableAmount = subtotal - discountAmount;
    const taxValue = Number(tax) || 0;
    
    if (taxType === 'percentage') {
        return (taxableAmount * taxValue) / 100;
    } else {
        return taxValue;
    }
};

/**
 * Calculate total amount
 * @param {Number} subtotal - Subtotal
 * @param {Number} discountAmount - Discount amount
 * @param {Number} taxAmount - Tax amount
 * @param {Number} shippingCost - Shipping cost
 * @returns {Number} totalAmount
 */
const calculateTotalAmount = (subtotal, discountAmount, taxAmount, shippingCost) => {
    return subtotal - discountAmount + taxAmount + (Number(shippingCost) || 0);
};

/**
 * Recalculate all purchase totals
 * @param {Object} purchaseData - Purchase form data
 * @returns {Object} Recalculated purchase data
 */
const recalculatePurchaseTotals = (purchaseData) => {
    const { items, discount, discountType, gst, gstType, shippingCost } = purchaseData;
    
    // Calculate subtotal
    const subtotal = calculateSubtotal(items);
    
    // Calculate discount amount
    const discountAmount = calculateDiscountAmount(subtotal, discount, discountType);
    
    // Calculate tax amount
    const taxAmount = calculateTaxAmount(subtotal, discountAmount, gst, gstType);
    
    // Calculate total
    const totalAmount = calculateTotalAmount(subtotal, discountAmount, taxAmount, shippingCost);
    
    return {
        subtotal,
        discountAmount,
        taxAmount,
        totalAmount
    };
};

/**
 * Recalculate single item totals
 * @param {Object} item - Purchase item
 * @returns {Object} Item with calculated totals
 */
const recalculateItemTotals = (item) => {
    const quantity = Number(item.quantity) || 0;
    const price = Number(item.price) || 0;
    const discount = Number(item.discount) || 0;
    const discountType = item.discountType || 'percentage';
    const tax = Number(item.tax) || 0;
    const taxType = item.taxType || 'percentage';
    
    // Calculate line total
    const lineTotal = quantity * price;
    
    // Calculate item discount
    const itemDiscountAmount = calculateDiscountAmount(lineTotal, discount, discountType);
    
    // Calculate item tax
    const taxableAmount = lineTotal - itemDiscountAmount;
    const itemTaxAmount = calculateTaxAmount(lineTotal, itemDiscountAmount, tax, taxType);
    
    // Calculate final item total
    const itemTotal = lineTotal - itemDiscountAmount + itemTaxAmount;
    
    return {
        lineTotal,
        itemDiscountAmount,
        itemTaxAmount,
        itemTotal
    };
};

/**
 * Extract batch details and populate item form data
 * @param {Object} batch - Batch document
 * @returns {Object} Item form data populated from batch
 */
const extractBatchDetailsForItem = (batch) => {
    return {
        product: batch.product,
        batch: batch._id,
        batchNumber: batch.batchNumber,
        quantity: batch.quantity || 0,
        price: batch.sellingPrice || 0,
        costPrice: batch.purchasePrice || 0,
        mfgDate: batch.mfgDate || null,
        expiryDate: batch.expiryDate || null,
        discount: 0,
        discountType: 'percentage',
        tax: 0,
        taxType: 'percentage'
    };
};

/**
 * Check if an item has an existing batch
 * @param {Object} item - Purchase item
 * @returns {Boolean} true if batch exists
 */
const hasExistingBatch = (item) => {
    return !!(item.batch && item.batchNumber);
};

export {
    calculateSubtotal,
    calculateDiscountAmount,
    calculateTaxAmount,
    calculateTotalAmount,
    recalculatePurchaseTotals,
    recalculateItemTotals,
    extractBatchDetailsForItem,
    hasExistingBatch
};
