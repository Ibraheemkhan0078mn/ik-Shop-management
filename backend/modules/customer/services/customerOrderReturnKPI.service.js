import { findProductReturnService } from "../../productReturn/services/productReturn.crud.js";
import { getTransactions } from "../../transactions/services/transaction.service.js";

/**
 * Calculate KPIs for customer order returns
 * This service calculates comprehensive order return metrics for a customer including:
 * - Total returns count
 * - Total refund amount
 * - Total refunded amount (actual refunds processed)
 * - Total remaining/balance amount
 * - Average return value
 * - Status breakdown
 */
export const calculateCustomerOrderReturnKPIs = async (customerId, startDate = null, endDate = null) => {
    try {
        // Build filter with date range
        const filter = { customerId: customerId };
        
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

        // Get order returns for this customer with date filtering
        const orderReturns = await findProductReturnService(filter, {
            sort: { returnDate: -1 }
        });

        if (!orderReturns || orderReturns.length === 0) {
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
            orderReturns.map(async (orderReturn) => {
                const refundAmount = orderReturn.totalRefundAmount || 0;
                totalRefundAmount += refundAmount;

                // Calculate refund status for each order return
                const transactions = await getTransactions({
                    sourceType: 'orderReturn',
                    sourceId: orderReturn._id
                });

                const totalRefunded = transactions.reduce((sum, t) => sum + (t.amount || 0), 0);
                const remainingAmount = refundAmount - totalRefunded;

                totalRefundedAmount += totalRefunded;
                totalRemainingAmount += remainingAmount;

                // Determine status category
                const returnStatus = orderReturn.returnStatus || 'pending';
                if (returnStatus === 'pending') pendingCount++;
                else if (returnStatus === 'approved') approvedCount++;
                else if (returnStatus === 'rejected') rejectedCount++;
                else if (returnStatus === 'completed') approvedCount++; // count completed as approved
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
                    _id: orderReturn._id,
                    returnNumber: orderReturn.returnNumber,
                    returnDate: orderReturn.returnDate,
                    totalRefundAmount: refundAmount,
                    refundedAmount: totalRefunded,
                    remainingAmount: remainingAmount,
                    returnStatus: returnStatus,
                    paymentStatus: remainingAmount <= 0 && refundAmount > 0 ? 'fullyRefunded' : 
                                   totalRefunded > 0 ? 'partiallyRefunded' : 'notRefunded'
                };
            })
        );

        const averageReturnValue = orderReturns.length > 0 ? totalRefundAmount / orderReturns.length : 0;

        return {
            success: true,
            data: {
                totalReturns: orderReturns.length,
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
        console.error("Error calculating customer order return KPIs:", error);
        throw error;
    }
};
