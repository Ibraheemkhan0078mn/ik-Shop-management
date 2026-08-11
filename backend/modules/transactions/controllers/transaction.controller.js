import asyncHandler from "express-async-handler";
import {
    getTransactions,
    getTransactionById,
    getTransactionsBySource,
    createTransaction,
    updateTransaction,
    deleteTransaction,
} from "../services/transaction.service.js";

export const getAllTransactions = asyncHandler(async (req, res, next) => {
    const filter = req.body || {};
    const transactions = await getTransactions(filter);
    
    res.status(200).json({
        success: true,
        message: "Transactions retrieved successfully",
        data: transactions,
    });
});

export const getTransactionDataById = asyncHandler(async (req, res, next) => {
    const transaction = await getTransactionById(req.params.id);
    res.status(200).json({
        success: true,
        message: "Transaction retrieved successfully",
        data: transaction,
    });
});

export const createTransactionData = asyncHandler(async (req, res, next) => {
    const transactionData = {
        ...req.body,
        createdBy: req.user?._id,
    };
    const transaction = await createTransaction(transactionData);
    res.status(201).json({
        success: true,
        message: "Transaction created successfully",
        data: transaction,
    });
});

export const updateTransactionData = asyncHandler(async (req, res, next) => {
    const transaction = await updateTransaction(req.params.id, req.body);
    res.status(200).json({
        success: true,
        message: "Transaction updated successfully",
        data: transaction,
    });
});

export const deleteTransactionData = asyncHandler(async (req, res, next) => {
    await deleteTransaction(req.params.id);
    res.status(200).json({
        success: true,
        message: "Transaction deleted successfully",
    });
});
