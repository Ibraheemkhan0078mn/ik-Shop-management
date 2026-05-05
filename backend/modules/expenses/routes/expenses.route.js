import express from "express";
import { expenseCatagCreate, expenseCatagDelete, expenseCatagGetAll, expenseCreate, expenseDelete, expenseUpdate, getCatagBasedExpense, getExpenses, } from "../controllers/expense.controller.js";
const router = express.Router();


router.post("/expense", expenseCreate);
router.get("/getExpense/:skip/:limit/:date", getExpenses);
router.put("/expense", expenseUpdate);
router.delete("/expense", expenseDelete);
router.post("/expenseCatagCreate", expenseCatagCreate)
router.delete("/expenseCatagDelete/:id", expenseCatagDelete)
router.get("/expenseCatagGetAll", expenseCatagGetAll)
router.post("/getCatagBasesExpense", getCatagBasedExpense)


export default router;
