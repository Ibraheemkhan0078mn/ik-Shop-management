import { createInventoryCategoryService, findInventoryCategoryService, findOneInventoryCategoryService, findByIdInventoryCategoryService, updateInventoryCategoryService, deleteOneInventoryCategoryService, countInventoryCategoryService } from "./inventoryCategory.crud.js";

const inventoryCategoryCreate = async (data) => {
    return await createInventoryCategoryService(data);
};

const inventoryCategoryUpdate = async (id, data) => {
    return await updateInventoryCategoryService(id, data);
};

const inventoryCategoryDelete = async (id) => {
    return await deleteOneInventoryCategoryService(id);
};

const getAllInventoryCategories = async (query = {}) => {
    return await findInventoryCategoryService(query).sort({ createdAt: -1 });
};

const getInventoryCategoryById = async (id) => {
    return await findByIdInventoryCategoryService(id);
};

const checkDuplicateCategoryName = async (name) => {
    return await findOneInventoryCategoryService({ name: { $regex: `^${name.trim()}$`, $options: "i" } });
};

export {
    inventoryCategoryCreate,
    inventoryCategoryUpdate,
    inventoryCategoryDelete,
    getAllInventoryCategories,
    getInventoryCategoryById,
    checkDuplicateCategoryName,
};
