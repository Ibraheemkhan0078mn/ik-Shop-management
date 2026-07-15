import { createDoc, findDocs, findOneDoc, updateDocs, deleteDocs } from "../../../common/services/db/mongodbCentralizedCrud.service.js";
import { getLocalExpensesModel } from "../../../configs/connect.db.js";

const ExpenseModel = getLocalExpensesModel();

const createExpenseService = (data) => {
    return createDoc({ model: ExpenseModel, data });
};

const findExpenseService = (query = {}) => {
    return findDocs({ model: ExpenseModel, filter: query });
};

const findOneExpenseService = (query) => {
    return findOneDoc({ model: ExpenseModel, filter: query });
};

const findByIdExpenseService = (id) => {
    return findOneDoc({ model: ExpenseModel, filter: { _id: id } });
};

const updateExpenseService = (id, data) => {
    return updateDocs({ model: ExpenseModel, filter: { _id: id }, data });
};

const deleteOneExpenseService = (id) => {
    return deleteDocs({ model: ExpenseModel, filter: { _id: id } });
};

const countExpenseService = (query) => {
    return ExpenseModel.countDocuments(query);
};

export { createExpenseService, findExpenseService, findOneExpenseService, findByIdExpenseService, updateExpenseService, deleteOneExpenseService, countExpenseService };
