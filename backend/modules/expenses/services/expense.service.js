import { create, find, findOne, findById, update, deleteOne, count } from "./expense.crud.js";
import { getCustomStartEndMonthRanges } from "../../../common/services/date.js";

const expenseCreate = async (data) => {
    return await create(data);
};

const getExpenses = async (skip = 0, limit = 20, date = "none") => {
    let expenses = [];

    if (date == "none") {
        expenses = await find()
            .sort({ date: -1 })
            .limit(limit)
            .skip(skip);
    } else {
        let dateObj = new Date(date);
        let { startDateFormat, endDateFormat } = getCustomStartEndMonthRanges(dateObj, dateObj);

        expenses = await find({
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
        expenses = await find(query)
            .sort({ date: -1 })
            .limit(limit)
            .skip((page - 1) * limit);
        total = await count(query);
    } else {
        let dateObj = new Date(date);
        let { startDateFormat, endDateFormat } = getCustomStartEndMonthRanges(dateObj, dateObj);

        query.date = {
            $gte: startDateFormat,
            $lte: endDateFormat
        };

        expenses = await find(query)
            .sort({ createdOn: -1 })
            .limit(limit)
            .skip((page - 1) * limit);
        total = await count(query);
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
    return await update(id, data);
};

const expenseDelete = async (id) => {
    return await deleteOne(id);
};

const getCatagBasedExpense = async (catagName) => {
    return await find({
        category: { $regex: catagName, $options: "i" }
    });
};

export {
    expenseCreate,
    getExpenses,
    getPaginatedExpenses,
    expenseUpdate,
    expenseDelete,
    getCatagBasedExpense,
};
