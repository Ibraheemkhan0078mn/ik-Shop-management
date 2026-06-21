import { create, find, findOne, findById, update, deleteOne, count } from "./inventoryCategory.crud.js";

const inventoryCategoryCreate = async (data) => {
    return await create(data);
};

const inventoryCategoryUpdate = async (id, data) => {
    return await update(id, data);
};

const inventoryCategoryDelete = async (id) => {
    return await deleteOne(id);
};

const getAllInventoryCategories = async (query = {}) => {
    return await find(query).sort({ createdAt: -1 });
};

const getInventoryCategoryById = async (id) => {
    return await findById(id);
};

const checkDuplicateCategoryName = async (name) => {
    return await findOne({ name: { $regex: `^${name.trim()}$`, $options: "i" } });
};

export {
    inventoryCategoryCreate,
    inventoryCategoryUpdate,
    inventoryCategoryDelete,
    getAllInventoryCategories,
    getInventoryCategoryById,
    checkDuplicateCategoryName,
};
