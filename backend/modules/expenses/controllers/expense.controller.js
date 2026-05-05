import { getLocalExpensesModel, getLocalExpenseCategoryModel } from "../../../configs/connect.db.js";
import { ApiError } from "../../../common/services/apiResponses.js";
import { getCustomStartEndMonthRanges } from "../../../common/services/date.js";
import { changeTrackDocsCreationFunc } from "../../../common/ikSync/changeTrackModelCreation.js";




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

        let createdExpense = await expenseModel.create({
            amount,
            type,
            date: new Date(date),
            notes: notes || "",
            category
        });


        if (!createdExpense) {
            return res.json({ success: false, msg: "The expense doc is nto created" })
        }





        await changeTrackDocsCreationFunc("create", expenseModel.modelName, createdExpense?._id)

        let expenses = await expenseModel.find().sort({ createdAt: -1 });


        return res.json({ success: true, msg: "Expense created", expenses });
    } catch (err) {
        console.log(err)
        return ApiError(err, res)
    }
}










export const getExpenses = async (req, res) => {
    try {
        let expenseModel = getLocalExpensesModel();
        let skip = parseInt(req.params.skip) || 0;
        let limit = parseInt(req.params.limit) || 20;
        let date = req.params.date;
        console.log(date, "THe date from getExepses")

        console.log(skip, limit, date, "from expense get route");
        let expenses = [];

        if (date == "none") {
            // Default: createdOn ke basis pe latest first
            expenses = await expenseModel
                .find()
                .sort({ date: -1 })
                .limit(limit)
                .skip(skip);
        } else {
            // Month select karne pe: createdOn ke basis pe filter aur sort
            let dateObj = new Date(date);
            let { startDateFormat, endDateFormat } = getCustomStartEndMonthRanges(dateObj, dateObj)
            // let year = dateObj.getFullYear();
            // let month = dateObj.getMonth(); // 0-indexed (0 = Jan)

            // let startOfMonth = new Date(year, month, 1);
            // let endOfMonth = new Date(year, month + 1, 0, 23, 59, 59, 999); // Month ka last day

            expenses = await expenseModel
                .find({
                    date: {
                        $gte: startDateFormat,
                        $lte: endDateFormat
                    }
                })
                .sort({ createdOn: -1 }) // Latest first
                .limit(limit)
                .skip(skip);
        }

        return res.json({ success: true, expenses: expenses || [] });
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

        let updated = await expenseModel.findOneAndUpdate(
            { _id: _id },
            { amount, type, date, notes, category },
            { new: true }
        );

        if (!updated) {
            return res.json({ success: false, msg: "Expense not found" });
        }



        await changeTrackDocsCreationFunc("update", expenseModel.modelName, updated?._id)



        let expenses = await expenseModel.find().sort({ createdAt: -1 });


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

        let deleted = await expenseModel.findOneAndDelete({ _id: _id });

        if (!deleted) {
            return res.json({ success: false, msg: "Expense not found" });
        }



        await changeTrackDocsCreationFunc("delete", expenseModel.modelName, _id)


        let expenses = await expenseModel.find().sort({ createdAt: -1 });


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
        let createdExpenseCatag = await localExpenseCatagModel.create({
            name: catagName
        })


        await changeTrackDocsCreationFunc("create", localExpenseCatagModel.modelName, createdExpenseCatag?._id)

        let allExpenseCatags = await localExpenseCatagModel.find()


        return res.json({ success: true, expenseCatags: allExpenseCatags })
    } catch (err) {
        console.log(error)
        return res.json({ success: false, msg: "Error deleting expense" });
    }
}

export const expenseCatagGetAll = async (req, res) => {
    try {
        let localExpenseCatagModel = getLocalExpensesModel();

        let allExpenseCatags = await localExpenseCatagModel.find();

        if (allExpenseCatags?.length > 0) {
            const seenNames = new Set();
            const deletedIds = new Set();

            for (let expCatag of allExpenseCatags) {
                let expCatagName = expCatag.name.toLowerCase().trim();

                if (seenNames.has(expCatagName)) {
                    // This is a duplicate — delete it
                    deletedIds.add(expCatag._id.toString());
                    await localExpenseCatagModel.findOneAndDelete({ _id: expCatag._id });
                } else {
                    // First occurrence — keep it
                    seenNames.add(expCatagName);
                }
            }
        }

        // Re-fetch after deletions so frontend gets clean data
        const cleanExpenseCatags = await localExpenseCatagModel.find();

        return res.json({ success: true, expenseCatags: cleanExpenseCatags });

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

        let localExpenseCatagModel = getLocalExpensesModel();

        let deleted = await localExpenseCatagModel.findByIdAndDelete(id);

        if (!deleted) {
            return res.json({ success: false, msg: "No catagory found with this id" });
        }

        // Track document change
        await changeTrackDocsCreationFunc("delete", localExpenseCatagModel.modelName, id);

        // Return updated list
        let allExpenseCatags = await localExpenseCatagModel.find();

        return res.json({ success: true, expenseCatags: allExpenseCatags });
    } catch (err) {
        return res.json({ success: false, msg: "Error deleting expense catagory" });
    }
};
















export async function getCatagBasedExpense(req, res) {
    try {

        let { catagName } = req.body
        let localExpenseModel = getLocalExpensesModel()
        if (!catagName) {
            return res.json({ success: false, msg: "The catag is not found." })
        }


        let expenses = await localExpenseModel.find({
            category: { $regex: catagName, $options: "i" }
        });


        return res.json({ success: true, expenses })

    } catch (error) {
        return res.json({ success: false, msg: error?.message, stack: error?.stack })
    }
}