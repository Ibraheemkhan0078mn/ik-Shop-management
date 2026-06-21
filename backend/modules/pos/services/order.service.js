import { create, find, findOne, findById, deleteOne, count } from "./order.crud.js";

const orderCreate = async (data) => {
    return await create(data);
};

const getAllOrders = async (query = {}) => {
    return await find(query).sort({ createdAt: -1 });
};

const getOrderById = async (id) => {
    return await findById(id);
};

const findOrderByNumber = async (orderNumber) => {
    return await findOne({ orderNumber });
};

const orderDelete = async (id) => {
    return await deleteOne(id);
};

const countOrders = async (query = {}) => {
    return await count(query);
};

export {
    orderCreate,
    getAllOrders,
    getOrderById,
    findOrderByNumber,
    orderDelete,
    countOrders,
};
