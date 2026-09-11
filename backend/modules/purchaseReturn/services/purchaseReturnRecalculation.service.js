/**
 * Purchase Return Recalculation Service
 *
 * Primary path (preferred):
 *   Each item stores a `costing` object with `totalCostingAmount` — the effective
 *   per-unit cost after the batch-level discount and tax were applied.
 *   Formula:  itemRefund = (totalCostingAmount × quantity) - cut
 *
 * Fallback path (legacy items without stored costing):
 *   Re-derive per-unit cost from the original purchase document's global
 *   discount / gst fields.  Logic mirrors what the CRUD form does in its
 *   `calculateUnitCostAfterTaxAndDiscount` fallback branch.
 */

/**
 * Resolve the effective per-unit cost for a single item.
 * Uses stored costing object when present; falls back to purchase-level derivation.
 *
 * @param {Object} item     - Purchase return item (from DB)
 * @param {Object} purchase - Original purchase document (may be null for primary path)
 * @returns {{ unitCost, discountAmount, taxAmount }}
 */
const resolveItemUnitCost = (item, purchase) => {
    const costing = item.costing;

    // ── Primary path: use stored costing ──────────────────────────────────────
    if (costing && typeof costing.totalCostingAmount === "number") {
        return {
            unitCost: costing.totalCostingAmount,
            discountAmount: costing.purchasedDiscountAmount ?? 0,
            taxAmount: costing.purchasedTaxAmount ?? 0,
        };
    }

    // ── Fallback path: derive from purchase-level discount/gst ─────────────────
    const costPrice = Number(item.purchasePrice) || 0;

    // Discount
    let discountAmount = 0;
    if (purchase?.discountType && purchase?.discount) {
        const discount = Number(purchase.discount) || 0;
        if (purchase.discountType === "percentage") {
            discountAmount = (costPrice * discount) / 100;
        } else if (purchase.discountType === "fixed") {
            const totalPurchaseQuantity =
                purchase.items?.reduce((s, i) => s + (i.quantity || 0), 0) || 1;
            discountAmount = discount / totalPurchaseQuantity;
        }
    }

    // Tax (applied on after-discount price)
    const afterDiscount = costPrice - discountAmount;
    let taxAmount = 0;
    if (purchase?.gstType && purchase?.gst) {
        const tax = Number(purchase.gst) || 0;
        if (purchase.gstType === "percentage") {
            taxAmount = (afterDiscount * tax) / 100;
        } else if (purchase.gstType === "fixed") {
            taxAmount = tax;
        }
    }

    return {
        unitCost: costPrice - discountAmount + taxAmount,
        discountAmount,
        taxAmount,
    };
};

/**
 * Calculate base amount from items (quantity × purchasePrice, before any adjustments).
 * Kept for reference / external callers.
 * @param {Array} items
 * @returns {Number}
 */
const calculateBaseAmount = (items) => {
    if (!items || !Array.isArray(items)) return 0;
    return items.reduce((sum, item) => {
        const quantity = Number(item.quantity) || 0;
        const costPrice = Number(item.purchasePrice) || 0;
        return sum + quantity * costPrice;
    }, 0);
};

/**
 * Calculate total cut amount from items.
 * @param {Array} items
 * @returns {Number}
 */
const calculateTotalCutAmount = (items) => {
    if (!items || !Array.isArray(items)) return 0;
    return items.reduce((sum, item) => sum + (Number(item.cut) || 0), 0);
};

/**
 * Calculate discount amount from original purchase (legacy helper).
 * @param {Number} baseAmount
 * @param {Object} purchase
 * @returns {Number}
 */
const calculateDiscountAmount = (baseAmount, purchase) => {
    if (!purchase || !purchase.discount) return 0;
    const discount = Number(purchase.discount) || 0;
    if (purchase.discountType === "percentage") {
        return (baseAmount * discount) / 100;
    } else if (purchase.discountType === "fixed") {
        return discount;
    }
    return 0;
};

/**
 * Calculate tax amount from original purchase (legacy helper).
 * @param {Number} afterDiscountAmount
 * @param {Object} purchase
 * @returns {Number}
 */
const calculateTaxAmount = (afterDiscountAmount, purchase) => {
    if (!purchase || !purchase.gst) return 0;
    const tax = Number(purchase.gst) || 0;
    if (purchase.gstType === "percentage") {
        return (afterDiscountAmount * tax) / 100;
    } else if (purchase.gstType === "fixed") {
        return tax;
    }
    return 0;
};

/**
 * Calculate total refund amount (legacy helper).
 */
const calculateTotalRefundAmount = (baseAmount, discountAmount, taxAmount, totalCutAmount) => {
    return baseAmount - discountAmount + taxAmount - totalCutAmount;
};

/**
 * Recalculate all purchase return totals.
 * Uses stored costing per item (primary path) or purchase-level derivation (fallback).
 *
 * @param {Object} purchaseReturnData - { items: [...] }
 * @param {Object} purchase           - Original purchase document (used only in fallback)
 * @returns {Object} { totalRefundAmount, totalQuantity, perItemBreakdown }
 */
const recalculatePurchaseReturnTotals = (purchaseReturnData, purchase) => {
    const { items } = purchaseReturnData;
    if (!items || !Array.isArray(items)) {
        return { totalRefundAmount: 0, totalQuantity: 0, perItemBreakdown: [] };
    }

    let totalRefundAmount = 0;
    let totalQuantity = 0;
    const perItemBreakdown = [];

    for (const item of items) {
        const quantity = Number(item.quantity) || 0;
        const cut = Number(item.cut) || 0;

        const { unitCost, discountAmount, taxAmount } = resolveItemUnitCost(item, purchase);

        const itemTotal = unitCost * quantity;
        const itemRefundAmount = itemTotal - cut;

        totalRefundAmount += itemRefundAmount;
        totalQuantity += quantity;

        perItemBreakdown.push({
            batchId: item.batch,
            quantity,
            unitCost,
            discountAmount,
            taxAmount,
            cut,
            itemTotal,
            itemRefundAmount,
        });
    }

    return { totalRefundAmount, totalQuantity, perItemBreakdown };
};

/**
 * Recalculate a single item's refund.
 * Uses stored costing (primary) or purchase-level derivation (fallback).
 *
 * @param {Object} item     - Purchase return item
 * @param {Object} purchase - Original purchase document (used only in fallback)
 * @returns {Object}
 */
const recalculateItemRefund = (item, purchase) => {
    const quantity = Number(item.quantity) || 0;
    const cut = Number(item.cut) || 0;

    const { unitCost, discountAmount, taxAmount } = resolveItemUnitCost(item, purchase);

    const itemBaseTotal = unitCost * quantity;        // = effectiveCostPrice × qty
    const itemRefundAmount = itemBaseTotal - cut;

    return {
        itemBaseTotal,
        itemDiscountAmount: discountAmount * quantity,
        itemTaxAmount: taxAmount * quantity,
        itemRefundAmount,
    };
};

export {
    resolveItemUnitCost,
    calculateBaseAmount,
    calculateTotalCutAmount,
    calculateDiscountAmount,
    calculateTaxAmount,
    calculateTotalRefundAmount,
    recalculatePurchaseReturnTotals,
    recalculateItemRefund,
};
