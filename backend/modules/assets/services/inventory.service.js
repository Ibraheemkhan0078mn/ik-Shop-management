import { createInventoryService, findInventoryService, findOneInventoryService, findByIdInventoryService, updateInventoryService, deleteOneInventoryService, countInventoryService } from "./inventory.crud.js";

const inventoryCreate = async (data) => {
    return await createInventoryService(data);
};

const inventoryUpdate = async (id, data) => {
    return await updateInventoryService(id, data);
};

const inventoryDelete = async (id) => {
    return await deleteOneInventoryService(id);
};

const getAllInventory = async (query = {}) => {
    return await findInventoryService(query).populate("addedBy", "name email").sort({ createdAt: -1 });
};

const getInventoryById = async (id) => {
    return await findByIdInventoryService(id);
};

const countInventory = async (query = {}) => {
    return await countInventoryService(query);
};

export {
    inventoryCreate,
    inventoryUpdate,
    inventoryDelete,
    getAllInventory,
    getInventoryById,
    countInventory,
};
