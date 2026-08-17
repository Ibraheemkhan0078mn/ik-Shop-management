import { findPurchaseReturnService } from "../../purchaseReturn/services/purchaseReturn.crud.js";
import { getTransactions } from "../../transactions/services/transaction.service.js";

/**
 * Calculate KPIs for supplier purchase returns
 * This service calculates comprehensive purchase return metrics for a supplier including:
 * - Total returns count
 * - Total refund amount
 * - Total refunded amount (actual payments made)
 * - Total remaining/balance amount
 * - Average return value
 * - Status breakdown
 */
export const calculateSupplierPurchaseReturnKPIs = async (supplierId, startDate = null, endDate = null) => {
    try {
        // Build filter with date range
        const filter = { supplier: supplierId };
        
        if (startDate || endDate) {
            filter.returnDate = {};
            if (startDate) {
                filter.returnDate.$gte = new Date(startDate);
            }
            if (endDate) {
                const endDateTime = new Date(endDate);
                endDateTime.setHours(23, 59, 59, 999);
                filter.returnDate.$lte = endDateTime;
            }
        }

        // Get purchase returns for this supplier with date filtering
        const purchaseReturns = await findPurchaseReturnService(filter, {
            sort: { returnDate: -1 }
        });

        if (!purchaseReturns || purchaseReturns.length === 0) {
            return {
                success: true,
                data: {
                    totalReturns: 0,
                    totalRefundAmount: 0,
                    totalRefundedAmount: 0,
                    totalRemainingAmount: 0,
                    averageReturnValue: 0,
                    statusBreakdown: {
                        pending: 0,
                        approved: 0,
                        rejected: 0,
                        draft: 0
                    },
                    paymentStatusBreakdown: {
                        fullyRefunded: 0,
                        partiallyRefunded: 0,
                        notRefunded: 0
                    },
                    returns: []
                }
            };
        }

        let totalRefundAmount = 0;
        let totalRefundedAmount = 0;
        let totalRemainingAmount = 0;
        let pendingCount = 0;
        let approvedCount = 0;
        let rejectedCount = 0;
        let draftCount = 0;
        let fullyRefundedCount = 0;
        let partiallyRefundedCount = 0;
        let notRefundedCount = 0;

        const returnsWithPaymentStatus = await Promise.all(
            purchaseReturns.map(async (purchaseReturn) => {
                const refundAmount = purchaseReturn.totalRefundAmount || 0;
                totalRefundAmount += refundAmount;

                // Calculate refund status for each purchase return
                const transactions = await getTransactions({
                    sourceType: 'purchaseReturn',
                    sourceId: purchaseReturn._id
                });

                const totalRefunded = transactions.reduce((sum, t) => sum + (t.amount || 0), 0);
                const remainingAmount = refundAmount - totalRefunded;

                totalRefundedAmount += totalRefunded;
                totalRemainingAmount += remainingAmount;

                // Determine status category
                const status = purchaseReturn.status || 'draft';
                if (status === 'pending') pendingCount++;
                else if (status === 'approved') approvedCount++;
                else if (status === 'rejected') rejectedCount++;
                else draftCount++;

                // Determine payment status category
                if (remainingAmount <= 0 && refundAmount > 0) {
                    fullyRefundedCount++;
                } else if (totalRefunded > 0) {
                    partiallyRefundedCount++;
                } else {
                    notRefundedCount++;
                }

                return {
                    _id: purchaseReturn._id,
                    purchaseReturnNumber: purchaseReturn.purchaseReturnNumber,
                    returnDate: purchaseReturn.returnDate,
                    totalRefundAmount: refundAmount,
                    refundedAmount: totalRefunded,
                    remainingAmount: remainingAmount,
                    status: status,
                    paymentStatus: remainingAmount <= 0 && refundAmount > 0 ? 'fullyRefunded' : 
                                   totalRefunded > 0 ? 'partiallyRefunded' : 'notRefunded'
                };
            })
        );

        const averageReturnValue = purchaseReturns.length > 0 ? totalRefundAmount / purchaseReturns.length : 0;

        return {
            success: true,
            data: {
                totalReturns: purchaseReturns.length,
                totalRefundAmount,
                totalRefundedAmount,
                totalRemainingAmount,
                averageReturnValue: Math.round(averageReturnValue * 100) / 100,
                statusBreakdown: {
                    pending: pendingCount,
                    approved: approvedCount,
                    rejected: rejectedCount,
                    draft: draftCount
                },
                paymentStatusBreakdown: {
                    fullyRefunded: fullyRefundedCount,
                    partiallyRefunded: partiallyRefundedCount,
                    notRefunded: notRefundedCount
                },
                returns: returnsWithPaymentStatus
            }
        };
    } catch (error) {
        console.error("Error calculating supplier purchase return KPIs:", error);
        throw error;
    }
};
