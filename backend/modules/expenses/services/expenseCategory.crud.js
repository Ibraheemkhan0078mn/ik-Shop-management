import { getLocalExpenseCategoryModel } from "../../../configs/connect.db.js";

const createExpenseCategoryService = (data) => {
    const ExpenseCategoryModel = getLocalExpenseCategoryModel();
    return ExpenseCategoryModel.create(data);
};

const findExpenseCategoryService = (query = {}) => {
    const ExpenseCategoryModel = getLocalExpenseCategoryModel();
    return ExpenseCategoryModel.find(query);
};

const findOneExpenseCategoryService = (query) => {
    const ExpenseCategoryModel = getLocalExpenseCategoryModel();
    return ExpenseCategoryModel.findOne(query);
};

const findByIdExpenseCategoryService = (id) => {
    const ExpenseCategoryModel = getLocalExpenseCategoryModel();
    return ExpenseCategoryModel.findById(id);
};

const updateExpenseCategoryService = (id, data) => {
    const ExpenseCategoryModel = getLocalExpenseCategoryModel();
    return ExpenseCategoryModel.findByIdAndUpdate(id, data, { new: true, runValidators: true });
};

const deleteOneExpenseCategoryService = (id) => {
    const ExpenseCategoryModel = getLocalExpenseCategoryModel();
    return ExpenseCategoryModel.findByIdAndDelete(id);
};

const countExpenseCategoryService = (query) => {
    const ExpenseCategoryModel = getLocalExpenseCategoryModel();
    return ExpenseCategoryModel.countDocuments(query);
};

export { createExpenseCategoryService, findExpenseCategoryService, findOneExpenseCategoryService, findByIdExpenseCategoryService, updateExpenseCategoryService, deleteOneExpenseCategoryService, countExpenseCategoryService };
