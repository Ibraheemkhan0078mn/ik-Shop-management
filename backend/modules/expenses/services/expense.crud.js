import { createDoc, findDocs, findOneDoc, updateDocs, deleteDocs } from "../../../common/services/db/mongodbCentralizedCrud.service.js";
import { getLocalExpensesModel } from "../../../configs/connect.db.js";

const createExpenseService = (data) => {
    const ExpenseModel = getLocalExpensesModel();
    return createDoc({ model: ExpenseModel, data });
};

const findExpenseService = (query = {}, options = {}) => {
    const ExpenseModel = getLocalExpensesModel();
    return findDocs({ model: ExpenseModel, filter: query, options });
};

const findOneExpenseService = (query, options = {}) => {
    const ExpenseModel = getLocalExpensesModel();
    return findOneDoc({ model: ExpenseModel, filter: query, options });
};

const findByIdExpenseService = (id, options = {}) => {
    const ExpenseModel = getLocalExpensesModel();
    return findOneDoc({ model: ExpenseModel, filter: { _id: id }, options });
};

const updateExpenseService = (id, data) => {
    const ExpenseModel = getLocalExpensesModel();
    return updateDocs({ model: ExpenseModel, filter: { _id: id }, data });
};

const deleteOneExpenseService = (id) => {
    const ExpenseModel = getLocalExpensesModel();
    return deleteDocs({ model: ExpenseModel, filter: { _id: id } });
};

const countExpenseService = (query) => {
    const ExpenseModel = getLocalExpensesModel();
    return ExpenseModel.countDocuments(query);
};

export { createExpenseService, findExpenseService, findOneExpenseService, findByIdExpenseService, updateExpenseService, deleteOneExpenseService, countExpenseService };
