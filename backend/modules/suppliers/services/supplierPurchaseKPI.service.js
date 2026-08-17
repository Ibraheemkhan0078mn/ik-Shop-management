import { findPurchaseService } from "../../productPurchases/services/purchase.crud.js";
import { getTransactions } from "../../transactions/services/transaction.service.js";

/**
 * Calculate KPIs for supplier purchases
 * This service calculates comprehensive purchase metrics for a supplier including:
 * - Total purchases count
 * - Total purchase amount
 * - Total paid amount
 * - Total remaining/balance amount
 * - Average purchase value
 * - Payment status breakdown
 */
export const calculateSupplierPurchaseKPIs = async (supplierId, startDate = null, endDate = null) => {
    try {
        // Build filter with date range
        const filter = { supplier: supplierId };
        
        if (startDate || endDate) {
            filter.date = {};
            if (startDate) {
                filter.date.$gte = new Date(startDate);
            }
            if (endDate) {
                const endDateTime = new Date(endDate);
                endDateTime.setHours(23, 59, 59, 999);
                filter.date.$lte = endDateTime;
            }
        }

        // Get purchases for this supplier with date filtering
        const purchases = await findPurchaseService(filter, {
            sort: { createdAt: -1 }
        });

        if (!purchases || purchases.length === 0) {
            return {
                success: true,
                data: {
                    totalPurchases: 0,
                    totalPurchaseAmount: 0,
                    totalPaidAmount: 0,
                    totalRemainingAmount: 0,
                    averagePurchaseValue: 0,
                    paymentStatusBreakdown: {
                        fullyPaid: 0,
                        partiallyPaid: 0,
                        unpaid: 0
                    },
                    purchases: []
                }
            };
        }

        let totalPurchaseAmount = 0;
        let totalPaidAmount = 0;
        let totalRemainingAmount = 0;
        let fullyPaidCount = 0;
        let partiallyPaidCount = 0;
        let unpaidCount = 0;

        const purchasesWithPaymentStatus = await Promise.all(
            purchases.map(async (purchase) => {
                const purchaseAmount = purchase.totalAmount || 0;
                totalPurchaseAmount += purchaseAmount;

                // Calculate payment status for each purchase
                const transactions = await getTransactions({
                    sourceType: 'purchase',
                    sourceId: purchase._id
                });

                const totalPaid = transactions.reduce((sum, t) => sum + (t.amount || 0), 0);
                const remainingAmount = purchaseAmount - totalPaid;

                totalPaidAmount += totalPaid;
                totalRemainingAmount += remainingAmount;

                // Determine payment status category
                if (remainingAmount <= 0) {
                    fullyPaidCount++;
                } else if (totalPaid > 0) {
                    partiallyPaidCount++;
                } else {
                    unpaidCount++;
                }

                return {
                    _id: purchase._id,
                    invoiceNumber: purchase.invoiceNumber,
                    purchaseDate: purchase.date || purchase.createdAt,
                    totalAmount: purchaseAmount,
                    paidAmount: totalPaid,
                    remainingAmount: remainingAmount,
                    paymentStatus: remainingAmount <= 0 ? 'fullyPaid' : 
                                   totalPaid > 0 ? 'partiallyPaid' : 'unpaid',
                    paymentMethod: purchase.paymentMethod
                };
            })
        );

        const averagePurchaseValue = purchases.length > 0 ? totalPurchaseAmount / purchases.length : 0;

        return {
            success: true,
            data: {
                totalPurchases: purchases.length,
                totalPurchaseAmount,
                totalPaidAmount,
                totalRemainingAmount,
                averagePurchaseValue: Math.round(averagePurchaseValue * 100) / 100,
                paymentStatusBreakdown: {
                    fullyPaid: fullyPaidCount,
                    partiallyPaid: partiallyPaidCount,
                    unpaid: unpaidCount
                },
                purchases: purchasesWithPaymentStatus
            }
        };
    } catch (error) {
        console.error("Error calculating supplier purchase KPIs:", error);
        throw error;
    }
};
