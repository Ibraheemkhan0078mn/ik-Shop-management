import { createExpenseService, findExpenseService, findOneExpenseService, findByIdExpenseService, updateExpenseService, deleteOneExpenseService, countExpenseService } from "./expense.crud.js";
import { getCustomStartEndMonthRanges } from "../../../common/services/date.js";
import { findTransactionService, updateTransactionService, deleteOneTransactionService, countTransactionService } from "../../transactions/services/transaction.service.js";

const expenseCreate = async (data) => {
    return await createExpenseService(data);
};

const getExpenses = async (skip = 0, limit = 20, date = "none") => {
    let expenses = [];

    if (date == "none") {
        expenses = await findTransactionService({
            sourceType: 'expense',
            isDeleted: false
        }, {
            sort: { transactionDate: -1 },
            limit,
            skip
        });
    } else {
        let dateObj = new Date(date);
        let { startDateFormat, endDateFormat } = getCustomStartEndMonthRanges(dateObj, dateObj);

        expenses = await findTransactionService({
            sourceType: 'expense',
            isDeleted: false,
            transactionDate: {
                $gte: startDateFormat,
                $lte: endDateFormat
            }
        }, {
            sort: { transactionDate: -1 },
            limit,
            skip
        });
    }

    return expenses;
};

const getPaginatedExpenses = async (page = 1, limit = 20, date = "none", category = "") => {
    let query = {
        sourceType: 'expense',
        isDeleted: false
    };
    
    if (category) {
        query.notes = { $regex: category, $options: "i" };
    }

    let expenses = [];
    let total = 0;

    if (date == "none") {
        expenses = await findTransactionService(query, {
            sort: { transactionDate: -1 },
            limit,
            skip: (page - 1) * limit
        });
        total = await countTransactionService(query);
    } else {
        let dateObj = new Date(date);
        let { startDateFormat, endDateFormat } = getCustomStartEndMonthRanges(dateObj, dateObj);

        query.transactionDate = {
            $gte: startDateFormat,
            $lte: endDateFormat
        };

        expenses = await findTransactionService(query, {
            sort: { transactionDate: -1 },
            limit,
            skip: (page - 1) * limit
        });
        total = await countTransactionService(query);
    }

    return {
        data: expenses || [],
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
    };
};

const expenseUpdate = async (id, data) => {
    // Update transaction instead of expense document
    return await updateTransactionService(id, data);
};

const expenseDelete = async (id) => {
    // Delete transaction instead of expense document
    return await deleteOneTransactionService(id);
};

const getCatagBasedExpense = async (catagName) => {
    return await findTransactionService({
        sourceType: 'expense',
        isDeleted: false,
        notes: { $regex: catagName, $options: "i" }
    });
};

const getAllExpenses = async () => {
    return await findTransactionService({
        sourceType: 'expense',
        isDeleted: false
    }, { sort: { transactionDate: -1 } });
};

export {
    expenseCreate,
    getExpenses,
    getAllExpenses,
    getPaginatedExpenses,
    expenseUpdate,
    expenseDelete,
    getCatagBasedExpense,
};
