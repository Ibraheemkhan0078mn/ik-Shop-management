import { getLocalInventoryModel } from "../../../configs/connect.db.js";

const createInventoryService = (data) => {
    const InventoryModel = getLocalInventoryModel();
    return InventoryModel.create(data);
};

const findInventoryService = (query = {}) => {
    const InventoryModel = getLocalInventoryModel();
    return InventoryModel.find(query);
};

const findOneInventoryService = (query) => {
    const InventoryModel = getLocalInventoryModel();
    return InventoryModel.findOne(query);
};

const findByIdInventoryService = (id) => {
    const InventoryModel = getLocalInventoryModel();
    return InventoryModel.findById(id);
};

const updateInventoryService = (id, data) => {
    const InventoryModel = getLocalInventoryModel();
    return InventoryModel.findByIdAndUpdate(id, data, { new: true, runValidators: true });
};

const deleteOneInventoryService = (id) => {
    const InventoryModel = getLocalInventoryModel();
    return InventoryModel.findByIdAndDelete(id);
};

const countInventoryService = (query) => {
    const InventoryModel = getLocalInventoryModel();
    return InventoryModel.countDocuments(query);
};

export { createInventoryService, findInventoryService, findOneInventoryService, findByIdInventoryService, updateInventoryService, deleteOneInventoryService, countInventoryService };
