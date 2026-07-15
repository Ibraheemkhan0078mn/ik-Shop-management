import { createDoc, findDocs, findOneDoc, updateDocs, deleteDocs } from "../../../common/services/db/mongodbCentralizedCrud.service.js";
import { getLocalExpenseCategoryModel } from "../../../configs/connect.db.js";

const ExpenseCategoryModel = getLocalExpenseCategoryModel();

const createExpenseCategoryService = (data) => {
    return createDoc({ model: ExpenseCategoryModel, data });
};

const findExpenseCategoryService = (query = {}) => {
    return findDocs({ model: ExpenseCategoryModel, filter: query });
};

const findOneExpenseCategoryService = (query) => {
    return findOneDoc({ model: ExpenseCategoryModel, filter: query });
};

const findByIdExpenseCategoryService = (id) => {
    return findOneDoc({ model: ExpenseCategoryModel, filter: { _id: id } });
};

const updateExpenseCategoryService = (id, data) => {
    return updateDocs({ model: ExpenseCategoryModel, filter: { _id: id }, data });
};

const deleteOneExpenseCategoryService = (id) => {
    return deleteDocs({ model: ExpenseCategoryModel, filter: { _id: id } });
};

const countExpenseCategoryService = (query) => {
    return ExpenseCategoryModel.countDocuments(query);
};

export { createExpenseCategoryService, findExpenseCategoryService, findOneExpenseCategoryService, findByIdExpenseCategoryService, updateExpenseCategoryService, deleteOneExpenseCategoryService, countExpenseCategoryService };
