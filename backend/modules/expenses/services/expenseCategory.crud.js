import { createDoc, findDocs, findOneDoc, updateDocs, deleteDocs } from "../../../common/services/db/mongodbCentralizedCrud.service.js";
import { getLocalExpenseCategoryModel } from "../../../configs/connect.db.js";

const createExpenseCategoryService = (data) => {
    const ExpenseCategoryModel = getLocalExpenseCategoryModel();
    return createDoc({ model: ExpenseCategoryModel, data });
};

const findExpenseCategoryService = (query = {}) => {
    const ExpenseCategoryModel = getLocalExpenseCategoryModel();
    return findDocs({ model: ExpenseCategoryModel, filter: query });
};

const findOneExpenseCategoryService = (query) => {
    const ExpenseCategoryModel = getLocalExpenseCategoryModel();
    return findOneDoc({ model: ExpenseCategoryModel, filter: query });
};

const findByIdExpenseCategoryService = (id) => {
    const ExpenseCategoryModel = getLocalExpenseCategoryModel();
    return findOneDoc({ model: ExpenseCategoryModel, filter: { _id: id } });
};

const updateExpenseCategoryService = (id, data) => {
    const ExpenseCategoryModel = getLocalExpenseCategoryModel();
    return updateDocs({ model: ExpenseCategoryModel, filter: { _id: id }, data });
};

const deleteOneExpenseCategoryService = (id) => {
    const ExpenseCategoryModel = getLocalExpenseCategoryModel();
    return deleteDocs({ model: ExpenseCategoryModel, filter: { _id: id } });
};

const countExpenseCategoryService = (query) => {
    const ExpenseCategoryModel = getLocalExpenseCategoryModel();
    return ExpenseCategoryModel.countDocuments(query);
};

export { createExpenseCategoryService, findExpenseCategoryService, findOneExpenseCategoryService, findByIdExpenseCategoryService, updateExpenseCategoryService, deleteOneExpenseCategoryService, countExpenseCategoryService };
