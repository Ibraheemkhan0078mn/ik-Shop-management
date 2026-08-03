import { createOrderService, findOrderService, findOneOrderService, findByIdOrderService, deleteOneOrderService, countOrderService } from "./order.crud.js";

const orderCreate = async (data) => {
    return await createOrderService(data);
};

const getAllOrders = async (query = {}) => {
    return await findOrderService(query, { sort: { createdAt: -1 } });
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
    
    const total = await countOrderService({});
    
    return {
        data: orders,
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

    return await findOrderService(filter, { sort: { createdAt: -1 } });
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
