import { getLocalExpensesModel } from "../../../configs/connect.db.js";

const createExpenseService = (data) => {
    const ExpenseModel = getLocalExpensesModel();
    return ExpenseModel.create(data);
};

const findExpenseService = (query = {}) => {
    const ExpenseModel = getLocalExpensesModel();
    return ExpenseModel.find(query);
};

const findOneExpenseService = (query) => {
    const ExpenseModel = getLocalExpensesModel();
    return ExpenseModel.findOne(query);
};

const findByIdExpenseService = (id) => {
    const ExpenseModel = getLocalExpensesModel();
    return ExpenseModel.findById(id);
};

const updateExpenseService = (id, data) => {
    const ExpenseModel = getLocalExpensesModel();
    return ExpenseModel.findByIdAndUpdate(id, data, { new: true, runValidators: true });
};

const deleteOneExpenseService = (id) => {
    const ExpenseModel = getLocalExpensesModel();
    return ExpenseModel.findByIdAndDelete(id);
};

const countExpenseService = (query) => {
    const ExpenseModel = getLocalExpensesModel();
    return ExpenseModel.countDocuments(query);
};

export { createExpenseService, findExpenseService, findOneExpenseService, findByIdExpenseService, updateExpenseService, deleteOneExpenseService, countExpenseService };
