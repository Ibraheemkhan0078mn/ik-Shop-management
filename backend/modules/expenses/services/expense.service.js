import { createExpenseService, findExpenseService, findOneExpenseService, findByIdExpenseService, updateExpenseService, deleteOneExpenseService, countExpenseService } from "./expense.crud.js";
import { getCustomStartEndMonthRanges } from "../../../common/services/date.js";

const expenseCreate = async (data) => {
    return await createExpenseService(data);
};

const getExpenses = async (skip = 0, limit = 20, date = "none") => {
    let expenses = [];

    if (date == "none") {
        expenses = await findExpenseService()
            .sort({ date: -1 })
            .limit(limit)
            .skip(skip);
    } else {
        let dateObj = new Date(date);
        let { startDateFormat, endDateFormat } = getCustomStartEndMonthRanges(dateObj, dateObj);

        expenses = await findExpenseService({
            date: {
                $gte: startDateFormat,
                $lte: endDateFormat
            }
        })
            .sort({ createdOn: -1 })
            .limit(limit)
            .skip(skip);
    }

    return expenses;
};

const getPaginatedExpenses = async (page = 1, limit = 20, date = "none", category = "") => {
    let query = {};
    
    if (category) {
        query.category = { $regex: category, $options: "i" };
    }

    let expenses = [];
    let total = 0;

    if (date == "none") {
        expenses = await findExpenseService(query)
            .sort({ date: -1 })
            .limit(limit)
            .skip((page - 1) * limit);
        total = await countExpenseService(query);
    } else {
        let dateObj = new Date(date);
        let { startDateFormat, endDateFormat } = getCustomStartEndMonthRanges(dateObj, dateObj);

        query.date = {
            $gte: startDateFormat,
            $lte: endDateFormat
        };

        expenses = await findExpenseService(query)
            .sort({ createdOn: -1 })
            .limit(limit)
            .skip((page - 1) * limit);
        total = await countExpenseService(query);
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
    return await updateExpenseService(id, data);
};

const expenseDelete = async (id) => {
    return await deleteOneExpenseService(id);
};

const getCatagBasedExpense = async (catagName) => {
    return await findExpenseService({
        category: { $regex: catagName, $options: "i" }
    });
};

const getAllExpenses = async () => {
    return await findExpenseService().sort({ createdAt: -1 });
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
