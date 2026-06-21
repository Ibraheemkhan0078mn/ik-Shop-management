import { getLocalInventoryCategoryModel } from "../../../configs/connect.db.js";

const createInventoryCategoryService = (data) => {
    const InventoryCategoryModel = getLocalInventoryCategoryModel();
    return InventoryCategoryModel.create(data);
};

const findInventoryCategoryService = (query = {}) => {
    const InventoryCategoryModel = getLocalInventoryCategoryModel();
    return InventoryCategoryModel.find(query);
};

const findOneInventoryCategoryService = (query) => {
    const InventoryCategoryModel = getLocalInventoryCategoryModel();
    return InventoryCategoryModel.findOne(query);
};

const findByIdInventoryCategoryService = (id) => {
    const InventoryCategoryModel = getLocalInventoryCategoryModel();
    return InventoryCategoryModel.findById(id);
};

const updateInventoryCategoryService = (id, data) => {
    const InventoryCategoryModel = getLocalInventoryCategoryModel();
    return InventoryCategoryModel.findByIdAndUpdate(id, data, { new: true, runValidators: true });
};

const deleteOneInventoryCategoryService = (id) => {
    const InventoryCategoryModel = getLocalInventoryCategoryModel();
    return InventoryCategoryModel.findByIdAndDelete(id);
};

const countInventoryCategoryService = (query) => {
    const InventoryCategoryModel = getLocalInventoryCategoryModel();
    return InventoryCategoryModel.countDocuments(query);
};

export { createInventoryCategoryService, findInventoryCategoryService, findOneInventoryCategoryService, findByIdInventoryCategoryService, updateInventoryCategoryService, deleteOneInventoryCategoryService, countInventoryCategoryService };
