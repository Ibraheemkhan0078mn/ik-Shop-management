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

/**
 * Calculate per-unit values for each item in a purchase for return calculations
 * This function distributes overall-level discount, tax, and shipping proportionally across items
 * 
 * @param {String} purchaseId - The ID of the purchase document
 * @returns {Promise<Array>} Array of items with per-unit breakdown
 */
const calculatePerUnitValuesForPurchaseReturn = async (purchaseId) => {
    const { getPurchaseById } = await import("./purchase.service.js");
    
    const purchase = await getPurchaseById(purchaseId);
    if (!purchase || !purchase.items || !Array.isArray(purchase.items)) {
        throw new Error("Purchase not found or has no items");
    }

    // Calculate total shipping cost
    const totalShippingCost = Number(purchase.shippingCost) || 0;

    // The purchase invoice applies bill-level adjustments after each item's own
    // discount and tax. Build the same item-net subtotal used by the invoice.
    const itemCalculations = purchase.items.map(item => {
        const quantity = Number(item.quantity) || 0;
        const price = Number(item.price) || 0;
        const costPrice = Number(item.costPrice) || 0;
        
        // Step 1: Multiply quantity first - Base total
        const baseTotal = quantity * costPrice;

        // Step 2: Calculate item-level discount amount on base total
        const totalItemDiscount = calculateDiscountAmount(
            baseTotal,
            item.discount,
            item.discountType
        );

        // Step 3: Calculate item-level tax amount on (base total - item discount)
        const totalItemTax = calculateTaxAmount(
            baseTotal,
            totalItemDiscount,
            item.tax,
            item.taxType
        );

        const itemNetTotal = baseTotal - totalItemDiscount + totalItemTax;

        return {
            item,
            quantity,
            price,
            costPrice,
            baseTotal,
            totalItemDiscount,
            totalItemTax,
            itemNetTotal,
        };
    });

    const invoiceBaseTotal = itemCalculations.reduce((sum, calculation) => sum + calculation.itemNetTotal, 0);
    const overallDiscountAmount = calculateDiscountAmount(
        invoiceBaseTotal,
        purchase.discount,
        purchase.discountType
    );
    const overallTaxAmount = calculateTaxAmount(
        invoiceBaseTotal,
        overallDiscountAmount,
        purchase.gst,
        purchase.gstType
    );

    // Calculate return allocations from the same net item share used by the invoice.
    const itemsWithPerUnitValues = itemCalculations.map(calculation => {
        const {
            item,
            quantity,
            price,
            costPrice,
            baseTotal,
            totalItemDiscount,
            totalItemTax,
            itemNetTotal,
        } = calculation;

        // Step 4: Distribute overall discount proportionally based on item's share of subtotal
        const totalOverallDiscount = invoiceBaseTotal > 0
            ? (itemNetTotal / invoiceBaseTotal) * overallDiscountAmount
            : 0;

        // Step 5: Distribute overall tax proportionally based on item's share of subtotal
        const totalOverallTax = invoiceBaseTotal > 0
            ? (itemNetTotal / invoiceBaseTotal) * overallTaxAmount
            : 0;

        // Step 6: Distribute shipping cost proportionally based on item's share of subtotal
        const totalShipping = invoiceBaseTotal > 0
            ? (itemNetTotal / invoiceBaseTotal) * totalShippingCost
            : 0;

        // Calculate final total after all adjustments
        const finalTotal = baseTotal - totalItemDiscount + totalItemTax - totalOverallDiscount + totalOverallTax + totalShipping;

        return {
            productId: item.product,
            batchId: item.batch && item.batch._id ? item.batch._id.toString() : String(item.batch),
            quantity,
            price,
            costPrice,
            itemDiscountValue: Number(item.discount) || 0,
            itemDiscountType: item.discountType || 'percentage',
            itemTaxValue: Number(item.tax) || 0,
            itemTaxType: item.taxType || 'percentage',
            invoiceDiscountValue: Number(purchase.discount) || 0,
            invoiceDiscountType: purchase.discountType || 'percentage',
            invoiceBaseTotal,
            invoiceTotalDiscountAmount: overallDiscountAmount,
            invoiceTaxValue: Number(purchase.gst) || 0,
            invoiceTaxType: purchase.gstType || 'percentage',
            invoiceTotalTaxAmount: overallTaxAmount,
            invoiceShippingCost: totalShippingCost,
            invoiceItemNetTotal: itemNetTotal,
            baseTotal,
            totalItemDiscount,
            totalItemTax,
            totalOverallDiscount,
            totalOverallTax,
            totalShipping,
            finalTotal
        };
    });

    return itemsWithPerUnitValues;
};

export {
    calculateSubtotal,
    calculateDiscountAmount,
    calculateTaxAmount,
    calculateTotalAmount,
    recalculatePurchaseTotals,
    recalculateItemTotals,
    extractBatchDetailsForItem,
    hasExistingBatch,
    calculatePerUnitValuesForPurchaseReturn
};
