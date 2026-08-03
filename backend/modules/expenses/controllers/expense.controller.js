import { getLocalExpensesModel, getLocalExpenseCategoryModel } from "../../../configs/connect.db.js";
import { ApiError } from "../../../common/services/apiResponses.js";
import { changeTrackDocsCreationFunc } from "../../../common/ikSync/changeTrackModelCreation.js";
import {
    expenseCreate as expenseCreateService,
    getExpenses as getExpensesService,
    getAllExpenses as getAllExpensesService,
    getPaginatedExpenses as getPaginatedExpensesService,
    expenseUpdate as expenseUpdateService,
    expenseDelete as expenseDeleteService,
    getCatagBasedExpense as getCatagBasedExpenseService,
} from "../services/expense.service.js";
import {
    expenseCatagCreate as expenseCatagCreateService,
    expenseCatagGetAll as expenseCatagGetAllService,
    expenseCatagDelete as expenseCatagDeleteService,
} from "../services/expenseCategory.service.js";




export const expenseCreate = async (req, res) => {
    try {
        let { amount,
            type,
            date,
            notes,
            category,
            isInvestment,
            investedBy
        } = req.body;

        let expenseModel = getLocalExpensesModel();

        // VALIDATION
        if (!amount || !type) {
            return res.json({ success: false, msg: "Amount and type are required" });
        }

        let createdExpense = await expenseCreateService({
            amount,
            type,
            date: new Date(date),
            notes: notes || "",
            category
        });

        if (!createdExpense) {
            return res.json({ success: false, msg: "The expense doc is nto created" })
        }

        await changeTrackDocsCreationFunc("create", expenseModel.modelName, createdExpense?._id);

        let expenses = await getAllExpensesService();

        return res.json({ success: true, msg: "Expense created", expenses });
    } catch (err) {
        console.log(err)
        return ApiError(err, res)
    }
}










export const getExpenses = async (req, res) => {
    try {
        let skip = parseInt(req.params.skip) || 0;
        let limit = parseInt(req.params.limit) || 20;
        let date = req.params.date;

        let expenses = await getExpensesService(skip, limit, date);

        return res.json({ success: true, expenses: expenses || [] });
    } catch (err) {
        console.log(err);
        return res.json({ success: false, msg: "Error getting expenses" });
    }
}

export const getPaginatedExpenses = async (req, res) => {
    try {
        let page = parseInt(req.query.page) || 1;
        let limit = parseInt(req.query.limit) || 20;
        let date = req.query.date || "none";
        let category = req.query.category || "";

        let result = await getPaginatedExpensesService(page, limit, date, category);

        return res.json({ 
            success: true, 
            ...result
        });
    } catch (err) {
        console.log(err);
        return res.json({ success: false, msg: "Error getting expenses" });
    }
}








export const expenseUpdate = async (req, res) => {
    try {
        let { _id, amount, type, date, notes, category } = req.body;
        let expenseModel = getLocalExpensesModel();

        if (!_id) {
            return res.json({ success: false, msg: "Expense ID is required" });
        }

        let updated = await expenseUpdateService(_id, { amount, type, date, notes, category });

        if (!updated) {
            return res.json({ success: false, msg: "Expense not found" });
        }

        await changeTrackDocsCreationFunc("update", expenseModel.modelName, updated?._id);

        let expenses = await getAllExpensesService();

        return res.json({ success: true, msg: "Expense updated", expenses });
    } catch (err) {
        return res.json({ success: false, msg: "Error updating expense" });
    }
}









export const expenseDelete = async (req, res) => {
    try {
        let { _id } = req.body;
        let expenseModel = getLocalExpensesModel();

        if (!_id) {
            return res.json({ success: false, msg: "Expense ID is required" });
        }

        let deleted = await expenseDeleteService(_id);

        if (!deleted) {
            return res.json({ success: false, msg: "Expense not found" });
        }

        await changeTrackDocsCreationFunc("delete", expenseModel.modelName, _id);

        let expenses = await getAllExpensesService();

        return res.json({ success: true, msg: "Expense deleted", expenses });
    } catch (err) {
        return res.json({ success: false, msg: "Error deleting expense" });
    }
}









export const expenseCatagCreate = async (req, res) => {
    try {
        let { catagName } = req.body
        if (!catagName) {
            return res.json({ success: false, msg: "The catagory name is not found" })
        }

        let localExpenseCatagModel = getLocalExpenseCategoryModel()
        let createdExpenseCatag = await expenseCatagCreateService(catagName);

        await changeTrackDocsCreationFunc("create", localExpenseCatagModel.modelName, createdExpenseCatag?._id)

        let allExpenseCatags = await expenseCatagGetAllService();

        return res.json({ success: true, expenseCatags: allExpenseCatags })
    } catch (err) {
        console.log(err)
        return res.json({ success: false, msg: "Error deleting expense" });
    }
}

export const expenseCatagGetAll = async (req, res) => {
    try {
        const allExpenseCatags = await expenseCatagGetAllService();
        return res.json({ success: true, expenseCatags: allExpenseCatags });
    } catch (err) {
        return res.json({ success: false, msg: "Error getting expense categories" });
    }
};


export const expenseCatagDelete = async (req, res) => {
    try {
        let { id } = req.params;

        if (!id) {
            return res.json({ success: false, msg: "Catagory id not found" });
        }

        let localExpenseCatagModel = getLocalExpenseCategoryModel();

        let deleted = await expenseCatagDeleteService(id);

        if (!deleted) {
            return res.json({ success: false, msg: "No catagory found with this id" });
        }

        // Track document change
        await changeTrackDocsCreationFunc("delete", localExpenseCatagModel.modelName, id);

        // Return updated list
        let allExpenseCatags = await expenseCatagGetAllService();

        return res.json({ success: true, expenseCatags: allExpenseCatags });
    } catch (err) {
        return res.json({ success: false, msg: "Error deleting expense catagory" });
    }
};
















export async function getCatagBasedExpense(req, res) {
    try {
        let { catagName } = req.body
        if (!catagName) {
            return res.json({ success: false, msg: "The catag is not found." })
        }

        let expenses = await getCatagBasedExpenseService(catagName);

        return res.json({ success: true, expenses })

    } catch (error) {
        return res.json({ success: false, msg: error?.message, stack: error?.stack })
    }
}