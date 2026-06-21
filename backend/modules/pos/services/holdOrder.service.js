import { create, find, findById, update, deleteOne } from "./holdOrder.crud.js";

const holdOrderCreate = async (data) => {
    return await create(data);
};

const getAllHoldOrders = async (query = {}) => {
    return await find(query).sort({ createdAt: -1 });
};

const getHoldOrderById = async (id) => {
    return await findById(id);
};

const holdOrderUpdate = async (id, data) => {
    return await update(id, data);
};

const holdOrderDelete = async (id) => {
    return await deleteOne(id);
};

export {
    holdOrderCreate,
    getAllHoldOrders,
    getHoldOrderById,
    holdOrderUpdate,
    holdOrderDelete,
};
