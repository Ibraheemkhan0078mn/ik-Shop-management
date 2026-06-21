import { create, find, findOne, findById, update, deleteOne, count } from "./inventory.crud.js";

const inventoryCreate = async (data) => {
    return await create(data);
};

const inventoryUpdate = async (id, data) => {
    return await update(id, data);
};

const inventoryDelete = async (id) => {
    return await deleteOne(id);
};

const getAllInventory = async (query = {}) => {
    return await find(query).populate("addedBy", "name email").sort({ createdAt: -1 });
};

const getInventoryById = async (id) => {
    return await findById(id);
};

const countInventory = async (query = {}) => {
    return await count(query);
};

export {
    inventoryCreate,
    inventoryUpdate,
    inventoryDelete,
    getAllInventory,
    getInventoryById,
    countInventory,
};
