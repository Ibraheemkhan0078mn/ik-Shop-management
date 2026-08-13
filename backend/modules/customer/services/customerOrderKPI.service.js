import { findOrderService } from "../../pos/services/order.crud.js";
import { getTransactions } from "../../transactions/services/transaction.service.js";
import { calculateOrderPaymentStatus } from "../../pos/services/orderPayment.service.js";

/**
 * Calculate KPIs for customer orders
 * This service calculates comprehensive order metrics for a customer including:
 * - Total orders count
 * - Total order amount
 * - Total paid amount
 * - Total remaining/balance amount
 * - Average order value
 * - Payment status breakdown
 */
export const calculateCustomerOrderKPIs = async (customerId, startDate = null, endDate = null) => {
    try {
        // Build filter with date range
        const filter = { customerId: customerId };
        
        if (startDate || endDate) {
            filter.createdAt = {};
            if (startDate) {
                filter.createdAt.$gte = new Date(startDate);
            }
            if (endDate) {
                const endDateTime = new Date(endDate);
                endDateTime.setHours(23, 59, 59, 999);
                filter.createdAt.$lte = endDateTime;
            }
        }

        // Get orders for this customer with date filtering
        const orders = await findOrderService(filter, {
            sort: { createdAt: -1 }
        });

        if (!orders || orders.length === 0) {
            return {
                success: true,
                data: {
                    totalOrders: 0,
                    totalOrderAmount: 0,
                    totalPaidAmount: 0,
                    totalRemainingAmount: 0,
                    averageOrderValue: 0,
                    paymentStatusBreakdown: {
                        fullyPaid: 0,
                        partiallyPaid: 0,
                        unpaid: 0
                    },
                    orders: []
                }
            };
        }

        let totalOrderAmount = 0;
        let totalPaidAmount = 0;
        let totalRemainingAmount = 0;
        let fullyPaidCount = 0;
        let partiallyPaidCount = 0;
        let unpaidCount = 0;

        const ordersWithPaymentStatus = await Promise.all(
            orders.map(async (order) => {
                const orderAmount = order.totalAmount || 0;
                totalOrderAmount += orderAmount;

                // Calculate payment status for each order
                const paymentStatus = await calculateOrderPaymentStatus(order._id, orderAmount);
                
                totalPaidAmount += paymentStatus.totalPaid;
                totalRemainingAmount += paymentStatus.remainingAmount;

                // Determine payment status category
                if (paymentStatus.remainingAmount <= 0) {
                    fullyPaidCount++;
                } else if (paymentStatus.totalPaid > 0) {
                    partiallyPaidCount++;
                } else {
                    unpaidCount++;
                }

                return {
                    _id: order._id,
                    orderNumber: order.orderNumber,
                    orderDate: order.createdAt,
                    totalAmount: orderAmount,
                    paidAmount: paymentStatus.totalPaid,
                    remainingAmount: paymentStatus.remainingAmount,
                    paymentStatus: paymentStatus.remainingAmount <= 0 ? 'fullyPaid' : 
                                   paymentStatus.totalPaid > 0 ? 'partiallyPaid' : 'unpaid',
                    paymentMethod: order.paymentMethod
                };
            })
        );

        const averageOrderValue = orders.length > 0 ? totalOrderAmount / orders.length : 0;

        return {
            success: true,
            data: {
                totalOrders: orders.length,
                totalOrderAmount,
                totalPaidAmount,
                totalRemainingAmount,
                averageOrderValue: Math.round(averageOrderValue * 100) / 100,
                paymentStatusBreakdown: {
                    fullyPaid: fullyPaidCount,
                    partiallyPaid: partiallyPaidCount,
                    unpaid: unpaidCount
                },
                orders: ordersWithPaymentStatus
            }
        };
    } catch (error) {
        console.error("Error calculating customer order KPIs:", error);
        throw error;
    }
};
