import { createOrderService, findOrderService, findOneOrderService, findByIdOrderService, deleteOneOrderService, countOrderService } from "./order.crud.js";
import { calculateOrderPaymentStatus } from "./orderPayment.service.js";
import { getTransactions } from "../../transactions/services/transaction.service.js";

const orderCreate = async (data) => {
    return await createOrderService(data);
};

const getAllOrders = async (query = {}) => {
    const orders = await findOrderService(query, { sort: { createdAt: -1 } });
    
    // Calculate payment status for each order
    const ordersWithPaymentStatus = await Promise.all(
        orders.map(async (order) => {
            const paymentStatus = await calculateOrderPaymentStatus(order._id, order.totalAmount);
            return {
                ...order.toObject ? order.toObject() : order,
                paidAmount: paymentStatus.totalPaid,
                remainingAmount: paymentStatus.remainingAmount
            };
        })
    );
    
    return ordersWithPaymentStatus;
};

const getOrderById = async (id) => {
    return await findByIdOrderService(id);
};

const findOrderByNumber = async (orderNumber) => {
    return await findOneOrderService({ orderNumber });
};

const orderDelete = async (id) => {
    return await deleteOneOrderService(id);
};

const countOrders = async (query = {}) => {
    return await countOrderService(query);
};

const getPaginatedOrders = async (filters = {}) => {
    const { page = 1, limit = 20 } = filters;
    const skip = (page - 1) * limit;
    
    const orders = await findOrderService({}, {
        sort: { createdAt: -1 },
        limit,
        skip
    });
    
    // Calculate payment status for each order
    const ordersWithPaymentStatus = await Promise.all(
        orders.map(async (order) => {
            const paymentStatus = await calculateOrderPaymentStatus(order._id, order.totalAmount);
            return {
                ...order.toObject ? order.toObject() : order,
                paidAmount: paymentStatus.totalPaid,
                remainingAmount: paymentStatus.remainingAmount
            };
        })
    );
    
    const total = await countOrderService({});
    
    return {
        data: ordersWithPaymentStatus,
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
    };
};

const getOrdersByCustomer = async (filters = {}) => {
    const { customerId, startDate, endDate } = filters;
    const filter = { customerId };
    
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

    const orders = await findOrderService(filter, { sort: { createdAt: -1 } });
    
    // Calculate payment status for each order
    const ordersWithPaymentStatus = await Promise.all(
        orders.map(async (order) => {
            const paymentStatus = await calculateOrderPaymentStatus(order._id, order.totalAmount);
            return {
                ...order.toObject ? order.toObject() : order,
                paidAmount: paymentStatus.totalPaid,
                remainingAmount: paymentStatus.remainingAmount
            };
        })
    );
    
    return ordersWithPaymentStatus;
};

export {
    orderCreate,
    getAllOrders,
    getOrderById,
    findOrderByNumber,
    orderDelete,
    countOrders,
    getPaginatedOrders,
    getOrdersByCustomer,
};
