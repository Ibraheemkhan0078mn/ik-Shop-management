import { createOrderService, findOrderService, findOneOrderService, findByIdOrderService, deleteOneOrderService, countOrderService } from "./order.crud.js";
import { calculateOrderPaymentStatus } from "./orderPayment.service.js";
import { getTransactions } from "../../transactions/services/transaction.service.js";
import { findByIdCustomerService } from "../../customer/services/customer.crud.js";
import { findByIdStaffService } from "../../staff/services/staff.crud.js";

const orderCreate = async (data) => {
    return await createOrderService(data);
};

const getAllOrders = async (query = {}) => {
    const orders = await findOrderService(query, { sort: { createdAt: -1 } });
    
    // Calculate payment status and fetch customer/staff data for each order
    const ordersWithPaymentStatus = await Promise.all(
        orders.map(async (order) => {
            const orderObj = order.toObject ? order.toObject() : order;
            const paymentStatus = await calculateOrderPaymentStatus(order._id, order.totalAmount);

            // Manually fetch customer data if customerId exists
            if (orderObj.customerId) {
                try {
                    const customer = await findByIdCustomerService(orderObj.customerId);
                    if (customer) {
                        orderObj.customerData = customer.toObject ? customer.toObject() : customer;
                    }
                } catch (error) {
                    console.error('Error fetching customer:', error.message);
                }
            }

            // Manually fetch staff data if staffId exists
            if (orderObj.staffId) {
                try {
                    const staff = await findByIdStaffService(orderObj.staffId);
                    if (staff) {
                        orderObj.staffData = staff.toObject ? staff.toObject() : staff;
                    }
                } catch (error) {
                    console.error('Error fetching staff:', error.message);
                }
            }

            return {
                ...orderObj,
                paidAmount: paymentStatus.totalPaid,
                remainingAmount: paymentStatus.remainingAmount
            };
        })
    );
    
    return ordersWithPaymentStatus;
};

const getOrderById = async (id) => {
    const order = await findByIdOrderService(id);
    
    if (!order) {
        return null;
    }

    // Convert to plain object if it's a Mongoose document
    const orderObj = order.toObject ? order.toObject() : order;

    // Manually fetch customer data if customerId exists
    if (orderObj.customerId) {
        try {
            const customer = await findByIdCustomerService(orderObj.customerId);
            if (customer) {
                orderObj.customerData = customer.toObject ? customer.toObject() : customer;
            }
        } catch (error) {
            console.error('Error fetching customer:', error.message);
        }
    }

    // Manually fetch staff data if staffId exists
    if (orderObj.staffId) {
        try {
            const staff = await findByIdStaffService(orderObj.staffId);
            if (staff) {
                orderObj.staffData = staff.toObject ? staff.toObject() : staff;
            }
        } catch (error) {
            console.error('Error fetching staff:', error.message);
        }
    }

    return orderObj;
};

const findOrderByNumber = async (orderNumber) => {
    const order = await findOneOrderService({ orderNumber });
    
    if (!order) {
        return null;
    }

    // Convert to plain object if it's a Mongoose document
    const orderObj = order.toObject ? order.toObject() : order;

    // Manually fetch customer data if customerId exists
    if (orderObj.customerId) {
        try {
            const customer = await findByIdCustomerService(orderObj.customerId);
            if (customer) {
                orderObj.customerData = customer.toObject ? customer.toObject() : customer;
            }
        } catch (error) {
            console.error('Error fetching customer:', error.message);
        }
    }

    // Manually fetch staff data if staffId exists
    if (orderObj.staffId) {
        try {
            const staff = await findByIdStaffService(orderObj.staffId);
            if (staff) {
                orderObj.staffData = staff.toObject ? staff.toObject() : staff;
            }
        } catch (error) {
            console.error('Error fetching staff:', error.message);
        }
    }

    return orderObj;
};

const orderDelete = async (id) => {
    // Delete all related transactions
    const transactions = await getTransactions({ sourceType: 'sale', sourceId: id });
    for (const transaction of transactions) {
        const { deleteTransaction } = await import("../../transactions/services/transaction.service.js");
        await deleteTransaction(transaction._id);
    }

    return await deleteOneOrderService(id);
};

const countOrders = async (query = {}) => {
    return await countOrderService(query);
};

const getPaginatedOrders = async (filters = {}) => {
    const { page = 1, limit = 20, orderNumber } = filters;
    const skip = (page - 1) * limit;
    
    const query = {};
    if (orderNumber) query.orderNumber = { $regex: orderNumber, $options: "i" };
    
    const orders = await findOrderService(query, {
        sort: { createdAt: -1 },
        limit,
        skip
    });
    
    // Calculate payment status and fetch customer/staff data for each order
    const ordersWithPaymentStatus = await Promise.all(
        orders.map(async (order) => {
            const orderObj = order.toObject ? order.toObject() : order;
            const paymentStatus = await calculateOrderPaymentStatus(order._id, order.totalAmount);

            // Manually fetch customer data if customerId exists
            if (orderObj.customerId) {
                try {
                    const customer = await findByIdCustomerService(orderObj.customerId);
                    if (customer) {
                        orderObj.customerData = customer.toObject ? customer.toObject() : customer;
                    }
                } catch (error) {
                    console.error('Error fetching customer:', error.message);
                }
            }

            // Manually fetch staff data if staffId exists
            if (orderObj.staffId) {
                try {
                    const staff = await findByIdStaffService(orderObj.staffId);
                    if (staff) {
                        orderObj.staffData = staff.toObject ? staff.toObject() : staff;
                    }
                } catch (error) {
                    console.error('Error fetching staff:', error.message);
                }
            }

            return {
                ...orderObj,
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
    
    // Calculate payment status and fetch customer/staff data for each order
    const ordersWithPaymentStatus = await Promise.all(
        orders.map(async (order) => {
            const orderObj = order.toObject ? order.toObject() : order;
            const paymentStatus = await calculateOrderPaymentStatus(order._id, order.totalAmount);

            // Manually fetch customer data if customerId exists
            if (orderObj.customerId) {
                try {
                    const customer = await findByIdCustomerService(orderObj.customerId);
                    if (customer) {
                        orderObj.customerData = customer.toObject ? customer.toObject() : customer;
                    }
                } catch (error) {
                    console.error('Error fetching customer:', error.message);
                }
            }

            // Manually fetch staff data if staffId exists
            if (orderObj.staffId) {
                try {
                    const staff = await findByIdStaffService(orderObj.staffId);
                    if (staff) {
                        orderObj.staffData = staff.toObject ? staff.toObject() : staff;
                    }
                } catch (error) {
                    console.error('Error fetching staff:', error.message);
                }
            }

            return {
                ...orderObj,
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
