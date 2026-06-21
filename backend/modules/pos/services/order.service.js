import { createOrderService, findOrderService, findOneOrderService, findByIdOrderService, deleteOneOrderService, countOrderService } from "./order.crud.js";

const orderCreate = async (data) => {
    return await createOrderService(data);
};

const getAllOrders = async (query = {}) => {
    return await findOrderService(query).sort({ createdAt: -1 });
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

export {
    orderCreate,
    getAllOrders,
    getOrderById,
    findOrderByNumber,
    orderDelete,
    countOrders,
};
