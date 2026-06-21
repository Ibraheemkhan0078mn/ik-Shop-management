import { createHoldOrderService, findHoldOrderService, findByIdHoldOrderService, updateHoldOrderService, deleteOneHoldOrderService } from "./holdOrder.crud.js";

const holdOrderCreate = async (data) => {
    return await createHoldOrderService(data);
};

const getAllHoldOrders = async (query = {}) => {
    return await findHoldOrderService(query).sort({ createdAt: -1 });
};

const getHoldOrderById = async (id) => {
    return await findByIdHoldOrderService(id);
};

const holdOrderUpdate = async (id, data) => {
    return await updateHoldOrderService(id, data);
};

const holdOrderDelete = async (id) => {
    return await deleteOneHoldOrderService(id);
};

export {
    holdOrderCreate,
    getAllHoldOrders,
    getHoldOrderById,
    holdOrderUpdate,
    holdOrderDelete,
};
